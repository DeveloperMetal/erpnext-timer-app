// @flow

import { trackError, trackUser, trackExtra } from "../tracking";
import { ipcRenderer } from 'electron';
import { mainProcessAPI } from '../utils';

// Flow types
import * as DataTypes from "./Data.flow";
import type Moment from "moment";

// Third party components
import React from "react";
import moment from "moment";

// Connector
import ErpNext from "./ErpNext";

export class ConnectorError extends Error {

  info: ?DataTypes.ErrorInfo;
  icon: string;
  intent: string;
  timeout: number;
  message: string;
  original: ?Error;

  constructor(message : string, info? : DataTypes.ErrorInfo | null, error? : Error | null, timeout : number = 10000) {
    super(message);
    this.info = info;
    this.icon = 'globe-network';
    this.intent = 'DANGER';
    this.timeout = timeout;
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

function bindCallbacks(obj : any, names : string[]) {
  let result : any = {}
  names.forEach(name => Reflect.set(result, name, Reflect.get(obj, name).bind(obj)));
  return result;
}

const context : any = React.createContext();

export class BackendProvider extends React.PureComponent<{}, DataTypes.State> {
  connector : DataTypes.ConnectorAPI;

  constructor(props : {}) {
    super(props);

    // TODO: Change the require() type of import to another connector in the future
    //       This just shows how easy it would be to replate the backend if necessary.
    this.connector = ErpNext;
    this.logoutGuardID = null;
    this.idleID = null;

    this.state = {
      hasInitialContent: false,
      loggedIn: false,
      attemptingLogin: false,
      idleTimeout: moment.duration(10, 'minutes'),
      idleTimeoutID: false,
      activeTaskID: false,
      displayIdleMessage: false,
      auth: {
        usr: "",
        pwd: "",
        host: ""
      },
      user: {
        employee_name: "",
        id: ""
      },
      day: moment(),
      timeline: [],
      tasks: [],
      taskStatuses: [],
      taskStatusFilter: [],
      userMessages: [],
      activities: [],
      projects: [],
      selectedProjects: [],
      actions: {
        ...bindCallbacks(this, [
          "throwError",
          "login",
          "logout",
          "listTasks",
          "startTask",
          "stopTask",
          "stopActiveTask",
          "setTaskStatus",
          "dismissMessage",
          "userMessage",
          "listDayTimeline",
          "updateActiveTimelineBlock",
          "updateTimelineBlock",
          "setCurrentDate",
          "newTask",
          "taskSearch",
          "getTaskById",
          "getUserDetails",
          "deleteTimeblock",
          "isProjectSelected",
          "getSelectedProjects",
          "clearSelectedProjects",
          "setSelectedProject",
          "unsetSelectedProject",
          "setTaskStatusFilter",
          "unsetTaskStatusFilter",
          "clearTaskStatusFilter",
          "getAllTaskStatuses",
          "getTaskStatusFilters"
        ]),
      }
    }
  }

  componentDidMount() {
    this.idleID = setInterval(() => {
      this.updateIdleTimer();
    }, 2000);

    this.logoutGuardID = setInterval(() => {
      // while we have a user id, just ping the backend to keep session from
      // timing out.
      if ( this.state.user && this.state.user.id ) {
        this.getUserDetails(this.state.user.id)
          .catch((err) => {
            console.log(err);
            this.logout();
          })
      }
    }, 60000 * 5)
  }

  componentWillUnmount() {
    if ( !!this.idleID ) {
      clearInterval(this.idleID);
      clearInterval(this.logoutGuardID);
      this.idleID = null;
      this.logoutGuardID = null;
    }
  }

  dismissMessage(msg : any) {
    this.setState(prevState => {
      return {
        userMessages: prevState.userMessages.filter(e => e !== msg)
      }
    });
  }

  throwError(err : ConnectorError, done? : (Error) => void) {
    console.log("---------------")
    console.error(err);
    trackError(err);

    if ( "info" in err && err.info ) {
      if ( "server_messages" in err.info ) {
        err.info.server_messages.forEach(serr => console.error(serr));
      }

      if ( "remoteTrace" in err.info ) {
        err.info.remoteTrace.forEach(rt => console.error(rt.join?rt.join("\n"):rt));
      }
    }

    this.setState((prevState : DataTypes.State) => {
      return { userMessages: [...prevState.userMessages, err] };
    }, () => {
      console.log(err);
      console.log(err.code);
      if ( typeof done === "function" ) {
        done(err);
      }
    });

    if ( !done ) {
      throw err;
    }
  }

  userMessage(message : string, done : () => void) {
    this.setState((prevState : DataTypes.State) => {
      return { userMessages: [...prevState.userMessages, message] };
    }, () => {
      if ( typeof done === "function" ) {
        done();
      }
    });
  }

  logout() {
    this.setState({
      attemptingLogin: false,
      loggedIn: false,
      auth: {
        usr: "",
        pwd: "",
        host: ""
      },
      user: {
        employee_name: "",
        id: ""
      }
    })
  }

  login(auth : DataTypes.Auth, done : DataTypes.ResultCallback) {

    this.setState({
      attemptingLogin: true,
      loggedIn: false,
    }, () => {
      this.connector.login(auth)
        .then(( user : DataTypes.User ) => {

          trackUser({
            username: auth.usr
          });

          trackExtra({
            "employee_name": user
          });

          mainProcessAPI('setServerUrl', auth.host);

          return new Promise((resolve) => {
            this.setState({
              attemptingLogin: false,
              loggedIn: true,
              auth,
              user
            }, () => {
              resolve(user);
              done(user);
            });
          });
        })
        .catch(err => {
          return new Promise((resolve, reject) => {
            this.setState({
              attemptingLogin: false,
              loggedIn: false,
              auth: {
                usr: "",
                pwd: "",
                host: ""
              }
            }, () => {
              this.throwError(
                err,
                () => done(false, err)
              );
              reject(err);
            });
          });
        });
      });
  }

  setCurrentDate( date : Moment ) : void {
    this.listDayTimeline(date)
  }

  listDayTimeline(date? : Moment) : Promise<void> {

    if ( !date ) {
      date = this.state.day;
    }

    return this.connector
      .listDayTimeline(this.state.user.employee_name, date)
      .then((results : DataTypes.TimelineItem[]) => {
        this.setState({
          timeline: results,
          day: date
        })
        return;
      });
  }

  updateActiveTimelineBlock(block_id : string, time : Moment) : void {
    let timeline = this.state.timeline.slice(0);
    let block = timeline.find(b => b.id === block_id);
    if ( block ) {
      block.end = time;
      this.setState({
        timeline
      });
    }
  }

  updateTimelineBlock(item : DataTypes.TimelineItem) : void {
    let timeline = this.state.timeline.slice(0);
    let idx = timeline.findIndex(b => b.id === item.id);
    if ( idx > -1 ) {
      // update local data so our UI doesn't freeze while network request
      // happens.
      timeline.splice(idx, 1, item);
      this.setState({
        timeline
      });

      // We'll correct our data after our network request returns
      // even if the backend server returns the same data, its good practice
      // to allow our app to correct itself.
      this.connector.updateTimelineItem(item)
        .then((item) => {
          return this.listTasks();
        })
        .then(() => {
          return this.listDayTimeline();
        });
    }
  }

  newTask(task : DataTypes.Task) {
    return this.connector.newTask(task, this.state.user.id)
      .then(() => {
        return this.listTasks();
      })
      .catch(err => this.throwError(err));
  }

  setTaskStatus(task : DataTypes.Task, status : string ) : Promise<any> {
    return this.connector.setTaskStatus(task, status)
      .then(() => {
        return this.listTasks();
      })
      .catch(err => this.throwError(err));
  }

  taskSearch(search : string, assigned_user : string) : Promise<string[]> {
    return this.connector
      .taskSearch(search, assigned_user, this.state.taskStatusFilter)
      .catch(err => this.throwError(err));
  }

  updateIdleTimer() {
    mainProcessAPI('getIdleTime').then((idle) => {
      if ( idle < 5 ) {
        if ( !!this.state.activeTaskID ) {
          const idleStartTS = moment().utc();
          const idleMaxTS = idleStartTS.add(this.state.idleTimeout);
          this.setState({
            idleStartTS,
            idleMaxTS
          });
        } else {
          this.setState({
            idleStartTS: false,
            idleMaxTS: false
          });
        }
      }
    });
  }

  stopActiveTask(removeDuration, duration) {
    let timestamp = moment()
    if ( removeDuration ) {
      timestamp = timestamp.subtract(duration);
    }

    let task = this.state.tasks.find((task) => task.id === this.state.activeTaskID);
    if ( task ) {
      return this.stopTask(task, timestamp);
    } else {
      return Promise.reject();
    }
  }

  listTasks() : Promise<void> {

    // always fetch list of available activities, just in case
    // we have new ones while app is running
    return Promise.all([
      this.connector.listTaskStatuses(),
      this.connector.listProjects(),
      this.connector.listActivities(),
      this.connector.listTasks(this.state.user.employee_name)
    ])
    .then(results => {
      let taskStatuses = results[0];
      let projects = results[1];
      let activities = results[2];
      let tasks = results[3];
      let activeTaskID = false;
      tasks.sort((a, b) => (a.is_running?1:0) < (b.is_running?1:0)? 1:0);

      // let figure out if we have a running task and inform the main process of it
      let foundRunningTask = false;
      for(let task of tasks) {
        if ( task.is_running && task.last_open_timer ) {
          let timestamp = task.last_open_timer.unix();
          if ( timestamp ) {
            foundRunningTask = true;
            activeTaskID = task.id;
            ipcRenderer.send('timer-started', task.total_hours, timestamp );
            break;
          }
        }
      }

      if ( !foundRunningTask ) {
        ipcRenderer.send('timer-stopped');
      }

      return new Promise((resolve) => {
        this.setState({
          taskStatuses,
          activeTaskID,
          projects,
          activities,
          tasks,
          hasInitialContent: true
        }, () => {
          resolve();
        });
      });
    })
    .catch(err => this.throwError(err));
  }

  getTaskById(task_id : string) : DataTypes.Task | null {
    for(let task of this.state.tasks) {
      if ( task.id === task_id) {
        return task;
      }
    }

    return null;
  }

  getUserDetails(user_id) {
    return this.connector.getUserDetails(user_id);
  }

  deleteTimeblock(timeblock_id : string) : Promise<any> {
    return this.connector
      .deleteTimeblock(timeblock_id)
      .then(() => {
        return Promise.all([
          this.listTasks(),
          this.listDayTimeline()
        ]);
      })
      .catch(err => {
        this.throwError(err)
      });
  }

  startTask(task : DataTypes.Task, activity : DataTypes.Activity) : Promise<any> {
    let timestamp = moment();
    return this.connector
      .startTask(task, activity, timestamp, this.state.user.employee_name)
      .then(() => this.listTasks())
      .catch(err => {
        this.throwError(err)
      });
  }

  stopTask(task : DataTypes.Task, timestamp : Moment) : Promise<any> {
    if ( !!timestamp === false ) {
      timestamp = moment();
    }

    return new Promise((resolve) => {
        this.setState({
          activeTaskID: null // we are using null as an intermediary value before finally setting false. Timeline then can update preemptively along with idle message.
        }, resolve);
      })
      .then(() => 
        this.connector
          .stopTask(task, timestamp, this.state.user.employee_name))
      .then(() => this.listTasks())
      .catch(err => this.throwError(err));
  }

  isProjectSelected( id : string ) {
    return this.state.selectedProjects.indexOf(id) > -1;
  }

  getSelectedProjects() : DataTypes.Project[] {
    return this.state.projects.filter((p) => this.state.selectedProjects.indexOf(p.id) > -1);
  }

  setSelectedProject( id : string ) : Promise<any> {
    // lets make sure this id exists in our projects cache
    if ( this.state.projects.findIndex((p) => p.id === id) > -1 ) {
      return new Promise((resolve) => {
        this.setState((state) => ({
          selectedProjects: [...state.selectedProjects, id].sort()
        }), resolve);
      });
    }

    return Promise.reject(new InvalidOperation("Project id not found"));
  }

  unsetSelectedProject( id : string ) : Promise<any> {
    return new Promise((resolve) => {
      this.setState((state) => ({
        selectedProjects: state.selectedProjects.filter((pid) => pid !== id).sort()
      }), resolve);
    })
  }

  clearSelectedProjects() : Promise<any> {
    return new Promise((resolve) => {
      this.setState({
        selectedProjects: []
      }, resolve)
    });
  }

  setTaskStatusFilter( status : string ) : Promise<any> {
    return new Promise((resolve) => {
      let newList = this.state.taskStatusFilter.slice(0);
      if ( newList.indexOf(status) == -1 ) {
        newList.push(status);
      }
      this.setState({
        taskStatusFilter: newList
      }, resolve);
    });
  }

  unsetTaskStatusFilter( status : string ) : Promsie<any> {
    return new Promise((resolve) => {
      this.setState({
        taskStatusFilter: this.state.taskStatusFilter.filter((s) => s !== status)
      }, resolve);
    })
  }

  clearTaskStatusFilter() : Promise<any> {
    return new Promise((resolve) => {
      this.setState({
        taskStatusFilter: []
      }, resolve);
    })
  }

  getAllTaskStatuses() {
    return this.state.taskStatuses;
  }

  getTaskStatusFilters() {
    return this.state.taskStatusFilter;
  }

  render() {
    return <context.Provider value={this.state} {...this.props} />;
  }
}

export const BackendConsumer = (props : any) => {
  return <context.Consumer {...props} />;
}
