import moment from "moment";
import React from 'react'
import { Button, Slider, ProgressBar, Icon, Intent, PanelStack } from "@blueprintjs/core";
import { withContentRect } from 'react-measure';
import EditTimeEntry from './EditEntry';

import { padLeft } from '../utils';

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

    let slices = [];
    for(let i=0; i < 24; i++) {
      let t = moment(`${i}:00`, 'HH:mm').format("hh:mm a");
      slices.push(<div key={`slice-${t}`} className="slice">{t}</div>);
    }

    return <div className="time-tracker">
      <div className="time-slices">{slices}</div>
      <ul className="time-entries">
        { entries }
      </ul>
    </div>;
  }
}

class WeekView extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      size: 5
    }
  }

  render() {

    const weekDate = this.props.date.clone().startOf('week').subtract(1, 'days');
    const activeDay = this.props.date.day();

    return <div className="week-widget">
      <DayGroup
        onDayPick={this.props.onChange}
        date={weekDate}
        activeDay={activeDay}
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

export class TimesheetPanel extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      timeZoom: 0
    }
  }

  onEditEntry(entry) {
    const { backend } = this.props;
    this.props.openPanel({
      component: EditEntry,
      props: { entry, ...this.props},
      title: `Edit ${backend.currentDate.format('dddd, LL')}`
    })
  }

  render() {
    const { backend } = this.props;
    const onZoomChange = (zoom) => this.setState({timeZoom: zoom});

    console.log(backend.currentDate.format("YYYY-MM-DD"));

    return <div className="page timesheet">
      <WeekView date={backend.currentDate} onChange={backend.actions.setCurrentDate} />
      <div className="timesheet-zoom">
        <Slider 
          min={0} 
          max={60} 
          stepSize={1} 
          labelStepSize={15} 
          value={this.state.timeZoom}
          onChange={onZoomChange}
        />
      </div>
      <TimeTracker 
        date={backend.currentDate} 
        entries={backend.entries}
        onToggleTimer={backend.actions.startTimer}
        onEditEntry={this.onEditEntry.bind(this)}
      />
    </div>;
  }
}

export class Timesheet extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      panels: [{ 
        component: TimesheetPanel, 
        title: "Timesheet", 
        props: this.props 
      }]
    }

    this.refHandlers = {
      panelStack: (ref) => this.panel = ref
    }
  }

  componentDidUpdate() {
    if ( !this.props.navMenu ) {
      return;
    }

    if ( this.props.location.pathname == '/timesheet' && this.state.panels[0].component !== TimesheetPanel ) {
      this.panel.handlePanelClose(this.state.panels[0]);
    }

    if ( !this.props.navMenu.hasSubMenu('timesheet', 'timesheet_add_entry') ) {
      this.props.navMenu.addSubMenu('timesheet', {
        id: "timesheet_add_entry",
        label: "Add Entry",
        icon: "plus",
        isActive: () => this.state.panels[0].title == "Add Entry",
        onSelect: () => this.addEntryClick()
      })
    }
  }

  addEntryClick() {
    if ( this.state.panels[0].component !== EditTimeEntry ) {
      this.props.history.push('/timesheet/add_entry');
      this.panel.handlePanelOpen({
        component: EditTimeEntry,
        title: "Add Entry",
        props: this.props
      });
    }
  }

  addPanel(newPanel) {
    this.setState({
      panels: [newPanel, ...this.state.panels]
    })
  }

  removePanel() {
    this.setState({
      panels: this.state.panels.slice(1)
    })
  }

  render() {
    const onAddPanel = (newPanel) => this.addPanel(newPanel);
    const onRemovePanel = () => this.removePanel();
    console.log("panel render");

    return <PanelStack ref={(ref=>this.refHandlers.panelStack(ref))} initialPanel={this.state.panels[0]} onOpen={onAddPanel} onClose={onRemovePanel} />
  }
}

export default Timesheet;