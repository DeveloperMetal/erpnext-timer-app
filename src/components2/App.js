import { ipcRenderer } from "electron";

// Third party Components
import React from "react";
import { MemoryRouter, Route, NavLink, Switch, Redirect } from "react-router-dom";
import { Icon, Button, ButtonGroup, Spinner, Intent, Alignment, Position, Toaster, Toast } from "@blueprintjs/core";
import cls from "classnames";

import { Condition, When, Else } from "bloom-conditionals";
import VerticalNav from "bloom-nav-column";

// App Components
import { BackendProvider, BackendConsumer } from "../connectors2/Data";
import Login from "./Login";
import TaskPage from "./Tasks";


export class App extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      displayApp: false
    }
  }

  onLoggedIn(auth) {
    console.log("Got logged in callback...");
    this.setState({
      displayApp: true
    });
  }

  render() {
    const onLoggedIn = (auth) => this.onLoggedIn(auth)

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
  
    </BackendProvider>
  }
}

class LoginScreen extends React.PureComponent {

  constructor(props) {
    super(props)

    this.state = {
      auth: {
        host: ipcRenderer.sendSync('getSetting', 'host'),
        usr: ipcRenderer.sendSync('getSetting', 'usr'),
        pwd: ipcRenderer.sendSync('getSetting', 'pwd'),
      }
    }
  }

  autoLogin() {
    this.props.backend.actions.login(this.state.auth, (loggedIn, err) => {
      if ( loggedIn ) {
        if ( typeof this.props.onLoggedIn === "function") {
          this.props.onLoggedIn();
        } else {
          console.error("Missing onLoggedIn callback in LoginScreen props");
        }
      } else {
        console.warn("Could not auto loggin...", err);
      }
    });
  }

  componentDidMount() {
    this.autoLogin();
  }

  render() {
    const { backend, onLoggedIn } = this.props;
    const { errorInfo } = this.state;
    const onLoginAction = (auth) => backend.actions.login(auth, (loggedIn, err) => {
      if ( loggedIn ) {
        onLoggedIn()
      } else {
        console.log(err);
      }
    });

    return <React.Fragment>
      <div id='app' className='bp3-dark'>
        <div id='content'>

          { /* BOF - Login form and spinner */}

          { /* Show spinner while attempting to login */ }
          { backend.attemptingLogin && (
            <div className='dead-center'>
              <Spinner size={Spinner.SIZE_LARGE} />
            </div>
          )}

          { /* Otherwise, show the login widget */ }
          { !backend.attemptingLogin && !backend.loggedIn && (
            <Login {...this.state.auth} onLoginAction={onLoginAction} />
          )}

          { /* EOF - Login form and spinner */}

        </div>
      </div>

    </React.Fragment> 
  }
}

class AppWithNavigation extends React.PureComponent {

  constructor(props) {
    super(props)

    const iconSize = 24;
    this.state = {
      activePath: "timesheet/tasks",
      iconSize,
      menuCollapsed: true,
      menuItems: [
        {
          path: "expand",
          label: "Collapse",
          icon: <Icon icon="menu" iconSize={iconSize} />
        },
        {
          path: "timesheet",
          label: "Timesheet",
          icon: <Icon icon="calendar" iconSize={iconSize} />,
          items: [
            {
              path: "tasks",
              label: "Tasks",
              icon: <Icon icon="issue" iconSize={iconSize} />,
            },
            {
              path: "new-task",
              label: "New Task",
              icon: <Icon icon="plus" iconSize={iconSize} />,
            },
          ]
        },
        { expand: true },
        {
          path: "settings",
          label: "Settings",
          icon: <Icon icon="settings" iconSize={iconSize} />,
        }
  
      ]
    }
  }

  onPathChange(path) {
    if ( path != "expand" ) {
      this.setState({
        activePath: path
      })
    } else {
      let menuItems = this.state.menuItems.slice(0);
      let menuCollapsed = !this.state.menuCollapsed;
      menuItems[0].rightIcon = <Icon icon={menuCollapsed?"caret-right":"caret-left"} />;
      this.setState({
        menuItems,
        menuCollapsed
      });
    }
  }

  render() {
    const { iconSize, menuItems, activePath } = this.state;
    const onPathChange = (path) => this.onPathChange(path);

    return <div id='app' className='bloom'>
      <VerticalNav
        defaultPath="timesheet/tasks" 
        activePath={activePath}
        items={menuItems} 
        collapsed={this.state.menuCollapsed} 
        itemHeightHint={iconSize + 14} 
        onPathChange={onPathChange}
      />
      <div id='content'>
        { activePath === "timesheet/tasks" && ( <TaskPage /> )}
      </div>
    </div>
  }
}

export default App;