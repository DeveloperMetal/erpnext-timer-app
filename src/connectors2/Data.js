import React from 'react';
import { ipcRenderer } from 'electron';

export class ConnectorError extends Error {
  constructor(message, info, error) {
    super(message);
    this.info = info;
    this.icon = 'globe-network';
    this.intent = 'DANGER';
    this.timeout = 5000;
    // track inner errors that caused this one to happen
    if (error) {
      this.original = error;
      let message_lines = (this.message.match(/\n/g) || []).length + 1
      // append the initial error's stack to this one to get a complete picture
      this.stack = this.stack.split('\n').slice(0, message_lines + 1).join('\n') + '\n' +
        error.stack
    }
  }
}

export class LoginError extends ConnectorError { }
export class ReadError extends ConnectorError { }
export class UpdateError extends ConnectorError { }
export class CreateError extends ConnectorError { }
export class DeleteError extends ConnectorError { }
export class ConnectorNotReady extends ConnectorError { }
export class InvalidOperation extends ConnectorError { }

function bindCallbacks(obj, names) {
  console.log("Bind: ", obj, names);
  let result = {}
  names.forEach(name => Reflect.set(result, name, Reflect.get(obj, name).bind(obj)));
  return result;
}

const context = React.createContext();

export class BackendProvider extends React.PureComponent {
  constructor(props) {
    super(props);

    // TODO: Change the require() type of import to another connector in the future
    //       This just shows how easy it would be to replate the backend if necessary.
    this.connector = require("./ErpNext").default;

    this.state = {
      loggedIn: false,
      attemptingLogin: false,
      auth: null,
      actions: {
        ...bindCallbacks(this, [
          "throwError",
          "login"
        ]),
      }
    }
  }

  throwError(err, rethrow=true) {
    this.setState(prevState => {
      errors: [...prevState.errors, err]
    });

    if ( rethrow ) {
      // rethrow error so we can handle it upstream
      throw err;
    }
  }

  login(auth, done) {
    if ( !auth ) {
      auth = {
        host: ipcRenderer.sendSync('getSetting', 'host'),
        usr: ipcRenderer.sendSync('getSetting', 'usr'),
        pwd: ipcRenderer.sendSync('getSetting', 'pwd'),
      };
    }
    this.setState({
      attemptingLogin: true,
    }, () => {
      this.connector.login(auth)
        .then(() => {
          this.setState({
            attemptingLogin: false,
            loggedIn: true,
            auth,
          }, () => {
            if ( typeof done === "function" ) done(true, null)
          })
        })
        .catch(err => {
          this.setState({
            attemptingLogin: false,
            loggedIn: false
          }, () => {
            if ( typeof done === "function" ) done(false, err)
          })
          this.throwError(err)
        });
      });
  }

  render() {
    return <context.Provider value={this.state} {...this.props} />;
  }
}

export const BackendConsumer = (props) => {
  return <context.Consumer {...props} />;
}
