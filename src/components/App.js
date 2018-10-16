// @flow
import { ipcRenderer } from "electron";

// Third party Components
import React from "react";
import { Icon, Button, ButtonGroup, Spinner, Intent, Alignment, Position, Toaster, Toast } from "@blueprintjs/core";
import cls from "classnames";

import { Condition, When, Else } from "bloom-conditionals";

// App Components
import { BackendProvider, BackendConsumer } from "../connectors/Data";
import Login from "./Login";
import LoginScreen from "./LoginScreen";
import AppWithNavigation from "./AppWithNavigation";

// flow types
import * as Types from "./Types.flow";
import * as DataTypes from "../connectors/Data.flow";
import * as AppTypes from "./App.flow";


export class App extends React.Component<AppTypes.Props, AppTypes.State> {

  constructor(props : AppTypes.Props) {
    super(props);

    this.state = {
      displayApp: false
    }
  }

  onLoggedIn(auth : DataTypes.Auth) {
    this.setState({
      displayApp: true
    });
  }

  render() {
    const onLoggedIn : Types.CallbackOnLoggedIn = (auth : DataTypes.Auth) => this.onLoggedIn(auth)

    return <BackendProvider>
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
          return <Toaster 
              position={Position.TOP}
            >
              { backend.errors.map(err => <Toast 
                  {...err}
                  key={err.message}
                  message={err.message}
                  onDismiss={() => {
                    backend.actions.dismissError(err)
                  }}
                />
              ) }
            </Toaster>
        }}
      </BackendConsumer>
  
    </BackendProvider>
  }
}

export default App;