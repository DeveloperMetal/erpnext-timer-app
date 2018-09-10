import React from 'react';
import EventHandler from "events";
import moment, { Moment } from 'moment';

export class DataObject extends EventHandler {
  constructor(props, defaults, backend) {
    super();

    this.backend = backend;

    defaults = Object.assign({
      id: null
    }, defaults);

    if ( typeof props === 'object' ) {
      Object.keys(defaults).forEach(key => {
        if ( props.hasOwnProperty(key) ) {
          this[key] = props[key];
        } else {
          this[key] = defaults[key];
        }
      });
    }

  }
}

export class DayLog extends DataObject {
  constructor(props, backend) {
    super(props, {
      /**
       * The DayLog's date. This moment based date should always be set to the day's start.
       * You can set this using moment.startOf('day') 
       * @name DayLog#date
       * @type Moment
       * @default null
       */
      date: null,
      /**
       * An array of tasks started this day.
       * @name DayLog#taskLog
       * @type TaskLog[]
       * @default []
       */
      taskLogs: [],
      /**
       * When set to true by the backend, this day log is read only and no tasks may be modified.
       * @name DayLog#locked
       * @type Boolean
       * @default false
       */
      locked: false
    }, backend)
  }
}

export class TaskLog extends DataObject {
  constructor(props, backend) {
    super(props, {
      /**
       * The Task instance describing the TaskLog underlying task.
       * @name TaskLog#task
       * @type Task
       * @default null
       */
      task: null,
      /**
       * The title of this task. Usually taken from its Task.title
       * @name TaskLog#title
       * @type string
       * @default ""
       */
      title: "",
      /**
       * A user defined description of the task being worked on. And what work was done during this logged time.
       * @name Task#description
       * @type string
       * @default ""
       */
      description: "",
      /**
       * A last started timer moment. Used to track work duration once the StopTimer() method is called
       * @name Task#startTime
       * @type Moment
       * @default null
       */
      startTime: null,
      /**
       * Total tracked number of minutes worked on this task.
       * @name TaskLog#time
       * @type float
       * @default 0
       */
      time: 0,
      /**
       * When true, this task has a timer started.
       * @name TaskLog#isActive
       * @type Boolean
       * @default false
       */
      isActive: false
    }, backend)
  }

  /**
   * Starts a timer for this TaskLog returning a promise once the backend has completed
   * logging this action.
   * @returns {Promise}
   */
  startTimer() {
    return this.backend.startTimer(this);
  }

  /**
   * Stops a timer for this TaskLog returning a promise once the backend has completed
   * logging this action.
   */
  stopTimer() {
    return this.backend.stopTimer(this);
  }
}

export class Task extends DataObject {
  constructor(props) {
    super(props, {
      /**
       * The task's title
       * @name Task#title
       * @type String
       * @default ""
       */
      title: "",
      /**
       * The task's description
       * @name Task#description
       * @type String
       * @default ""
       */
      description: "",
      /**
       * The user this task was assigned to
       * @name Task#assignTo
       * @type String
       * @default ""
       */
      assignTo: "",
      /**
       * The Project instance describing the underlying project this task belongs to.
       * @name Task#project
       * @type Project
       * @default null
       */
      project: null,
      /**
       * A string representation of the task's current state. Usually set by the backend as it handles
       * starting/stoping timers or task completion.
       * @name Task#status
       * @type String
       * @default ""
       */
      status: null,
      /**
       * An array of strings representing tags associated with this task. Purely informational.
       * @name Task#tags
       * @type String[]
       * @default []
       */
      tags: [],
    })
  }
}

export class Project extends DataObject {
  constructor(props) {
    super(props, {
      /**
       * The project's title.
       * @name Project#title
       * @type String
       * @default ""
       */
      title: "",
      /**
       * A description of the project.
       * @name Project#description
       * @type String
       * @default ""
       */
      description: "",
      /**
       * A string defining project status, set by the backend this is purely informational.
       * Wheather a project is visible to the app is left to the backend to decide.
       * @name Project#status
       * @type String
       * @default ""
       */
      status: "",
    })
  }
}

export class NotImplemented extends Error { }

export class DataConnector {

  /**
   * When implemented, handles logging into backend service.
   * @param {*} auth 
   * @returns {Promise} Promise which fullfills on success or errors out otherwise.
   */
  login(auth) {
    return Promise.reject(new NotImplemented());
  }

  /**
   * When implemented, handles fetching list of projects objects the current logged in user may subscribe to.
   * @returns {Promise} Promise returning Array of Project instances.
   */
  fetchProjects() {
    return Promise.reject(new NotImplemented());
  }

  /**
   * When implemented, handles fetching all tasks the current logged in user may subscribe to.
   * @returns {Promise} Promise returning Array of Task instances.
   */
  fetchTasks() {
    return Promise.reject(new NotImplemented());
  }

  /**
   * When implemented, handles fetching DayLogs assigned to the current logged in user.
   * @param {*} dateStart Start date of the query
   * @param {*} dateEnd End date of the query
   * @returns {Promise} Promise returning Array of DayLog instances.
   */
  fetchDays(dateStart, dateEnd) {
    return Promise.reject(new NotImplemented());
  }

  /**
   * When implemented, handles updating a DayLog data on the backend service.
   * @param {DayLog} day DayLog instance containing the day's time tracking information.
   * @returns {Promise} A promise which returns when the DayLog is stored on the backend.
   */
  updateDayLog(day) {
    return Promise.reject(new NotImplemented());
  }

  /**
   * When implemented, handles storing a new task instance on the backend service.
   * @param {Task} task A Task instance containing the new task information
   * @returns {Promise} A promise which returns when the task is stored on the backend
   */
  createTask(task) {
    return Promise.reject(new NotImplemented());
  }

  /**
   * When implemented, handles starting the backend mechanism to track task work start time.
   * The backend connector is expected to update the passed TaskLog with the updated information after
   * starting the timer.
   * @param {TaskLog} taskLog The task log object which tracks the log information locally
   * @return {Promise}
   */
  startTimer(taskLog) {
    return Promise.reject(new NotImplemented());
  }

  /**
   * When implemented, handles stoping the backend mechanism to track task work duration time.
   * The backend connector is expected to update the passed TaskLog with the updated information after
   * stoppign the timer.
   * @param {TaskLog} taskLog 
   * @return {Promise}
   */
  stopTimer(taskLog) {
    return Promise.reject(new NotImplemented());
  }
}

export class ConnectorError extends Error {
  constructor(message, info, error) {
    super(message);
    this.info = info;
    // track inner errors that caused this one to happen
    if ( error ) {
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

// --- Importing backend provider dynamically so we can swap connectors in the future
export const BackendProvider = (props) => {
  const Provider = require('./ErpNext').default.Provider;
  return <Provider {...props}/>;
}

export const BackendConsumer = (props) => {
  const Consumer = require('./ErpNext').default.Consumer;
  return <Consumer {...props}/>;
}