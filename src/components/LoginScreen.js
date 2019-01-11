// @flow

import { ipcRenderer, remote } from "electron";
import { mainProcessAPI } from "../utils";

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

    let rememberLogin = '';//ipcRenderer.sendSync('getSettings', 'rememberLogin', false);
    let autoLogin = '';//ipcRenderer.sendSync('getSetting', 'autoLogin', false);
    let host = '';//ipcRenderer.sendSync('getSetting', 'host', '');
    let usr = '', pwd = '';
    
    this.state = {
      auth: {
        host,
        usr,
        pwd
      },
      rememberLogin,
      autoLogin,
      loadingSettings: true
    }

    mainProcessAPI('getLoginInfo')
      .then((result) => {
        this.setState({
          auth: result.auth,
          ...result.options,
          loadingSettings: false
        });

        if ( result.options.autoLogin ) {
          this.autoLogin();
        }    
      });
  }

  autoLogin() {
    this.props.backend.actions.login(this.state.auth, (loggedIn, err) => {
      if ( loggedIn ) {
        if ( typeof this.props.onLoggedIn === "function") {
          this.props.onLoggedIn(this.state.auth, null);
        } else {
          console.error("Missing onLoggedIn callback in LoginScreen props");
        }
      } else {
        console.warn("Could not auto loggin...", err);
      }
    });
  }

  render() {
    const { backend, onLoggedIn } = this.props;
    const onLoginAction = (auth : DataTypes.Auth, options: DataTypes.LoginOptions) => {
      backend.actions.login(auth, (loggedIn : boolean, err? : Error) => {
        if ( loggedIn ) {
          onLoggedIn(auth, options)
        } else {
          console.error(err);
        }
      });
    }

    return <React.Fragment>
      <div id='app' className='bp3-dark'>
        <div id='content'>
          <div className="dead-center">

            { /* BOF - Login form and spinner */}

            { /* Show spinner while attempting to login */ }
            { (backend.attemptingLogin || this.state.loadingSettings) && (
              <Spinner size={Spinner.SIZE_LARGE} />
            )}

            { /* Otherwise, show the login widget */ }
            { !backend.attemptingLogin && !backend.loggedIn && !this.state.loadingSettings && (
              <Login 
                {...this.state.auth}
                autoLogin={this.state.autoLogin} 
                rememberLogin={this.state.rememberLogin} 
                onLoginAction={onLoginAction} 
              />
            )}

            { /* EOF - Login form and spinner */}
          </div>
        </div>
      </div>
      <div id="app-version">v{version}</div>
    </React.Fragment> 
  }
}