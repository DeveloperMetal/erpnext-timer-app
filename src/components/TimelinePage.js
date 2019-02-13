// @flow

// Third party components
import React from "react";
import { Timeline, ZOOMLEVELS } from "bloom-day-timeline";
import { ButtonGroup, Button, Popover, Menu, MenuItem, Intent } from "@blueprintjs/core";
import moment from "moment"
import { promiseFinally } from "../utils";

// Components
import { BackendConsumer } from "../connectors/Data";
import { Timer } from "./Timer";
import { DayPicker } from "./DayPicker";

// flow types
import * as DataTypes from "../connectors/Data.flow";
import type Moment from "moment";
import type { TimelineCompProps, TimelineCompState } from "./TimelinePage.flow";

const TimeBlockContentRenderer = (item : DataTypes.TimelineItem) => {
  const { 
    start, end, 
    timesheet_id,
    task_id, task_label, task_description, is_running, 
    onDelete, 
    onStopTimer, 
    onOpenBrowser } = item;

  const contextMenu = <Menu>
    <MenuItem 
      icon="time" 
      text="Open Timesheet on browser"
      onClick={() => onOpenBrowser?onOpenBrowser(`Doctype://Form/Timesheet/${timesheet_id}`):'' }
    />
    <MenuItem 
      icon="annotation" 
      text="Open Task on browser"
      onClick={() => onOpenBrowser?onOpenBrowser(`Doctype://Form/Task/${task_id}`):''}
    />
    { is_running && ( <MenuItem 
      icon="stop" 
      text="Stop Timer" 
      intent={Intent.WARNING} 
      onClick={() => onStopTimer?onStopTimer(item):''}  /> ) 
    }
    <Menu.Divider />
    <MenuItem 
      icon="delete" 
      text="Delete" 
      intent={Intent.DANGER} 
      onClick={() => onDelete?onDelete(item):''} />
  </Menu>;

  return <React.Fragment>
    <div className="top-bar">
      <div className="start">{start.format('h:mm a')}</div>
      <div className="title">{task_label}</div>
      <div className="end">
        <Timer key={`timer-${task_id}`} time={end} started={item.is_running || false} />
        <Popover 
          content={contextMenu} 
          className="bp3-dark"
          lazy={true}
          usePortal={true}
          hasBackdrop={true}
        >
          <Button intent={is_running?Intent.PRIMARY:Intent.NONE}  icon="cog" minimal small/>
        </Popover>
      </div>
    </div>
    <div className="content">{task_description}</div>
  </React.Fragment>
}

export class TimelineComp extends React.Component<TimelineCompProps, TimelineCompState> {
  blockUpdateTimeoutId : TimeoutID | void;

  constructor(props : TimelineCompProps) {
    super(props);

    this.state = {
      zoom: 1,
      refresh: 1
    };

    this.blockUpdateTimeoutId = undefined;
  }

  shouldComponentUpdate(newProps, newState) : bool {

    if ( this.props.backend.activeTaskID != newProps.backend.activeTaskID ) {
      newProps.backend.actions.listDayTimeline();
    }

    return this.state.zoom != newState.zoom ||
      this.state.refresh != newState.refresh ||
      this.props.backend.activeTaskID != newProps.backend.activeTaskID ||
      this.props.backend.tasks != newProps.backend.tasks ||
      this.props.backend.day != newProps.backend.day ||
      this.props.backend.timeline != newProps.backend.timeline;
  }

  watchTimeBlock(block_id : string, zoomLvl : number) :void {
    let now = moment();
    let minutes = ZOOMLEVELS[zoomLvl] * 60000;
    let round = Math.ceil((+now) / minutes) * minutes;
    let nextUpdate = moment(round);
    let ms = moment.duration(nextUpdate.diff(now)).asMilliseconds();

    if ( this.blockUpdateTimeoutId ) {
      clearTimeout(this.blockUpdateTimeoutId);
    }
    
    this.blockUpdateTimeoutId = setTimeout(() => {
      this.updateActiveBlock(block_id)
    }, ms)
  }

  updateActiveBlock(id : string) : void {
    const { backend } = this.props;
    // clear out our timeout resource id before we tell the backend to
    // update our timeblock end time. The re-rendering of the new timeline
    // will setup our block timer again on componentDidUpdate
    this.blockUpdateTimeoutId = undefined;
    backend.actions.updateActiveTimelineBlock(id, moment());
  }

  findWatchActiveSlice() : void {
    const { backend } = this.props;

    backend.timeline.forEach(block => {
      if ( block.is_running ) {
        this.watchTimeBlock(block.id, this.state.zoom)
      }
    })
  }

  componentDidMount() : void {
    const { backend } = this.props;

    backend.actions.listDayTimeline();
    this.findWatchActiveSlice();
  }

  componentDidUpdate() {
    this.findWatchActiveSlice();
  }

  componentWillUnmount() {
    if ( this.blockUpdateTimeoutId ) {
      clearTimeout(this.blockUpdateTimeoutId);
      this.blockUpdateTimeoutId = undefined;
    }
  }

  handleTimeBlockChange(item : DataTypes.TimelineItem) : void {
    const { backend } = this.props;
    backend.actions.updateTimelineBlock(item);
  }

  handleOpenBrowser(url : string) : void {
    window.open(url);
  }

  handleTimeBlockDelete(item : DataTypes.TimelineItem) : void {
    this.props.backend.actions.deleteTimeblock(item.id);
}

  handleStopTimer(item : DataTypes.TimelineItem) : void {
    const { backend } = this.props;
    let task : DataTypes.Task | null = backend.actions.getTaskById(item.task_id);
    if ( task ) {
      backend.actions
        .stopTask(task)
        .then(() => backend.actions.listDayTimeline());
    }
  }

  zoom(val : number) : void {
    if ( val != this.state.zoom ) {
      this.setState({
        zoom: val
      });
    }
  }

  zoomIntent(val : number) {
    return this.state.zoom===val?Intent.PRIMARY:Intent.DEFAULT;
  }

  render() {

    const { backend } = this.props;
    const onTimeBlockChange = (item : DataTypes.TimelineItem) => this.handleTimeBlockChange(item);
    const onOpenBrowser = (url : string) => this.handleOpenBrowser(url);
    const onDelete = (item : DataTypes.TimelineItem) => this.handleTimeBlockDelete(item);
    const onStopTimer = (item : DataTypes.TimelineItem) => this.handleStopTimer(item);

    return <div className="page timeline">
      <div className="page-title">Timeline</div>
      <DayPicker date={backend.day} onChange={backend.actions.setCurrentDate} />
      <div className="timeline-list">
        <Timeline 
          zoom={this.state.zoom}
          startTime={moment(backend.day).startOf("day")}
          endTime={moment(backend.day).endOf("day")}
          timeHeader="Time"
          contentHeader="Timesheet"
          items={this.props.backend.timeline.map((item) => Object.assign({}, item, {
            onOpenBrowser,
            onDelete,
            onStopTimer
          }))}
          itemContentRenderer={TimeBlockContentRenderer}
          onTimeBlockChange={onTimeBlockChange}
        />
      </div>
      <div className="zoom">
        <ButtonGroup fill large>
          <Button intent={this.zoomIntent(4)} onClick={() => this.zoom(4)} >
            <span className="value">5</span><span className="measure">Mins</span>
          </Button>
          <Button intent={this.zoomIntent(3)} onClick={() => this.zoom(3)} >
            <span className="value">10</span><span className="measure">Mins</span>
          </Button>
          <Button intent={this.zoomIntent(2)} onClick={() => this.zoom(2)} >
            <span className="value">15</span><span className="measure">Mins</span>
          </Button>
          <Button intent={this.zoomIntent(1)} onClick={() => this.zoom(1)} >
            <span className="value">30</span><span className="measure">Mins</span>
          </Button>
          <Button intent={this.zoomIntent(0)} onClick={() => this.zoom(0)} >
            <span className="value">1</span><span className="measure">Hour</span>
          </Button>
        </ButtonGroup>
      </div>
    </div>
  }
}

export function TimelinePage(props : DataTypes.PageProps) {
  return <BackendConsumer>
    {backend => <TimelineComp backend={backend} {...props} />}
  </BackendConsumer>
}

export default TimelinePage;