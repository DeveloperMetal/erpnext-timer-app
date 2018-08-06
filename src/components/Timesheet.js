import React from 'react'
import { Button, ButtonGroup, ProgressBar, Icon, Intent } from "@blueprintjs/core";
import { withContentRect } from 'react-measure';
import moment from "moment";

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

const TimeEntry = ({ project, title, message, minutes, isActive, onPlayClick, onEditClick }) => {

  let progress = .5;
  let hours = Math.floor(minutes / 60);
  minutes = minutes - (hours * 60);

  return <li className={"entry" + (isActive ? " active" : "")}>

    <div className="wrap">

      <div className="details">
        <div className="project"><Icon icon="projects" /> {project}</div>
        <div className="title"><Icon icon="tag" /> {title}</div>
        <div className="message"><Icon icon="comment" /> {message}</div>
      </div>

      <div className="right-col">

        <div className="actions">
          <Button icon={isActive ? "stop" : "play"} minimal onClick={onPlayClick} />
          <Button icon="edit" minimal onClick={onEditClick} />
        </div>

        <div className="time">
          {hours} : {minutes}
        </div>
      </div>

    </div>
    {isActive && <ProgressBar value={progress} animate={false} stripes={false} />}
  </li>
}

class TimeTracker extends React.PureComponent {
  render() {
    let minutes = (60 * 2) + 15;
    return <ul className="time-tracker">
      <TimeEntry project="JHA" isActive title="Do stuff" message="Stuff done" minutes={minutes}></TimeEntry>
      <TimeEntry project="JHA" title="Do stuff" message="Stuff done" minutes={minutes}></TimeEntry>
      <TimeEntry project="JHA" title="Do stuff" message="Stuff done" minutes={minutes}></TimeEntry>
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
      if (this.props.onDateChange) {
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

export default class Timesheet extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      date: moment(new Date())
    }
  }

  handleDayChange(date) {
    this.setState({
      date
    });
  }

  render() {

    return (<div className="page timesheet">
      <WeekView date={this.state.date} onChange={this.handleDayChange.bind(this)} />
      <TimeTracker date={this.state.date} />
    </div>);
  }
}