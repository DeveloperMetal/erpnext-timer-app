// --- app Framework
import React from 'react'
import { MemoryRouter, Route, NavLink, Switch } from "react-router-dom";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import { ipcRenderer } from 'electron';
import axios from 'axios';
import ErpNextConnector from './ErpNext';

// --- ui framework
import { Button, ButtonGroup, Spinner, Intent } from "@blueprintjs/core";

// --- Pages 
import { AppToaster } from "./AppToaster";
import Timesheet from "./Timesheet";
import Settings from "./Settings";
import Login from "./Login";

export default class App extends React.Component {

  constructor(props) {
    super(props);
    let auth = {
      host: ipcRenderer.sendSync('getSetting', 'host'),
      usr: ipcRenderer.sendSync('getSetting', 'usr'),
      pwd: ipcRenderer.sendSync('getSetting', 'pwd'),
    };

    this.state = {
      displayNavText: false,
      lastIdle: 0,
      loggingIn: auth.host && auth.usr && auth.pwd,
      loggedIn: false,
      auth,
      backend: new ErpNextConnector()
    }

    // queue up auto login, if fails it should display login page as default
    if ( auth.host && auth.usr && auth.pwd ) {
      setTimeout(() => {
        this.login()
        .then(response => {
          this.setState({
            loggingIn: false,
            loggedIn: true, 
          });
          return response;
        })
        .catch(err => {
          AppToaster.show({ 
            icon: "globe-network",
            intent: Intent.DANGER,
            message: "Error logging in with stored username and password. \nTODO: Parse request errors..." 
          });
          this.setState({
            loggingIn: false,
            loggedIn: false
          });
          console.log("Failed auto login: ", err);
        })
      }, 10);
    }

    setInterval(() => {
      // issue checking for idle time every 60 seconds
      ipcRenderer.send('getIdleTime');
    }, 60000); // once a minute check

    // wait for idle query response
    ipcRenderer.on('setIdleTime', (event, arg) => {
      this.setState({
        lastIdle: arg
      });
    })
  }

  login(auth) {
    if ( auth === undefined ) {
      auth = this.state.auth;
    }

    // wraps login into a promise so we can flag state as "logging in" and wait for page rendering
    // before issuing actual remote login request.
    return new Promise((resolve) => {
      // update logging in state so we have a responsive app
      this.setState({
        loggingIn: true
      }, () => {
        // after rendering, we issue the login request
        let loginPromise = this.state.backend.login(auth)
          .then(response => {
            // upon success we update state again to disable spinner state.
            this.setState({
              loggingIn: false
            });
            return response;
          })
        // return ajax promise so wrapping promise can continue chain.
        resolve(loginPromise);
      });
      return null;
    });
  }

  handleLoginAction(auth) {
    this.login(auth)
      .then(response => {
        // update app auth settings once we know our loggin works
        ipcRenderer.sendSync('setSetting', 'host', auth.host);
        ipcRenderer.sendSync('setSetting', 'usr', auth.usr);
        ipcRenderer.sendSync('setSetting', 'pwd', auth.pwd);

        // update rendering so we display main app
        this.setState({
          loggedIn: true, 
          auth
        });

        return response;
      })
      .catch(err => {
        // TODO: check error status to provider proper reason for error
        AppToaster.show({ 
          icon: "globe-network",
          intent: Intent.DANGER,
          message: "Unable to login. \nTODO: Parse request errors..." 
        });
        this.setState({
          loggingIn: false,
          loggedIn: false 
        })
      });
  }

  /**
   * Isolates renderging the actual app. Could have put it on its own component, but the setup is quite static already.
   * @param {object} location 
   */
  renderApp(location) {
    const navProps = {
      className: "bp3-dark",
      vertical: true,
      alignText: "left",
      large: true,
      minimal: true
    }

    const navText = (text) => {
      return this.state.displayNavText ? text : "";
    }

    const isPathActive = (match, location) => {
      return location.pathname == match;
    }

    return (
      <div id="app">

        <ButtonGroup id="nav" {...navProps} >

          <Button text={navText("Navigation")} rightIcon={this.state.displayNavText ? "caret-left" : "caret-right"}
            onClick={() => {
              this.setState({ displayNavText: !this.state.displayNavText });
            }} />

          <NavLink to="/">
            <Button text={navText("Time Sheet")} icon="calendar" active={isPathActive("/", location)} />
          </NavLink>

          <div className="flex-fill" />

          <NavLink to="/settings">
            <Button text={navText("Settings")} icon="cog" active={isPathActive("/settings", location)} />
          </NavLink>

        </ButtonGroup>

        <div id="content">
          <TransitionGroup>
            <CSSTransition key={location.key} classNames="fade" timeout={300}>
              <Switch location={location}>

                <Route path="/" exact component={Timesheet} />
                <Route path="/settings" exact component={Settings} />

              </Switch>
            </CSSTransition>
          </TransitionGroup>
        </div>
      </div>
    );
  }

  render() {
    return (
      <MemoryRouter>
        <Route
          render={({ location }) => {

            // toggle between rendering the app or spiner if we are in the process of logging in.
            if (this.state.loggedIn) {
              return this.renderApp(location);
            } else if ( this.state.loggingIn ) {
              return <div id="app" className="bp3-dark">
                <div id="content">
                  <div className="dead-center">
                    <Spinner size={Spinner.SIZE_LARGE} />
                  </div>
                </div>
              </div>;
            }

            // else while not logged it and not waiting to login, display login component
            return <div id="app" className="bp3-dark">
              <div id="content">
                <div className="dead-center">
                  <Login {...this.state.auth} onLoginAction={ this.handleLoginAction.bind(this) } />
                </div>
              </div>
            </div>;
          }
        }
        />
      </MemoryRouter>
    )
  }
}