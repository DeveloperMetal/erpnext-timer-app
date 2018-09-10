import moment from "moment";
import React from 'react'
import { Button, ButtonGroup, ProgressBar, Icon, Intent } from "@blueprintjs/core";
import { withContentRect } from 'react-measure';
import { padLeft } from '../utils';

import { BackendConsumer } from '../connectors/Data';
import { AppToaster } from './AppToaster';

const Day = ({ date, size, active, onClick }) => {
  let name = date.format('d'.repeat(size));
  if (size == 1) {
    name = date.format('dd').charAt(0);
  }
  let today = moment(new Date());
  let intent = today.isSame(date, 'day') ? Intent.PRIMARY : Intent.NONE;

  return <div className="day">
    <Button
      className="day-btn"
      intent={intent}
      minimal={true}
      active={active}
      onClick={() => onClick(date)}
    >
      <span className="name">{name}</span>
      {(size > 1) && <span className="date">{date.format('D' + (size > 3 ? 'o' : ''))}</span>}
    </Button>
  </div>
};

const DayGroup = withContentRect('bounds')(({ measureRef, measure, contentRect, date, size, activeDay, onDayPick }) => {

  let days = [];
  let weekStart = date.clone();
  for (var i = 0; i < 7; i++) {
    let day = weekStart.add(1, 'days');
    days.push((<Day
      key={day.format()}
      date={moment(day)}
      size={size}
      active={activeDay == i}
      onClick={(date) => onDayPick(date)}
    />));
  }

  return <div className="day-group" ref={measureRef}>
    <Button icon="caret-left" minimal={true} onClick={() => {
      onDayPick(date.clone().add(activeDay + 1, 'days').subtract(1, 'days'));
    }} />
    <div className="day-column">
      <Button
        minimal={true}
        text={date.format("MMMM") + ", Week " + (Math.ceil(date.date() / 7)) + date.format(", YYYY")}
        fill={true}
      />
      <div className="days">
        {days}
      </div>
    </div>
    <Button icon="caret-right" minimal={true} onClick={() => {
      onDayPick(date.clone().add(activeDay + 1, 'days').add(1, 'days'));
    }} />
  </div>
});

const TimeEntry = (props) => {

  const { entry = {}, onToggleTimer, onEditClick } = props;
  const { id, progress = 0, title, description, time, isActive } = entry;
  let hours = Math.floor(time / 60);
  let minutes = Math.floor(time - (hours * 60));

  console.log("Render entry");

  return <li className={"entry" + (isActive ? " active" : "")}>

    <div className="wrap">

      <div className="details">
      
        <div className="project"><Icon icon="projects" /> {entry.task.project.title}</div>
        <div className="title"><Icon icon="tag" /> {title}</div>
        <div className="message"><Icon icon="comment" /> {description.length > 128?description.substring(0, 128)+'...':description}</div>
      </div>

      <div className="right-col">

        <div className="actions">
          <Button icon={isActive ? "stop" : "play"} minimal onClick={() => onToggleTimer(entry)} />
          <Button icon="edit" minimal onClick={() => onEditClick(props)} />
        </div>

        <div className="time">
          {padLeft(0, hours, 2)} : {padLeft(0, minutes, 2)}
        </div>
      </div>

    </div>
    {isActive && <ProgressBar value={progress} animate={false} stripes={false} />}
  </li>
}

class TimeTracker extends React.PureComponent {
  render() {

    let entries = this.props.entries.map(entry => <TimeEntry 
        key={entry.id}
        entry={entry}
        onToggleTimer={this.props.onToggleTimer}
        onEditClick={this.props.onEditEntry}
      />
    );

    return <ul className="time-tracker">
      { entries }
    </ul>;
  }
}

class WeekView extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      size: 5,
      activeDay: props.date.day(),
      activeDate: props.date
    }
  }

  handleDayPick(date) {
    let dayNum = date.day();
    this.setState({
      activeDay: dayNum,
      activeDate: date
    }, () => {
      if (this.props.onChange) {
        this.props.onChange(date);
      }
    })
  }

  render() {

    let weekDate = this.state.activeDate.clone().startOf('week').subtract(1, 'days');

    return <div className="week-widget">
      <DayGroup
        onDayPick={this.handleDayPick.bind(this)}
        date={weekDate}
        activeDay={this.state.activeDay}
        size={this.state.size}
        bounds
        onResize={(contentRect) => {
          let size = 4;
          if (contentRect.bounds.width < 600) {
            size = 3;
          }
          if (contentRect.bounds.width < 500) {
            size = 2;
          }
          if (contentRect.bounds.width < 400) {
            size = 1;
          }
          this.setState({
            size
          });
        }}
      />

    </div>
  }
}

export class TimesheetPage extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      date: moment(new Date()),
      week: moment(new Date()).startOf('week'),
      days: {},
      entries: []
    }
  }

  componentDidMount() {
    this.updateDateRange();
  }

  updateDateRange() {
    this.props.backend
      .fetchDays(this.state.week, this.state.week.clone().add(7, 'days'))
      .then(days => {
        this.setState({
          days,
          entries: this.getDayEntries(this.state.date)
        })
      })
      .catch(err => {
        this.displayError("Error while fetching day data.", err);
      })
  }

  displayError(label, err, icon, intent) {
    console.error(err);
    
    let errors = [label];
    errors.push(err.message);

    AppToaster.show({
      icon: icon || 'globe-network',
      intent: intent || Intent.DANGER,
      message: <div>{errors.map(e => <div key={e}>{e}</div>)}</div>
    });
  }

  getDayEntries(date) {
    // remote time component from date so we can match purely by date.
    let key = date.format('YYYY-MM-DD');
    if (key in this.state.days ) {
      return this.state.days[key].taskLogs;
    }

    return [];
  }

  onToggleTimer(taskLog) {
    console.log(taskLog);
    if ( taskLog.isActive ) {
      taskLog.stopTimer()
        .then(() => {
          // force refresh IF taskLogs have actually changed
          this.setState({
            entries: this.getDayEntries(this.state.date)
          })
        })
        .catch(err => {
          this.displayError("There was an error stopping timer:", err);
        })
    } else {
      taskLog.startTimer()
        .then(() => {
          console.log("Timer started...");
          // force refresh IF taskLogs have actually changed
          this.setState({
            entries: this.getDayEntries(this.state.date)
          }, () => {
            console.log("re-render?");
          })
        })
        .catch(err => {
          this.displayError("There was an error starting timer:", err);
        })
    }
  }

  onEditEntry(entry) {
    let day = this.state.days[moment(this.state.date).startOf('day').format('YYYY-MM-DD')];
    this.props.history.push(`/timesheet/${day.id}/${entry.id}`);
  }

  handleDayChange(date) {
    let newWeek = moment(date).startOf('week');
    this.setState({
      date,
      week: newWeek,
      entries: this.updateDateRange(date)
    });
  }

  render() {
    console.log("Timesheet: ", this.props);
    return <div className="page timesheet">
      <WeekView date={this.state.date} onChange={this.handleDayChange.bind(this)} />
      <TimeTracker 
        date={this.state.date} 
        entries={this.state.entries || []}
        onToggleTimer={this.onToggleTimer.bind(this)}
        onEditEntry={this.onEditEntry.bind(this)}
      />
    </div>;
  }
}

export const Timesheet = (props) => {
  return <BackendConsumer>{backend => {
    return <TimesheetPage backend={backend} {...props} />}}
  </BackendConsumer>;
}
export default Timesheet;