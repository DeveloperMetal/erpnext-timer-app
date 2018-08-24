import React from 'react';

import axios from 'axios';
import moment from 'moment';

export default class ErpNextConnector {

  constructor() {
    this.auth = null;
    this.projects = [];

    this.adapter = {
      projects: this.projects,
      login: this.login.bind(this),
      getProjects: this.getProjects.bind(this)
    }
  }

  login(auth) {
    return axios.post(`${auth.host}/api/method/login`, `usr=${auth.usr}&pwd=${auth.pwd}`)
      .then(response => {
        this.auth = auth;
        return response;
      })
      .then(response => { return this.getProjects(); });
  }

  encode(item) {
    return encodeURIComponent(JSON.stringify(item))
  }

  getProjects() {
    let fields=this.encode(["name","project_name","is_active","status","company","percent_complete", "percent_complete_method","priority"]);
    let filters=this.encode([["status", "=", "Open"]]);
    return axios.get(`${this.auth.host}/api/resource/Project?fields=${fields}&filters=${filters}`)
      .then(response => {
        this.projects = response.data;
        return this.projects;
      })
  }

  getTasks() {
    let fields = this.encode(["name", "progress", "exp_start_date", "priority", "description", "status", "is_group", "project", "actual_time", "_assign", "is_milestone", "_comments", "_user_tags", "depends_on_tasks", "expected_time", "exp_end_date"]);
    let filters = this.encode([["status", "!=", "Closed"], ["project", "!=", ""]]);
    return axios.get(`${this.auth.host}/api/resource/Task?fields=${fields}&filters=${filters}`)
      .then(response => {
        this.tasks = response.data;
        return this.tasks;
      })
  }

  getTimeSheet(date_start, date_end) {
    let fields = this.encode(["name", "status", "creation", "employee", "docstatus", "start_date", "total_hours", "note"]);
    let filters = this.encode([
      ["start_date", ">=", date_start.format("YYYY-MM-DD")], 
      ["start_date", "<=", date_end.format("YYYY-MM-DD")]
    ]);
    return axios.get(`${this.auth.host}/api/resource/Task?fields=${fields}&filters=${filters}`)
      .then(response => {
        this.timesheets = response.data;

        return this.timesheets;
      });
  }

  getTimeSheetDetails(parent) {

  }

  getDayEntries(date) {
    return Promize.reject();
  }

  updateEntry(entry) {
    return Promize.reject();
  }

  addEntry(date, entry) {
    return Promize.reject();
  }

  removeEntry(id) {
    return Promize.reject();
  }
}

const erpnextContext = React.createContext();

export class ERPNextProvider extends React.Component {
  render() {
    return <erpnextContext.Provider {...this.props} />
  }
}

export class ERPNextConsumer extends React.Component {
  render() {
    return <erpnextContext.Consumer {...this.props} />
  }
}