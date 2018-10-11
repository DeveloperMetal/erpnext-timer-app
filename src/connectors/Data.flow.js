// @flow

import type Moment from 'moment';

export type Auth = {
  usr : string,
  pwd : string,
  host : string
}

export type ErrorInfo = {
  status : number,
  statusText : string,
  data : string,
  message : string,
  server_messages : any,
  remoteTrace : any
}

export type Props = {

}

export type User = {
  employee_name : string
}

export type State = {
  loggedIn : boolean,
  attemptingLogin : boolean,
  auth : Auth,
  user : User,
  day : Moment,
  actions : any,
  timeline : TimelineItem[],
  errors: any[],
  tasks: Task[],
  activities: Activity[]
}

export type ResultCallback = (result? : any, err? : Error) => void

export type Task = {
  id : string,
  weight: number,
  label : string,
  description : string,
  total_hours : number,
  is_running : boolean,
  last_open_timestamp : Moment | null,
  project : string,
  parent : string | null,
  parent_label: string | null,
  tags : Array<string>
}

export type TimelineItem = {
  id: string,
  start: Moment,
  end: Moment,
  task: Task,
  canResize?: boolean,
  canDrag?: boolean
}

export type Activity = {
  id : string,
  label : string
}

export type TimeLog = {
  id : string,
  label : string,
  start_time : Moment,
  end_time : Moment,
  is_running : boolean
}

export type ConnectorAPI = {
  login(auth : Auth) : Promise<any>,
  listActivities() : Promise<Activity[]>,
  listDayTimeline(day: Moment, tasks : Task[]) : Promise<TimelineItem[]>,
  updateTimelineItem(item : TimelineItem) : Promise<TimelineItem>,
  listTasks(employee_name : string) : Promise<Task[]>,
  startTask(
    task : Task, 
    activity : Activity,
    timestamp : Moment, 
    employee_name : string 
  ) : Promise<any>,
  stopTask(
    task : Task, 
    timestamp : Moment, 
    employee_name : string
  ) : Promise<any>
}