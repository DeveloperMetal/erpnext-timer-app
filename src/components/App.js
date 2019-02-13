// @flow
import { ipcRenderer } from "electron";

// Third party Components
import React from "react";
import { Icon, Button, ButtonGroup, Spinner, Intent, Alignment, Position, Toaster, Toast, ProgressBar } from "@blueprintjs/core";
import cls from "classnames";

// App Components
import { BackendProvider, BackendConsumer } from "../connectors/Data";
import Login from "./Login";
import LoginScreen from "./LoginScreen";
import AppWithNavigation from "./AppWithNavigation";
import IdleMessage from "./IdleMessage";

// flow types
import * as Types from "./Types.flow";
import * as DataTypes from "../connectors/Data.flow";
import * as AppTypes from "./App.flow";


export class App extends React.Component<AppTypes.Props, AppTypes.State> {

  backend : any;

  constructor(props : AppTypes.Props) {
    super(props);

    this.state = {
      displayApp: false,
      displayChangeLog: false,
      changeLog: {},
      updateProgress: null,
      updateReady: false
    }

    ipcRenderer.on("update-download-progress", (e, p) => {
      this.setState({
        updateProgress: p
      })
    });

    ipcRenderer.on("update-ready", (e) => {
      this.setState({
        updateReady: true
      })
    });

    ipcRenderer.on("user-logout", (e) => {
      if ( this.backend ) {
        this.backend.actions.logout();
        ipcRenderer.sendSync('setSetting', 'autoLogin', false);
        this.setState({
          displayApp: false
        });
        ipcRenderer.send("user-logout");
      }
    });

  }

  installUpdate() {
    ipcRenderer.send("update-install");
  }

  onLoggedIn(auth : DataTypes.Auth, options : DataTypes.LoginOptions | null) {
    if ( options ) {
      if ( options.rememberLogin ) {
        ipcRenderer.sendSync('saveCredentials', auth.usr, auth.pwd);
        ipcRenderer.sendSync('setSetting', 'autoLogin', options.autoLogin);
        ipcRenderer.sendSync('setSetting', 'usr', auth.usr);
      } else {
        ipcRenderer.sendSync('removeCredentials', auth.usr);
        ipcRenderer.sendSync('setSetting', 'autoLogin', false);
        ipcRenderer.sendSync('setSetting', 'usr', '');
      }
      ipcRenderer.sendSync('setSetting', 'rememberLogin', options.rememberLogin);
      ipcRenderer.sendSync('setSetting', 'host', auth.host);
    }

    this.setState({
      displayApp: true
    });

    ipcRenderer.send("user-login");
  }

  renderUpdaterProgress() {
    const { updateProgress, updateReady } = this.state;

    if ( updateReady ) {
      return <div id="updater-bar"><Button fill intent={Intent.SUCCESS} text="New version ready. Restart Now!" icon="issue" onClick={() => this.installUpdate()} /></div>
    }

    if ( !updateProgress ) {
      return [];
    }

    return <div id="updater-bar"><ProgressBar  value={updateProgress.percent / 100} /></div>
  }

  render() {
    const onLoggedIn : Types.CallbackOnLoggedIn = 
      (auth : DataTypes.Auth, options : DataTypes.LoginOptions | null) => {
        return this.onLoggedIn(auth, options);
      }

    return <BackendProvider>
      <BackendConsumer>
        { (backend) => {
          this.backend = backend;
          return [];
        }}
      </BackendConsumer>

      { /* We separate the display app function from login conditions to keep logic tree light */ }
      { this.state.displayApp && (
          <AppWithNavigation />
      )}

      { !this.state.displayApp && (
        <BackendConsumer>
          { (backend) => <LoginScreen backend={backend} onLoggedIn={onLoggedIn} />  }
        </BackendConsumer>
      )}

      <BackendConsumer>
        { (backend : DataTypes.State) => {
          return (
            <React.Fragment>
              <Toaster 
                position={Position.TOP}
              >
                { backend.userMessages.map(msg => <Toast 
                    {...msg}
                    key={msg.message}
                    message={msg.message}
                    onDismiss={() => {
                      backend.actions.dismissMessage(msg)
                    }}
                  />
                ) }
              </Toaster>
              { <IdleMessage backend={backend} /> }
            </React.Fragment>
          )
        }}
      </BackendConsumer>

      { this.renderUpdaterProgress() }
  
    </BackendProvider>
  }
}

export default App;