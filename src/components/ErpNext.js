import axios from 'axios';
import moment from 'moment';

export default class ErpNextConnector {

  constructor() {
    this.auth = null;
  }

  login(auth) {
    return axios.post(`${auth.host}/api/method/login`, `usr=${auth.usr}&pwd=${auth.pwd}`)
      .then(response => {
        this.auth = auth;
        return response;
      })
  }

  getProjects() {
    return Promize.reject();
  }

  getTasks() {
    return Promize.reject();
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