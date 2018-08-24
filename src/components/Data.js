
export class DataObject {
  constructor(props) {
    if ( typeof props === 'object' ) {
      Object.keys(props).forEach(key => {
        if ( this.hasOwnProperty(key) ) {
          this[key] = props[key];
        }
      })
    }
  }
}

export class DayLog {
  date = null;
  timeLog = [];

}

export class TimeLog {
  startTime = null;
  time = 0;
  tasks = [];
  
}

export class Task {
  label = "";
  assignTo = "";

}