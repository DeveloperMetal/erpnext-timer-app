// @flow 

import * as DataTypes from "./Data.flow";
import type Moment from "moment";

import axios from "axios";
import moment from "moment";
import momentDurationFormatSetup from "moment-duration-format";
momentDurationFormatSetup(moment);
import { 
  ConnectorError,
  LoginError,
  ReadError,
  UpdateError,
  CreateError,
  DeleteError,
  InvalidOperation
} from "./Data";

const dateTimeFormat : string = "YYYY-MM-DD HH:mm:ss";
const dateFormat : string = "YYYY-MM-DD";
const allDateFormats : string[] = [dateTimeFormat, dateFormat];

const ActivityTypeFields : string[] = ["name", "activity_type"]

type ActivityType = {
  name : string,
  activity_type : string
}

const TimesheetDetailFields : string[] = ["name", "idx", "project", "task", "from_time", "to_time", "parent", "parenttype", "hours"]

type TimesheetDetail = {
  name : string,
  idx : number, 
  project? : string,
  task? : string,
  from_time? : string,
  to_time? : string,
  parent? : string,
  parenttype? : string,
  hours? : number
}

const TimesheetFields : string[] = ["name", "status", "creation", "employee", "docstatus", "start_date", "total_hours", "note"];

type Timesheet = {
  name : string,
  status : string,
  creation : string,
  employee? : string,
  docstatus : number,
  start_date : string,
  total_hours? : number,
  note? : string
}

const TaskFields : string[] = ["name", "task_weight", "parent_task", "subject", "description", "progress", "exp_start_date", "priority", "description", "status", "is_group", "project", "actual_time", "_assign", "is_milestone", "_comments", "_user_tags", "depends_on_tasks", "expected_time", "exp_end_date"];

type Task = {
  name : string, 
  task_weight: number,
  parent_task : string, 
  subject : string, 
  description? : string, 
  progress? : number, 
  exp_start_date? : string, 
  priority? : number, 
  status : string, 
  is_group : boolean, 
  project : string, 
  actual_time? : string, 
  _assign? : string, 
  is_milestone : boolean, 
  _comments? : string, 
  _user_tags? : string, 
  depends_on_tasks : boolean, 
  expected_time? : string, 
  exp_end_date? : string
}

const ProjectFields = ["name", "project_name", "notes", "is_active", "status", "company", "percent_complete", "percent_complete_method", "priority"];
const Doctypes = {
  Timesheet: "Timesheet",
  TimesheetDetail: "Timesheet Detail",
  Task: "Task",

}

function encode(item : string) : string {
  return JSON.stringify(item)
}

function queryStringBuilder(args : any, encodeValues : boolean = false) : string {
  if (!args) {
    return "";
  }

  let params = [];
  params = Object.keys(args).map(key => `${key}=${encodeURIComponent(encodeValues ? encode(args[key]) : args[key])}`)
  return params.join("&");
}

function parseFrappeErrorResponse(err : any) : ?DataTypes.ErrorInfo {
  console.log("on parseFrappeErrorResponse");
  console.dir(err);
  if (!err.response || typeof err.response.data === undefined) {
    return null;
  }


  let message = "Unexpected error",
    server_messages = [],
    remoteTrace = [];

  let isDataString = typeof err.response.data === 'string';

  let errorInfo = { status: err.status, statusText: err.statusText, data: err.response.data || '' };
  //console.log("frappe parse error", errorInfo);
  if (err.status == 502 || (isDataString && errorInfo.data.search(/502\s+bad\s+gateway/gi) > -1)) {
    message = "Unable to reach remote server. \nGot 'Gateway Time-out'";
  } else if (typeof err.response.data === 'string') {

    let rx = /(?:\<pre\>)([^<]+)(?:\<\/pre\>)/ig;
    let matches = rx.exec(err.response.data);
    if (matches && matches.length > 1) {
      remoteTrace = matches[1].trim().split("\n");
      message = remoteTrace[remoteTrace.length - 1];
    } else {
      message = err.statusText;
    }
  } else {
    if ('message' in err.response.data) {
      message = err.response.data.message;
    }

    if ('_server_messages' in err.response.data) {
      server_messages = JSON.parse(err.response.data._server_messages);
    }

    if ('exc' in err.response.data) {
      remoteTrace = JSON.parse(err.response.data.exc);
      remoteTrace = remoteTrace.map(x => x.trim().split('\n'));
      if (!message && remoteTrace.length > 0) {
        message = remoteTrace.map(x => x[x.length - 1]).join("\n");
      }
    }

  }

  errorInfo = Object.assign({}, { message, server_messages, remoteTrace }, errorInfo);
  console.error(errorInfo.message);
  console.dir(errorInfo);
  return errorInfo;
}

class FrappeRest {
  host : string;
  resources : any;
  apis : any;

  constructor(host : string) {
    this.host = host;
    this.resources = {};
    this.apis = {};
  }

  api(method : string) : any {
    if (!(method in this.apis)) {
      this.apis[method] = new FrappeApi(this.host, method);
    }

    return this.apis[method];
  }

  resource(resource : string) : any {
    if (!(resource in this.resources)) {
      this.resources[resource] = new FrappeResource(this.host, resource);
    }

    return this.resources[resource];
  }
}

class FrappeApi {
  host : string;
  method : string;

  constructor(host, method) {
    this.host = host;
    this.method = method;
  }

  handleException(err : any) : void {
    let errorInfo = parseFrappeErrorResponse(err);
    if (errorInfo) {
        throw new ConnectorError(errorInfo.message || err.toString(), errorInfo);
    } else {
      throw new ConnectorError(err.toString(), err);
    }
  }

  get(args : any) : Promise<any> {
    let params : string = queryStringBuilder(args);
    if (params) {
      params = `?${params}`;
    }

    return axios.get(`${this.host}/api/method/${this.method}${params}`)
      .then(response => {
        return response.data;
      })
      .catch(err => this.handleException(err));
  }

  post(args : any) : Promise<any> {
    let params : string = queryStringBuilder(args)

    return axios.post(`${this.host}/api/method/${this.method}`, params)
      .then(response => {
        return response.data;
      })
      .catch(err => this.handleException(err));
  }
}

class FrappeResource {
  host : string;
  resource : string;

  constructor(host : string, resource : string) {
    this.host = host;
    this.resource = resource;
  }

  create(data : any) : Promise<any> {
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

  read(args : any) : Promise<any> {
    let argsStr : string = queryStringBuilder(args, true);

    return axios.get(`${this.host}/api/resource/${this.resource}?${argsStr}`)
      .then(response => {
        return response.data.data;
      })
      .catch(err => {
        this._errorFactory(err, ReadError);
      });
  }

  update(name : string, data : any) : Promise<any> {
    return axios.put(`${this.host}/api/resource/${this.resource}/${name}`, data)
      .then(response => {
        return response.data;
      })
      .catch(err => {
        this._errorFactory(err, UpdateError);
      });
  }

  delete(name : string) : Promise<any> {
    return axios.delete(`${this.host}/api/resource/${this.resource}`)
      .then(response => {
        return response.data;
      })
      .catch(err => {
        this._errorFactory(err, DeleteError);
      });
  }

  _errorFactory(err : any, errorClass : any) : void {
    if (typeof err.response.data !== undefined) {
      let errorInfo;
      try {
        errorInfo = parseFrappeErrorResponse(err);
      } catch (err) {
        throw new errorClass(err.toString(), {}, err);
      }

      let message : string = err.toString();
      if ( errorInfo ) {
        message = errorInfo.message;
      }
      
      throw new errorClass(message || err.toString(), errorInfo || {});
    }

    throw new errorClass(err.toString(), {}, err);
  }
}

let frappe : FrappeRest;

function getTimesheetDetailParent(detail) : Promise<any>{
  return frappe.resource('Timesheet')
    .read({ 
      fields: TimesheetFields,
      filters: [
        ["name", "=", detail.parent],
      ]
    }).then(timesheet => {
      return { detail, timesheet }
    });
}

function findEmployeeByUserId(user_id : string) : Promise<any> {
  return frappe.resource("Employee").read({
    fields: ["name"],
    filters: [
      ["user_id", "=", user_id]
    ]
  });
}

function buildTimesheetDetail(
  task : string, 
  project : string, 
  activity : DataTypes.Activity,
  timestamp : Moment, 
  parent? : string ) : any {

  let doc : any = {
    activity_type: activity.id,
    task: task,
    project: project,
    from_time: moment(timestamp).format(dateTimeFormat),
    to_time: "",
    hours: 0
  }

  if ( parent ) {
    doc = Object.assign(doc, {
      parent,
      parenttype: "Timesheet",
      parentfield: "time_logs",
    });
  }

  return doc;
}

function querySheetDetails(sheet : Timesheet) : QuerySheetDetailsResult {
  return frappe.resource("Timesheet Detail")
    .read({
      fields: TimesheetDetailFields,
      filters: [
        ["parent", "=", sheet.name],
        ["parenttype", "=", "Timesheet"],
        ["parentfield", "=", "time_logs"]
      ]
    })
    .then(details => {
      return { timesheet: sheet, details: details }
    })
}

type SumTaskHoursResult = {
  hours : number, 
  task : Task,
  is_running? : boolean,
  last_open_timestamp: Moment | null
}

function sumTaskHours(task : Task) : Promise<SumTaskHoursResult> {
  return frappe.resource("Timesheet Detail")
    .read({
      fields: ["sum(hours) as hours"],
      filters: [
        ["task", "=", task.name]
        ["hours", ">", 0]
      ]
    })
    .then(result => {
      return { 
        hours: result.hours, 
        task
      };
    });
}

function sumTaskHoursAndCheckOpen(task : Task) : Promise<SumTaskHoursResult> {
  let sumResult : SumTaskHoursResult;
  let lastOpenTimestamp : Moment;
  let total_ms : number = 0;
  return sumTaskHours(task)
    .then(result => {
      sumResult = result;
      return findTimesheetDetailsByTask(task.name);
    })
    .then((details : TimesheetDetail[]) => {
      return details.reduce((acc, detail) => {
        if ( !detail.to_time ) {
          acc.push(detail);
          let from_time : Moment = moment(detail.from_time, dateTimeFormat);
          if ( !lastOpenTimestamp || from_time.after(lastOpenTimestamp) ) {
            lastOpenTimestamp = moment(from_time);
          }
        } else {
          let from_time = moment(detail.from_time, dateTimeFormat);
          let to_time = moment(detail.to_time, dateTimeFormat);
          // should we count by the second? or millisecond even?
          let duration = moment.duration(to_time.diff(from_time)).asMilliseconds();
          total_ms += duration;
        }
        return acc;
      }, []);
    })
    .then((openDetails => {
      sumResult.is_running = openDetails.length > 0;
      sumResult.last_open_timestamp = lastOpenTimestamp;
      sumResult.hours = total_ms / 3600000;
      return sumResult;
    }))
}

function findTimesheetDetailsByTask(task_name : string) : Promise<TimesheetDetail[]> {
  return frappe.resource("Timesheet Detail")
    .read({
      fields: TimesheetDetailFields,
      filters: [
        ["task", "=", task_name]
      ]
    });
}

function findRunningTimesheetDetails(employee_name? : string) : Promise<QuerySheetDetailsResult[]> {
  // NOTE: There is an issue with querying NULL or "" empty values on datetime fields
  //       with frappe. So we can't query them directly...
  //       Instead, we'll query all draft Timesheet records and check individual 
  //       Timesheet Detail entries manually instead.

  // lets figure out if we have open tasks in Timesheet Details
  // but checking the "to_time" field for empty(which means a running timer)
  // Then filter those resoluts to only account for open Timesheets in case there is a
  // closed one left with a running tasks by accident.

  let filters = [
    ["status", "=", "Draft"]
  ];

  if ( employee_name ) {
    filters.push(["employee", "=", employee_name]);
  }

  return frappe.resource("Timesheet")
    .read({
      fields: TimesheetFields,
      filters
    })
    .then((timesheets : Timesheet[]) => {

      let detailPromises : QuerySheetDetailsResult[] = [];
      timesheets.forEach(sheet => {
        detailPromises.push(querySheetDetails(sheet));
      });

      return Promise.all(detailPromises);

    })
    .then((results : QuerySheetDetailsResult[]) => {

      return results.reduce((
          resultsAcc : QuerySheetDetailsResult[], 
          result: QuerySheetDetailsResult
        ) => {

        result.details = result.details.reduce(( acc, detail ) => {
          if ( !detail.to_time ) {
            acc.push(detail);
          }
          return acc;
        }, []);

        if ( result.details.length > 0 ) {
          resultsAcc.push(result);
        }

        return resultsAcc;
      }, []);

    });
}

function resolveTaskParent(task : DataTypes.Task) : Promise<DataTypes.Task> {
  if ( task.parent ) {
    return frappe.resource("Task").read({
      fields: ["subject"],
      filters: [
        ["name", "=", task.parent]
      ]
    })
    .then(result => {
      console.log(result);
      if ( result.length > 0 ) {
        task.parent_label = result[0].subject;
      }
      return task;
    })
  } else {
    return Promise.resolve(task);
  }
}

type QuerySheetDetailsResult = {
  timesheet: Timesheet,
  details: TimesheetDetail[]
}

const API : DataTypes.ConnectorAPI = {
  login(auth : DataTypes.Auth) : Promise<any> {
    frappe = new FrappeRest(auth.host);

    return frappe.api('login').post({
      usr: auth.usr,
      pwd: auth.pwd
    })
    .then(() => {
      return findEmployeeByUserId(auth.usr);
    })
    .then(employee => {
      window.frappe = frappe;
      return { employee_name: employee.name }
    })
    .catch(err => {
      // wrap error so we at least know what originated it
      throw new LoginError(err.message, err.info, err);
    });
  },

  listDayTimeline(
      day : Moment, 
      tasks : DataTypes.Task[]
    ) : Promise<DataTypes.TimelineItem[]> {
    
    let day_start = moment(day).startOf("day");
    let day_end = moment(day).endOf("day");

    return frappe.resource("Timesheet")
      .read({
        fields: TimesheetFields,
        filters: [
          ["start_date", ">=", day_start.format(dateTimeFormat)],
          ["start_date", "<=", day_end.format(dateTimeFormat)]
        ],
        order_by: "start_date DESC",
        limit_page_length: 1
      })
      .then((results) => {
        console.log("listDayTimeline: ", results);
        if ( results.length > 0 ) {
          return querySheetDetails(results[0]);
        }
        return null;
      })
      .then((result : QuerySheetDetailsResult) => {
        if ( result ) {
          return result.details.reduce((c, d) => {
            let task : DataTypes.Task | void = tasks.find(t => t.id === d.task);
            if ( task ) {
              let item : DataTypes.TimelineItem = {
                id: d.name,
                start: moment(d.from_time, dateTimeFormat),
                end: d.to_time?moment(d.to_time, dateTimeFormat):moment(),
                task,
                canDrag: !task.is_running,
                canResize: !task.is_running
              }

              c.push(item);
            }
            return c;
          }, []);
        }

        return [];
      });
  },

  updateTimelineItem(item : DataTypes.TimelineItem) : Promise<DataTypes.TimelineItem> {
    let from_time = moment(item.start)
    let ms = moment.duration(
        moment(item.end).diff(from_time)
      ).asMilliseconds();

    return frappe.resource("Timesheet Detail")
      .update(item.id, {
        from_time: item.start.format(dateTimeFormat),
        to_time: item.end.format(dateTimeFormat),
        hours: ms / 3600000
      })
      .then((result) => {
        return Object.assign({}, item, {
          start: moment(result.from_time, dateTimeFormat),
          end: moment(result.to_time, dateTimeFormat),
        });
      });
  },

  listActivities() : Promise<DataTypes.Activity[]> {
    return frappe.resource("Activity Type")
      .read({
        fields: ActivityTypeFields
      })
      .then(results => {
        return results.map((activity : ActivityType) => {
          return {
            id: activity.name,
            label: activity.activity_type
          }
        })
      })
  },

  listTasks(employee_name : string) : Promise<DataTypes.Task[]> {
    // first go through open timesheets and details

    return frappe.resource('Task').read({
      fields: TaskFields,
      filters: [
        ["status", "!=", "Closed"],
        ["project", "!=", ""],
        ["is_group", "=", 0]
      ]
    })
    .then((tasks : Task[]) => {
      // check all open timesheets and details to see total time spent on this task
      // if it was started on another time.
      return Promise.all(tasks.map((task : Task) => sumTaskHoursAndCheckOpen(task)));
    })
    .then((results : SumTaskHoursResult[]) => {
      return results.map(result => {
        // map from erpnext tasks to app tasks
        let task : DataTypes.Task = {
          id: result.task.name,
          weight: result.task.task_weight,
          total_hours: result.hours,
          label: result.task.subject,
          description: result.task.description || "",
          last_open_timestamp: result.last_open_timestamp,
          is_running: result.is_running || false,
          project: result.task.project,
          parent: result.task.parent_task,
          parent_label : null,
          tags: (result.task._user_tags || "").split(',').reduce((c,t) => {
            if ( t ) c.push(t);
            return c;
          }, [])
        }

        return task;
      });
    })
    .then((results : DataTypes.Task[]) => {
      // get parent labels
      return Promise.all(results.map((t : DataTypes.Task) => resolveTaskParent(t)));
    })
    .then((results : DataTypes.Task[]) => {
      // order tasks by weight
      return results.sort((a : DataTypes.Task, b : DataTypes.Task) => {
        return a.weight - b.weight;
      });
    });
  },

  startTask(
      task : DataTypes.Task, 
      activity : DataTypes.Activity,
      timestamp : Moment, 
      employee_name : string 
    ) : Promise<any> {

    let dayStart : Moment = moment(timestamp).startOf("day");
    let dayEnd : Moment = moment(timestamp).endOf("day");

    return findRunningTimesheetDetails(employee_name)
      .then((results : QuerySheetDetailsResult[])=> {
        if ( results.length == 0 ) {
          return [];

        } else {
          // get first timesheet so we can let the user know on what day the task was left running
          let result = results[0];
          throw new InvalidOperation(`There is a timer already running on ${result.timesheet.start_date}`);
        }
      })
      .then(() => {

        return frappe.resource("Timesheet")
        .read({
          fields: TimesheetFields,
          filters: [
            ["start_date", ">=", dayStart.format(dateTimeFormat)],
            ["start_date", "<=", dayEnd.format(dateTimeFormat)]
          ],
          order_by: "start_date DESC",
          limit_page_length: 1
        })
  
      })
      .then((result : Timesheet[]) => {

        // do we have a timesheet for this day?
        if ( result.length == 0 ) {
          // create a new timesheet
          // due to Timesheet requiring at least one time_log entry
          // we'll add our Timesheet Detail now
          // where as if the Timesheet already existed we would insert it instead
          return frappe.resource("Timesheet")
            .create({
              start_time: dayStart.format(dateTimeFormat),
              employee: employee_name,
              time_logs: [buildTimesheetDetail(task.id, task.project, activity, timestamp)],
              status: "Draft"
            })
            .then(result => {
              console.log("After timesheet creation: ", result);
              return { timesheet: result.data, create: false };
            })
        } else {
          return { timesheet: result[0], create: true };
        }

      })
      .then(result => {
        if ( result.create ) {
          return frappe
          .resource("Timesheet Detail")
          .create(buildTimesheetDetail(task.id, task.project, activity, timestamp, result.timesheet.name))
          .then(() => {
            return timestamp;
          })
        } else {
          return timestamp;
        }
      })
    
  },

  stopTask(
      task : DataTypes.Task, 
      timestamp : Moment, 
      employee_name : string
    ) {

    return findRunningTimesheetDetails(employee_name)
      .then(results => {
        if ( results.length != 0 && results[0].details.length != 0 ) {
          let result = results[0];
          let detail = result.details[0];
          let from_time = moment(detail.from_time, dateTimeFormat);
          let ms = moment.duration(
              timestamp.diff(from_time)
            ).asMilliseconds();
          return frappe.resource("Timesheet Detail")
            .update(detail.name, {
              to_time: timestamp.format(dateTimeFormat),
              hours: ms / 3600000
            });
        }

        throw new InvalidOperation("Unable to find running timer for this task.")
      });
    
  }
};

export default API;