import React from "react";
import moment from "moment";

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
  let result = {}
  names.forEach(name => Reflect.set(result, name, Reflect.get(obj, name).bind(obj)));
  return result;
}

function safeCall(cb, ...args) {
  if ( typeof cb === "function" ) {
    return new Promise((resolve, reject) => {
      try {
        resolve(cb(...args));
      } catch (err) {
        console.error(err);
        reject(err);
      }
    })
  } else {
    return Promise.Reject(new InvalidOperation("Callback is not a function"));
  }
}

function defferedSafeCall(cb, ...args) {
  return () => safeCall(cb, ...args);
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
          "login",
          "listTasks",
          "startTask",
          "stopTask"
        ]),
      }
    }
  }

  throwError(err, rethrow=true, done=null) {
    console.error("ERROR IN BACKEND CALL: ", err);

    this.setState(prevState => {
      errors: [...prevState.errors, err]
    });

    if ( rethrow ) {
      // rethrow error so we can handle it upstream
      throw err;
    } else if ( typeof done === "function" ) {
      done(err);
    }
  }

  login(auth, done) {
    this.setState({
      attemptingLogin: true,
      loggedIn: false,
    }, () => {
      this.connector.login(auth)
        .then(user => {
          this.setState({
            attemptingLogin: false,
            loggedIn: true,
            auth,
            user
          }, defferedSafeCall(done, user, null))
        })
        .catch(err => {
          this.setState({
            attemptingLogin: false,
            loggedIn: false,
            auth: null
          }, () => 
            this.throwError(
              err, 
              false, 
              defferedSafeCall(done, false, err)
            ));
          
        });
      });
  }

  listTasks(done) {
    this.connector.listTasks()
      .then(tasks => {
        safeCall(done, tasks);
      })
      .catch(err => this.throwError(
        err, 
        false, 
        defferedSafeCall(done, [], err)
      ));
  }

  startTask(task_name, project_name, done) {
    let timestamp = moment.utc();
    this.connector.startTask(task_name, project_name, timestamp, this.state.user.employee_name)
      .then(() => {
        safeCall(done, true);
      })
      .catch(err => {
        this.throwError(err, false, defferedSafeCall(done, false))
      });
  }

  stopTask(task_name, done) {
    let timestamp = moment.utc();
    this.connector.stopTask(task_name, timestamp, this.state.user.employee_name)
      .then(() => {
        safeCall(done, true);
      })
      .catch(err => {
        this.throwError(err, false, defferedSafeCall(done, false))
      });
  }

  render() {
    return <context.Provider value={this.state} {...this.props} />;
  }
}

export const BackendConsumer = (props) => {
  return <context.Consumer {...props} />;
}
