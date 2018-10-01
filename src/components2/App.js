// Third party Components
import React from 'react';
import { MemoryRouter, Route, NavLink, Switch, Redirect } from 'react-router-dom';
import { Condition, When, Else } from 'bloom-conditionals';
import { Button, ButtonGroup, Spinner, Intent, Alignment, Position, Toaster, Toast } from '@blueprintjs/core';
import cls from 'classnames';


// App Components
import { BackendProvider, BackendConsumer } from '../connectors2/Data';
import Login from './Login';


class App extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      displayApp: false
    }
  }

  onLoggedIn(auth) {
    this.setState({
      displayApp: true
    });
  }

  render() {
    const { onLoggedIn } = (...args) => this.onLoginAction(...args)

    return <BackendProvider>
      { /* We separate the display app function from login conditions to keep logic tree light */ }
      <Condition test={this.state.displayApp}>
        <When true>
          <AppWithNavigation />
        </When>

        <Else>
          <BackendConsumer>
            { (backend) => <LoginScreen backend={backend} onLoggedIn={onLoggedIn} />  }
          </BackendConsumer>
        </Else>

      </Condition>

    </BackendProvider>
  }
}

class LoginScreen extends React.PureComponent {

  constructor(props) {
    super(props)

    this.state = {
      errorInfo: false
    }
  }

  autoLogin() {
    if ( this.props.backend ) {
      this.props.backend.actions.login();
    } else {
      this.setState({
        errorInfo: {
          message: "Lost backend state, please restart app"
        }
      })
    }
  }

  componentDidMount() {
    if ( this.props.backend ) {
      this.autoLogin();
    }
  }

  render() {
    const { backend, onLoggedIn } = this.props;
    const { errorInfo } = this.state;
    const onLoginAction = (auth) => backend.actions.login(auth, () => onLoggedIn());

    return <React.Fragment>
      <Condition test={errorInfo}>
        <When value={v => v?true:false}>
          <div>Error: </div>
          <div className="error">{errorInfo.message}</div>
        </When>
        <Else>

          <div id='app' className='bp3-dark'>
            <div id='content'>

              { /* BOF - Login form and spinner */}
              <Condition test={backend.attemptingLogin}>

                { /* Show spinner while attempting to login */ }
                <When true>
                    Spinner
                    <div className='dead-center'>
                      <Spinner size={Spinner.SIZE_LARGE} />
                    </div>
                </When>

                { /* Otherwise, show the login widget */ }
                <Else>
                  <Condition test={backend.loggedIn}>
                    <When false>
                      <Login onLoginAction={onLoginAction} />
                    </When>
                    <Else>Wut?</Else>
                  </Condition>
                </Else>

              </Condition> 
              { /* EOF - Login form and spinner */}

            </div>
          </div>

        </Else>
      </Condition>

    </React.Fragment> 
  }
}

class AppWithNavigation extends React.PureComponent {
  render() {
    return <div id='app' className='bp3-dark'>

      <div id='content'>
      TEST
      </div>
    </div>
  }
}

export default App;