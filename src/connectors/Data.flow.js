// @flow

import type Moment from 'moment';

export type Auth = {
  usr : string,
  pwd : string,
  host : string
}

export type LoginOptions = {
  rememberLogin: boolean,
  autoLogin: boolean
}

export type ErrorInfo = {
  status : number,
  statusText : string,
  data : string,
  message : string,
  server_messages : any,
  remoteTrace : any
}

export type PageProps = {
  nav: (path : string) => void
}

export type Props = {

}

export type User = {
  employee_name : string,
  avatar?: string | null,
  fullname?: string | null,
  id: string
}

export type State = {
  loggedIn : boolean,
  attemptingLogin : boolean,
  auth : Auth,
  user : User,
  day : Moment,
  actions : any,
  timeline : TimelineItem[],
  userMessages: any[],
  tasks: Task[],
  activities: Activity[],
  projects: Project[]
}

export type ResultCallback = (result? : any, err? : Error) => void

export type Project = {
  id : string,
  label: string
}

export type Task = {
  id : string,
  weight: number,
  label : string,
  description : string,
  total_hours : number,
  is_running : boolean,
  last_open_timer : Moment | null,
  project_label : string,
  project_id : string,
  parent_id : string | null,
  parent_label: string | null,
  tags : Array<string>,
  assigned_users: Array<string>
}

export type TaskList = Array<DataTypes.Task>;

export type TimelineItem = {
  id: string,
  timesheet_id: string,
  start: Moment,
  end: Moment,
  color?: string | null,
  task_label: string,
  task_description: string,
  task_id: string,
  is_running?: boolean,
  canResize?: boolean,
  canDrag?: boolean,
  onDelete?: (item : TimelineItem) => void | null, 
  onStopTimer?: (item : TimelineItem) => void | null, 
  onOpenBrowser?: (url : string) => void | null, 
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
  listDayTimeline(employe_name:string, day: Moment) : Promise<TimelineItem[]>,
  updateTimelineItem(item : TimelineItem) : Promise<TimelineItem>,
  listProjects() : Promise<Project[]>,
  listTasks(employee_name : string) : Promise<Task[]>,
  newTask(task : Task) : Promise<any>,
  deleteTimeblock : (timeblock_id : string) => Promise<any>,
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
  ) : Promise<any>,
  globalSearch(
    text : string,
    doctype : string,
  ) : Promise <string[]>
}