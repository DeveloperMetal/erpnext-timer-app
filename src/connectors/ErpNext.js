import React from 'react';

import axios from 'axios';
import { 
  DataConnector, 
  DayLog, 
  TaskLog,
  Project,
  Task,
  LoginError,
  ReadError,
  UpdateError,
  CreateError,
  DeleteError,
  ConnectorNotReady,
  InvalidOperation
} from "./Data";

import moment from 'moment';

const dateTimeFormat = "YYYY-MM-DD hh:mm:ss";
const dateFormat = "YYYY-MM-DD";
const allDateFormats = [dateTimeFormat, dateFormat];
const TimesheetDetailsFields = ["name", "idx", "project", "task", "from_time", "to_time", "parent", "hours"]
const TimesheetFields = ["name", "status", "creation", "employee", "docstatus", "start_date", "total_hours", "note"];
const TaskFields = ["name", "subject", "description", "progress", "exp_start_date", "priority", "description", "status", "is_group", "project", "actual_time", "_assign", "is_milestone", "_comments", "_user_tags", "depends_on_tasks", "expected_time", "exp_end_date"];
const ProjectFields = ["name", "project_name", "notes", "is_active", "status", "company", "percent_complete", "percent_complete_method", "priority"];

function encode(item) {
  return JSON.stringify(item)
}

function queryStringBuilder(args, encodeValues) {
  if (!args) {
    return false;
  }

  let params = [];
  params = Object.keys(args).map(key => `${key}=${encodeURIComponent(encodeValues?encode(args[key]):args[key])}`)
  return params.join('&');
}

function parseFrappeErrorResponse(err) {
  console.log(err.response);
  let errorInfo = { status: err.status, statusText: err.statusText, data: err.response.data }
  if ( typeof err.response.data === 'string' ) {
    let rx = /(?:\<pre\>)([^<]+)(?:\<\/pre\>)/ig;
    let matches = rx.exec(err.response.data);
    let remoteTrace = matches[1].trim().split("\n");
    let message = remoteTrace[remoteTrace.length - 1];
    return Object.assign({ message, server_messages: [], remoteTrace }, errorInfo);
  } else {
    let message = '', server_messages = [], remoteTrace = [];
    if ('message' in err.response.data) {
      message = err.response.data.message;
    }
    if ('_server_messages' in err.response.data) {
      server_messages = JSON.parse(err.response.data._server_messages);
    }
    if ('exc' in err.response.data) {
      remoteTrace = JSON.parse(err.response.data.exc);
      remoteTrace = remoteTrace.map(x => x.trim().split('\n'));
      if ( !message && remoteTrace.length > 0 ) {
        message = remoteTrace.map(x => x[x.length-1]).join("\n");
      }
    }

    console.error(message);
    return Object.assign({ message, server_messages, remoteTrace }, errorInfo);
  }
}

class FrappeRest {
  constructor(host) {
    this.host = host;
    this.resources = {};
    this.apis = {};
  }

  api(method) {
    if ( !(method in this.apis) ) {
      this.apis[method] = new FrappeApi(this.host, method);
    }

    return this.apis[method];
  }

  resource(resource) {
    if ( !(resource in this.resources) ) {
      this.resources[resource] = new FrappeResource(this.host, resource);
    }

    return this.resources[resource];
  }
}

class FrappeApi {
  constructor(host, method) {
    this.host = host;
    this.method = method;
  }

  get() {
    let params = queryStringBuilder(args);
    if ( params ) {
      params = `?${params}`;
    }

    return axios.get(`${this.host}/api/method/${this.method}${params}`)
      .then(response => {
        return response.data;
      });
  }

  post(args) {
    let params = queryStringBuilder(args)

    return axios.post(`${this.host}/api/method/${this.method}`, params)
      .then(response => {
        return response.data;
      });
  }
}

class FrappeResource {
  constructor(host, resource) {
    this.host = host;
    this.resource = resource;
  }

  create(data) {
    return axios.post(`${this.host}/api/resource/${this.resource}`, data)
      .then(response => {
        console.log(`Create ${this.resource}`, data);
        console.log('Response: ', response);
        return response.data;
      })
      .catch(err => {
        this._errorFactory(err, CreateError);
      });
  }

  read(args) {
    let argsStr = queryStringBuilder(args, true);

    return axios.get(`${this.host}/api/resource/${this.resource}?${argsStr}`)
      .then(response => {
        return response.data.data;
      })
      .catch(err => {
        this._errorFactory(err, ReadError);
      });
  }

  update(name, data) {
    return axios.put(`${this.host}/api/resource/${this.resource}/${name}`, data)
      .then(response => {
        return response.data;
      })
      .catch(err => {
        this._errorFactory(err, UpdateError);
      });
  }
  
  delete(name) {
    return axios.delete(`${this.host}/api/resource/${this.resource}`)
      .then(response => {
        return response.data;
      })
      .catch(err => {
        this._errorFactory(err, DeleteError);
      });
  }

  _errorFactory(err, errorClass) {
    if (typeof err.response.data !== undefined) {
      let errorInfo = {};
      try {
        errorInfo = parseFrappeErrorResponse(err);
      } catch (err) {
        throw new errorClass(err.toString(), {}, err);
      }
      throw new errorClass(errorInfo.message || err.toString(), errorInfo);
    }

    throw new errorClass(err.toString(), {}, err);
  }
}

export class ErpNextConnector extends DataConnector {

  constructor() {
    super();

    this.auth = null;
    this.projects = [];
    this.frappe = null;
    this.resources = {};
    this.projects = {};
    this.tasks = {};

    this.timerTaskLog = null;
    this.timerTimesheetDetailName = null;

  }

  validateTimesheet() {
    // extra step to validate timesheet details
    // Our app needs to group Timesheet Details into tasks.
    // To keep the data entry and management to a minimum to the end user
    // we only display one task per day and its start/stop timer
    // handles splitting Timesheet Details to make this work.

    // So, lets find all open timesheets and their details and remove multiple
    // Timesheet Detail entries that are left open.
    // by necessity we must have max one open per day per task

    return this.fetchDraftTimesheetsByEmployee(this.employee.name, ["name"])
      .then(result => {
        let detailsPromises = [];
        result.forEach(timesheet => {
          // fetch all details per timesheet
          detailsPromises.push(this.fetchTimesheetDetailsFromParent(timesheet.name));
        })

        // let them queue up in the background and wait for data.
        return Promise.all(detailsPromises);
      })
      .then(result => {
        let waitDeleteList = [];

        // each result entry is a group of details belonging to a separate timesheet
        result.forEach(details => {

          let groupByTask = details.reduce((tasks, detail => {
            if ( !(detail.task in tasks) ) {
              tasks[detail.task] = [];
            }

            tasks[detail.task].push(detail);

            return tasks;
          }), {})

          // Make sure only one Timesheet Detail is active, delete all others
          // for this day/timesheet
          Object.values(groupByTask).forEach(details => {

            let hasActive = false;

            details.forEach(detail => {
              // find first active detail, delete rest.
              if ( !detail.to_time && hasActive ) {
                waitDeleteList.push(this.resources.TimesheetDetail.delete(detail.name));
              } else if ( !detail.to_time && !hasActive ) {
                hasActive = true;
              }
            });

          });

        });

        return Promise.all(waitDeleteList);
      })
  }

  onLogin() {
    this.resources.TimesheetDetail = this.frappe.resource('Timesheet Detail');
    this.resources.Timesheet = this.frappe.resource('Timesheet');
    this.resources.Task = this.frappe.resource('Task');
    this.resources.Project = this.frappe.resource('Project');
    this.resources.Employee = this.frappe.resource('Employee');

    // lets find our employee record so we can find our timesheets
    return this.fetchEmployeeByUserId(this.auth.usr)
      .then(result => {
        if ( result.length == 0 ) {
          throw new ReadError('User has no employee record. Please had your administrator create an employee record before loging in.')
        }

        this.employee = result[0];
        return this.validateTimesheet();
      })
      .catch(err => {
        
      })
  }

  login(auth) {    
    let frappe = new FrappeRest(auth.host);

    return frappe.api('login').post({
        usr: auth.usr,
        pwd: auth.pwd
      })
      .then(response => {
        this.auth = auth;
        this.frappe = frappe;
        return this.onLogin();
      })
      .catch(err => {
        if (err.response && typeof err.response.data !== undefined ) {
          let errorInfo = parseFrappeErrorResponse(err);
          if ( errorInfo.message == 'User disabled or missing' ) {
            throw new LoginError(errorInfo.message, errorInfo);
          }
          throw new LoginError(errorInfo.message || err.toString(), errorInfo);
        }

        throw new LoginError(err.toString(), err);
      });
  }

  ///// - DataConnector api

  fetchDays(startDate, endDate) {

    // Steps:
    // 1) Retrieve a timesheet per day in the date range. 
    //    If there is no timesheet, create a daylog anyways. We'll save when have new data.
    // 2) On every timesheet list details so we can wrap it in the simple TaskLog object
    //    Becase we want to track the ui to be a list of tasks worked in a day, we'll
    //    wrap multiple Timesheet Detail records and add their total time elapsed.
    //    This will let us start/stop the same task multiple times(only one entry on the ui) 
    //    and keep an accurate time log of when they are worked on.

    return Promise.all([
      this.fetchTimesheetFromRange(startDate, endDate),
      this.fetchTimesheetDetailsFromDateRange(startDate, endDate),
      this.fetchAllTasks(),
      this.fetchAllOpenProjects(),
    ]).then(results => {

      let timesheets = results[0],
          details = results[1],
          tasks = results[2],
          projects = results[3];

      // build project and task entries cache
      this.cacheProjects(projects);
      this.cacheTasks(tasks);

      // we should now have all Timesheet Detail in the same range as our Timesheets
      // so lets pair them and return an array of DayLog instances abstracting out unused fields for this app.

      let days = {}
      let b = moment(endDate).startOf('day');
      for (let dayDate = moment(startDate).startOf('day'); 
              dayDate.diff(b, 'days') <= 0; 
              dayDate.add(1, 'days')) {

        // find timesheet for this day
        let timesheet = timesheets.find(t => {
          return t.start_date && moment(t.start_date, allDateFormats).startOf('day').isSame(dayDate)
        });

        // lets group all Timesheet Details per task so we can combine them into one
        // TaskLog object
        let timesheetDetails = details.filter(detail => {
          return timesheet && detail.parent == timesheet.name;
        });

        let groupedDetails = timesheetDetails.reduce((map, d) => {
          if ( !(d.task in map) ) {
            map[d.task] = []
          }

          map[d.task].push(d);
          return map;
        }, {});

        let taskLogs = Object.keys(groupedDetails)
          .reduce((logs, taskName) => {

            let task = this.tasks[taskName];
            let taskLog = new TaskLog({ 
              id: task.id,
              task,
              title: task.title,
              progress: task.progress || 0,
              description: task.description || "",
              startTime: null,
              isActive: false
            }, this);

            // lazy extend TaskLog to keep track of timesheet.name
            taskLog.timesheet_name = timesheet ? timesheet.name : null

            // there is the posibility that multiple Timesheet Details may
            // have from_time set and to_time unset.
            // we'll take the first "active" one.
            groupedDetails[taskName].map(detail => {

              // we assume active timer on entries without a to_time value
              if ( !detail.to_time ) {
                taskLog.startTime = moment(detail.from_time, dateTimeFormat),
                taskLog.isActive = true;
                this.timerTaskLog = taskLog;
                this.timerTimesheetDetailName = detail.name;
              } else {
                // accumulate time
                taskLog.time += detail.hours * 60;
              }

            }); /* eof - groupedDetails.map() */

            logs.push(taskLog);

            return logs;
          }, []);

        // sort taskLogs by start time
        let orderedTaskLogs = taskLogs.sort((left, right) => {
            return left.startTime.diff(right.startTime)
          });

        days[dayDate.format('YYYY-MM-DD')] = new DayLog({
          id: timesheet?timesheet.name: null,
          date: dayDate.clone(),
          locked: timesheet?(timesheet.status != "Draft"):false,
          taskLogs: orderedTaskLogs
        }, this);
      }

      console.log(days);

      return days;
    });
  }

  fetchProjects() {
    return this.fetchAllOpenProjects()
      .then(projects => {
        return this.cacheProjects(projects);
      })
  }

  fetchTasks() {
    return this.fetchAllTasks()
      .then(tasks => {
        return this.cacheTasks(tasks);
      })
  }


  cacheProjects(projectsRaw) {
    // build project entries cache
    this.projects = projects.reduce((projs, p) => {
      projs[p.name] = new Project({
        id: p.name,
        title: p.project_name,
        description: p.notes
      }, this)

      return projs;
    }, {});

    return this.projects;
  }

  cacheTasks(tasksRaw) {
    // build task entries cache
    this.tasks = tasks.reduce((tsks, t) => {
      tsks[t.name] = new Task({
        id: t.name,
        title: t.subject,
        description: t.description,
        status: t.status,
        assignTo: JSON.parse(t._assign || "[]"),
        project: this.projects[t.project],
        progress: t.progress,
        tags: JSON.parse(t._user_tags || "[]")
      }, this);

      return tsks;
    }, {});

    return this.tasks;
  }

  startTimer(taskLog) {
    // To track a slice of time when the timer is on we'll
    // create a Timesheet Detail doctype and store it's dt name.
    // We'll keep a reference to the TaskLog and force only one
    // timer running.

    // make sure we don't already have a timer started
    this.fetchStartedDayTimesheetDetailsByTask(taskLog.timesheet_name, taskLog.task.id)
    .then(result => {
      // there should 0 total started timers for this task
      if ( result.length > 0 ) {
        throw new InvalidOperation("This timer is already running");
      }
      return null;
    })
    .then(() => {

      this.timerTaskLog = taskLog;
      this.timerTimesheetDetailName = null;

      return this.resources.TimesheetDetail.create({
        parent: taskLog.timesheet_name,
        parenttype: "Timesheet",
        parentfield: "time_logs",
        activity_type: "Programming",
        from_time: moment().format(dateTimeFormat),
        time: 0,
        task: taskLog.task.id,
        project: taskLog.task.project.id
      });

    })
    .then(response => {
      console.log("start timer response: ", response);
      this.timerTimesheetDetailName = response.data.name;
      this.timerTaskLog.isActive = true;
      this.timerTaskLog.startTime = moment(response.data.from_time, allDateFormats);

      return this.timerTaskLog;
    })

  }

  stopTimer(taskLog) {

    // make sure we don't already have a timer started
    this.fetchStartedDayTimesheetDetailsByTask(taskLog.timesheet_name, taskLog.task.id)
      .then(result => {
        // there should 1 total started timers for this task
        if (result.length == 0) {
          throw new InvalidOperation("This timer isn't running.");
        } 
        else if ( resizeBy.length > 1 ) {
          throw new InvalidOperation("There are multiple timers started for this task on the backend. Please fix before continuing.");
        }
        return result[0];
      })
      .then(detail => {
        let stopTime = moment();
        return this.resources.TimesheetDetail.update(
          detail.name,
          {
            name: detail.name,
            to_time: stopTime.format(dateTimeFormat),
            hours: moment.duration(this.timerTaskLog.startTime.diff(stopTime)).asMinutes() / 60
          })
      })
      .then(response => {
        console.log(response);
        this.timerTaskLog.time += response.data.hours / 60;
        this.timerTaskLog.isActive = false;

        this.timerTaskLog = null;
        this.timerTimesheetDetailName = null;

        return taskLog;
      })
  }

  ///// - Internal Model 
  fetchDayTimesheetDetailsByTask(timesheet_name, task_name, fields) {
    if (!fields) {
      fields = TimesheetDetailsFields;
    }
    return this.resources.TimesheetDetail.find({
      fields,
      filters: [
        ['parent', '=', timesheet_name],
        ['parenttype', '=', 'Timesheet'],
        ['task', '=', task_name]
      ],
      limit_page_length: 9999 // we want all slices, doubt this would grow unmanageable? hm...
    })
  }

  fetchStartedDayTimesheetDetailsByTask(timesheet_name, task_name, fields) {
    if (!fields) {
      fields = TimesheetDetailsFields;
    }
    return this.resources.TimesheetDetail.find({
      fields,
      filters: [
        ['parent', '=', timesheet_name],
        ['parenttype', '=', 'Timesheet'],
        ['task', '=', task_name],
        ['to_time', '=', '']
      ],
      limit_page_length: 9999 // we want all slices, doubt this would grow unmanageable? hm...
    })
  }

  fetchEmployeeByUserId(user_id) {
    return this.resources.Employee.read({
      fields: ["name"],
      filters: [
        ["user_id", "=", user_id]
      ]
    });
  }

  fetchAllOpenProjects() {
    return this.resources.Project.read({
      fields: ProjectFields,
      filters: [
        ["status", "=", "Open"]
      ]
    });
  }
  
  fetchAllTasks() {
    return this.resources.Task.read({
      fields: TaskFields,
      filters: [
        ["status", "!=", "Closed"],
        ["project", "!=", ""]
      ]
    });
  }

  fetchDraftTimesheetsByEmployee(employee, fields) {
    return this.resources.Timesheet.read({
      fields: fields || TimesheetFields,
      filters: [
        ["employee", "=", employee],
        ["status", "=", "Draft"]
      ]
    });
  }

  fetchTimesheetFromRange(dateStart, dateEnd) {
    if (!this.resources.Timesheet ) {
      throw new ConnectorNotReady("Timesheet Resource not bound");
    }

    return this.resources.Timesheet.read({
      fields: TimesheetFields,
      filters: [
        ["start_date", ">=", moment(dateStart).startOf('day').format(dateTimeFormat)],
        ["start_date", "<=", moment(dateEnd).endOf('day').format(dateTimeFormat)]
      ]
    })
  }

  fetchTimesheetDetailsFromParent(parent) {
    return this.resources.TimesheetDetail.read({
      fields: TimesheetDetailsFields,
      filter: [
        ["parent", "=", parent],
        ["parentType", "=", "Timesheet"]
      ]
    })
  }

  fetchTimesheetDetailsFromDateRange(startDate, endDate) {
    return this.resources.TimesheetDetail.read({
      fields: TimesheetDetailsFields,
      filters: [
        ["from_time", ">=", moment(startDate).startOf('day').format(dateTimeFormat)],
        ["from_time", "<=", moment(endDate).endOf('day').format(dateTimeFormat)],
        ["parentfield", "!=", ""] // covers issue where details are left orphan if parentfield is missing.
      ],
      order_by: "from_time ASC"
    });
  }

}

// create our singleton connector instance
const connector = new ErpNextConnector();
// create our context to expose connector to app
const context = React.createContext(connector);
// helpful wrapper to include our connector by default
const ERPNextProvider = (props) => {
  return <context.Provider value={connector} {...props} />
}
// expose our "context"
export const ERPNextContext = {
  Provider: ERPNextProvider,
  Consumer: context.Consumer
}
// make it default so we can use this pattern to load other connectors in the future.
export default ERPNextContext;
