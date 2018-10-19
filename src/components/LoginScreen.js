// @flow

import { ipcRenderer, remote } from "electron";

// Flow types
import * as Types from "./Types.flow";
import * as DataTypes from "../connectors/Data.flow";
import * as LoginTypes from "./LoginScreen.flow";

// Thirdparty components
import React from "react";
import { Icon, Button, ButtonGroup, Spinner, Intent, Alignment, Position, Toaster, Toast } from "@blueprintjs/core";

// Components
import Login from "./Login";

const version = remote.app.getVersion();

export default class extends React.PureComponent<LoginTypes.Props, LoginTypes.State> {

  constructor(props : LoginTypes.Props) {
    super(props)

    this.state = {
      auth: {
        host: ipcRenderer.sendSync('getSetting', 'host'),
        usr: ipcRenderer.sendSync('getSetting', 'usr'),
        pwd: ipcRenderer.sendSync('getSetting', 'pwd'),
      },
      autoLogin: ipcRenderer.sendSync('getSetting', 'autoLogin', false),
    }

  }

  autoLogin() {
    this.props.backend.actions.login(this.state.auth, (loggedIn, err) => {
      if ( loggedIn ) {
        ipcRenderer.synd('setSetting', 'host', this.state.auth.host);
        ipcRenderer.synd('setSetting', 'usr', this.state.auth.usr);
        ipcRenderer.synd('setSetting', 'pwd', this.state.auth.pwd);
        
        if ( typeof this.props.onLoggedIn === "function") {
          this.props.onLoggedIn(this.state.auth);
        } else {
          console.error("Missing onLoggedIn callback in LoginScreen props");
        }
      } else {
        console.warn("Could not auto loggin...", err);
      }
    });
  }

  componentDidMount() {
    if ( this.state.autoLogin ) {
      this.autoLogin();
    }
  }

  render() {
    const { backend, onLoggedIn } = this.props;
    const onLoginAction = (auth : DataTypes.Auth) => backend.actions.login(auth, (loggedIn : boolean, err? : Error) => {
      if ( loggedIn ) {
        onLoggedIn(auth)
      } else {
        console.error(err);
      }
    });

    return <React.Fragment>
      <div id='app' className='bp3-dark'>
        <div id='content'>
          <div className="dead-center">

            { /* BOF - Login form and spinner */}

            { /* Show spinner while attempting to login */ }
            { backend.attemptingLogin && (
              <Spinner size={Spinner.SIZE_LARGE} />
            )}

            { /* Otherwise, show the login widget */ }
            { !backend.attemptingLogin && !backend.loggedIn && (
              <Login {...this.state.auth} onLoginAction={onLoginAction} />
            )}

            { /* EOF - Login form and spinner */}
          </div>
        </div>
      </div>
      <div id="app-version">v{version}</div>
    </React.Fragment> 
  }
}