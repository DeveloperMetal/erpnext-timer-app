// @flow

import { ipcRenderer, remote } from "electron";
import { mainProcessAPI } from "../utils";
import classNames from "classnames";

// Flow types
import * as Types from "./Types.flow";
import * as DataTypes from "../connectors/Data.flow";
import * as LoginTypes from "./LoginScreen.flow";

// Thirdparty components
import React from "react";
import { Icon, Button, ButtonGroup, Spinner, Intent, Alignment, Position, Toaster, Toast } from "@blueprintjs/core";

// Components
import Login from "./Login";
import ChangeLog from "./ChangeLog";

const version = remote.app.getVersion();

export default class extends React.PureComponent<LoginTypes.Props, LoginTypes.State> {

  constructor(props : LoginTypes.Props) {
    super(props)

    let rememberLogin = false;
    let autoLogin = false;
    let host = '';
    let usr = '', pwd = '';
    
    this.state = {
      auth: {
        host,
        usr,
        pwd
      },
      rememberLogin,
      autoLogin,
      loadingSettings: true,
      displayChangeLog: false,
      changeLog: [],
      lastChangeLogVersion: ""
    }

  }

  componentDidMount() {

    mainProcessAPI('appStarted')
      .then((response) => {
        if ( response.displayChangeLog ) {
          // odd issue where ipc changes array to object
          let changeLog = response.changeLog || [];
          if ( changeLog && typeof changeLog.constructor !== Array ) {
            console.log(changeLog);
            changeLog = Object.keys(changeLog).map((k) => changeLog[k]);
          }
          this.setState({
            displayChangeLog: response.displayChangeLog,
            changeLog,
            lastChangeLogVersion: response.lastChangeLogVersion
          })
        }
      })
      .then(() => mainProcessAPI('getLoginInfo'))
      .then((response) => {
        this.setState({
          auth: response.auth,
          ...response.options,
          loadingSettings: false
        });

        if ( !this.state.displayChangeLog && response.options.autoLogin ) {
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
      this.setState({
        auth,
        ...options
      });

      backend.actions.login(auth, (loggedIn : boolean, err? : Error) => {
        if ( loggedIn ) {
          onLoggedIn(auth, options)
        } else {
          console.error(err);
        }
      });
    }
    const onChangeLogClose = () => {
      this.setState({
        displayChangeLog: false
      });

      if ( this.state.autoLogin ) {
        this.autoLogin();
      }
    }

    return <React.Fragment>
      <div id='app' className='bp3-dark'>
        <div id='content'>
          <div className={ classNames({"flex-fill": this.state.displayChangeLog, "dead-center": !this.state.displayChangeLog}) }>

            { /* BOF - Login form and spinner */}

            { /* Show spinner while attempting to login */ }
            { (backend.attemptingLogin || this.state.loadingSettings) && (
              <Spinner size={Spinner.SIZE_LARGE} />
            )}

            { /* Otherwise, show the login widget */ }
            { !this.state.displayChangeLog && !backend.attemptingLogin && !backend.loggedIn && !this.state.loadingSettings && (
              <Login 
                {...this.state.auth}
                autoLogin={this.state.autoLogin} 
                rememberLogin={this.state.rememberLogin} 
                onLoginAction={onLoginAction} 
              />
            )}

            {/* Display Changelog */}
            { this.state.displayChangeLog && (
              <ChangeLog 
                onClose={ onChangeLogClose } 
                lastChangeLogVersion={ this.state.lastChangeLogVersion }
                changeLog={ this.state.changeLog } />
            )}

            { /* EOF - Login form and spinner */}
          </div>
        </div>
      </div>
      <div id="app-version">v{version}</div>
    </React.Fragment> 
  }
}