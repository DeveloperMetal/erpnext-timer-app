// @flow

import { ipcRenderer } from 'electron';
import { mainProcessAPI } from "../utils";

// Third party
import React from "react";
import { ControlGroup, Switch, InputGroup, Card, Button, Tag, MenuItem, Intent, Spinner } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import  classNames from 'classnames';
import moment from "moment";
import momentDurationFormatSetup from "moment-duration-format";
momentDurationFormatSetup(moment);

// Flow types
import type { 
  TaskListState, TaskListProps,
  TaskListItemProps, TaskListItemState
} from "./Tasks.flow";
import * as DataTypes from "../connectors/Data.flow";
import type Moment from "moment";
import * as ReactTypes from "react";

// Components
import { BackendConsumer } from "../connectors/Data";
import { makeCancelable, throttle, decodeHTML } from "../utils";
import UserAvatar from "./UserAvatar";
import ProjectFilter from "./ProjectFilter";

const ActivityPredicate = (query, activity) => {
  return activity.label.toLowerCase().indexOf(query.toLowerCase()) >= 0;
}

const ActivityRenderer = (activity, { handleClick, modifiers }) => {
  if (!modifiers.matchesPredicate) {
    return null;
  }

  return <MenuItem 
    key={activity.id}
    onClick={handleClick}
    text={activity.label}
  />
}

export class TaskListItem extends React.Component<TaskListItemProps, TaskListItemState> {

  timerId : ?IntervalID;
  playPromise : ?any;

  constructor(props : TaskListItemProps) {
    super(props)

    this.state = {
      from_time: props.task.is_running?props.task.last_open_timer:null,
      to_time: null,
      waiting: false
    }
    this.timerId = null; 
  }

  shouldComponentUpdate(newProps : TaskListItemProps, newState : TaskListStateProps) : boolean {

    if ( newProps.task.id != this.props.task.id ) {
      this.stopTimer();
    }

    return this.props.to_time != newProps.to_time || 
    this.props.from_time != newProps.from_time || 
    this.props.waiting != newProps.waiting ||
    this.props.task.id != newProps.task.id ||
    this.props.task.is_running != newProps.task.is_running ||
    this.state.to_time != newState.to_time;
  }

  setupTimer() {
    this.timerId = setInterval(() => {
      this.setState({
        to_time: moment()
      })
    }, 1000);
  }

  stopTimer() {
    if ( this.timerId ) {
      clearInterval(this.timerId)
      this.timerId = null;
    }
  }

  onTimerStarted() {
    this.setState({
      from_time: moment(this.props.task.last_open_timer)
    })

    this.setupTimer();
  }

  componentDidMount() {
    if ( this.props.task.is_running && !this.timerId ) {
      this.onTimerStarted();
    } else if ( !this.props.task.is_running ) {
      this.stopTimer();
    }
  }

  componentDidUpdate() {
    if ( this.props.task.is_running && !this.timerId ) {
      this.onTimerStarted();
    } else if ( !this.props.task.is_running ) {
      this.stopTimer();
    }
  }

  componentWillUnmount() {
    if ( this.timerId ) {
      clearInterval(this.timerId);
    }

    if ( this.playPromise ) {
      this.playPromise.cancel();
    }
  }

  render() {
    const { onStartTask, onStopTask, task } = this.props;
    const tags = [];
    if ( task.tags ) {
      task.tags.forEach(tag => {
        tag = tag.trim();
        if ( tag.length > 0 ) {
          tags.push(<Tag key={tag} minimal>{tag}</Tag>);
        }
      })
    }
    const onPlayClick = (activity) => {
      this.setState({
        waiting: true,
      }, () => {
        this.playPromise = makeCancelable(onStartTask(task, activity, this.onTimerStarted));
        this.playPromise.promise
          .then(() => {
            this.setState({ waiting: false })
          })
          .catch(() => {
            // there should be no errors happening here
            // this promise is here to handle the spinner display
          });
      });
      
    }
    const onStopClick = () => {
      this.setState({
        waiting: true,
      }, () => {
        this.playPromise = makeCancelable(onStopTask(task));
        this.playPromise.promise
          .then(() => {
            this.setState({ waiting: false });
          })
          .catch(() => {
            // there should be no errors happening here
            // this promise is here to handle the spinner display
          })
      });
    }

    let total_ms = Math.floor((task.total_hours || 0) * 3600000);

    if ( task.is_running && this.state.to_time ) {
      total_ms += moment.duration(this.state.to_time.diff(this.state.from_time), "ms").asMilliseconds();
    }
    
    let total_time = moment.duration(total_ms, "ms").format()
    let description = (task.description || "");

    return <Card 
        elevation={1} 
        interactive 
        className={ classNames("task-list-item", { 
          is_running: task.is_running 
        }) } >
      <div className="related">
        <div className="project-name">{ task.project_label && ( <Button minimal small icon="git-branch" text={decodeHTML(task.project_label)} /> )}</div>
        <div className="parent">{ task.parent_label && ( <Button minimal small icon="bookmark" text={decodeHTML(task.parent_label)} /> )}</div>
      </div>
      <div className="task-content">
        <div className="task-info">
          <div className="subject">{decodeHTML(task.label)}</div>
          <div className="description">{decodeHTML(description.substring(0, 140))}</div>
          <div className="elapsed-time">Running Time: <span className="measure">{total_time}</span></div>
        </div>
        <div className="actions">

          { this.state.waiting && (
            <Spinner size="30" />
          ) }

          { !this.state.waiting && (
            <React.Fragment>

              { task.is_running && (
                <Button icon="stop" minimal large onClick={onStopClick} />
              ) }

              { !task.is_running && (
                <Select
                  resetOnClose
                  resetOnQuery 
                  resetOnSelect
                  items={this.props.activities || []}
                  itemPredicate={ActivityPredicate}
                  itemRenderer={ActivityRenderer}
                  noResults={<MenuItem disabled text="No Results." />}
                  onItemSelect={onPlayClick}
                >
                  <Button icon="play" minimal large />
                </Select>
              ) }

            </React.Fragment>
          ) }

        </div>
      </div>
      <div className="assigned">{
        (task.assigned_users || []).map((a) => (
          <UserAvatar key={`${task.id}.${a}`} user={a} fetchUser={(userId) => this.props.backend.actions.getUserDetails(userId)} />
        ))
      }</div>
      <div className="tags">
        { tags }
      </div>
    </Card>
  }
}

export class TaskList extends React.Component<TaskListProps, TaskListState> {
  search : any | null;

  constructor(props : TaskListProps) {
    super(props);

    this.state = {
      tasks: [],
      search: "",
      searching: false,
      onTimerStartGoto: 'timesheet',
      filteredTasks: [],
      renderTasks: [],
      renderId: 0,
      update: false,
      assignedOnly: true
    }

    this._willUnmount = false;
    this.searchTimeout = false;
    this.prTimeoutID = false;
  }

  shouldComponentUpdate(newProps, newState) {
    if ( this.props.backend.activeTaskID != newProps.backend.activeTaskID ) {
      this.updateTasks();
    }

    return this.state.update != newState.update ||
      this.props.backend.tasks != newProps.backend.tasks ||
      this.props.backend.selectedProjects != newProps.backend.selectedProjects ||
      this.state.renderTasks.length != newState.renderTasks.length;
  }

  updateTasks() {
    if ( this._willUnmount ) {
      return;
    }

    const { backend } = this.props;

    backend.actions.listTasks()
    .then(() => {
      return mainProcessAPI("getUserSettings", ["onTimerStartGoto"])
    })
    .then((result) => {
      if ( !this._willUnmount ) {
        this.setState({
          ...result
        }, () => {
          this.updateSearch(this.state.search, 0);
        });
      }
    });  }

  componentDidMount() : void {
    this._willUnmount = false;
    this.updateTasks();
  }

  componentWillUnmount() : void {
    this._willUnmount = true;
  }


  onStartTask(task : DataTypes.Task, activity : DataTypes.Activity) : Promise<any> {
    const { backend } = this.props;

    return backend.actions.startTask(task, activity).then(() => {
      if ( this.state.onTimerStartGoto === 'timesheet' ) {
        this.props.nav("timesheet");
      } else {
        this.updateSearch(this.state.search);
      }
    })
  }

  onStopTask(task : DataTypes.Task) : Promise<any> {
    const { backend } = this.props;

    return backend.actions.stopTask(task)
      .then(() => this.updateSearch(this.state.search));
  
  }

  sortTasks(tasks) {
    const { backend } = this.props;
    const { isProjectSelected } = backend.actions;

    tasks.sort((a : DataTypes.Task, b : DataTypes.Task ) => {
      if ( a.is_running ) {
        return -1;
      }

      if ( b.is_running ) {
        return 1;
      }

      let aIsAssignedToUser = a.assigned_users.indexOf(this.props.backend.user.id) > -1;
      let bIsAssignedToUser = b.assigned_users.indexOf(this.props.backend.user.id) > -1;

      if ( aIsAssignedToUser && bIsAssignedToUser ) {
        return a.weight - b.weight;  
      } else if (aIsAssignedToUser) {
        return -1;
      } else if (bIsAssignedToUser) {
        return 1;
      }

      return a.weight - b.weight;
    });

    return tasks.filter((r) => {
      if ( backend.selectedProjects.length == 0 ) {
        return true;
      }
      
      return isProjectSelected(r.project_id);
    });
  }

  handleSearchChange(event : any) : void {
    this.updateSearch(event.target.value);
  }

  handleProjectsChange() : void {
    this.updateSearch(this.state.search);
  }

  updateSearch(filter : string, timeout : number = 800) : void {

    if ( this.searchTimeout ) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = false;
    }

    this.setState({
      searching: true
    });

    const { backend } = this.props;
    const { isProjectSelected, taskSearch } = backend.actions;

    this.searchTimeout = setTimeout(() => {
      return taskSearch(filter, this.state.assignedOnly?this.props.backend.user.id:"")
        .then((result) => {
          this.searchTimeout = false; 
          this.setState({
            searching: false,
            search: filter,
            update: !this.state.update,
            renderTasks: [],
            filteredTasks: this.sortTasks(this.props.backend.tasks.reduce((r, t) => {
              if ( result.indexOf(t.id) > -1 ) {
                r.push(t);
              }
              return r;
            }, []))
          }, () => {
            this.setupProgressiveRendering(4);
          });
        });
    }, timeout);
    
  }

  setupProgressiveRendering(renderCount = 10) {
    // This works by slicing rendered tasks and issue rendering
    // after a few sets of slices at a time.
    // The timeout length is 160ms because most people reaction time is around
    // at 80ms. Coupled with at least 4 tasks rendered at a time we can stretch
    // perceived rendering to look imediate while the rest of the tasks update at
    // 160ms and avoid clogging cpu cycles.

    if ( this.prTimeoutID ) {
      clearTimeout(this.prTimeoutID);
    }

    this.prTimeoutID = setTimeout(() => {
      this.prTimeoutID = false;

      if ( this.state.renderTasks.length < this.state.filteredTasks.length ) {
        this.setState((oldState) => {
          const startIdx = oldState.renderTasks.length;
          const maxCount = oldState.filteredTasks.length - oldState.renderTasks.length;
          const insertCount = renderCount > maxCount?maxCount:renderCount;
          const insertSlice = oldState.filteredTasks.slice(startIdx, startIdx + insertCount);

          return {
            progressiveRendering: true,
            renderTasks: [...oldState.renderTasks, ...insertSlice]
          };
        }, () => {
          if ( this.state.progressiveRendering ) {
            this.setupProgressiveRendering(renderCount);
          }
        })
      }

    }, 160);
  }

  handleAssignedChange(event : any) : void {
    if ( this.prTimeoutID ) {
      clearTimeout(this.prTimeoutID);
    }

    this.setState({
      searching: true,
      assignedOnly: event.target.checked?true:false,
      update: !this.state.update,
      renderTasks: [],
      progressiveRendering: false
    }, () => {
      this.updateSearch(this.state.search)
    });
  }

  render() {

    const handleSearchChange = (event : any) => this.handleSearchChange(event)
    const handleAssignedChange = (event : any) => this.handleAssignedChange(event)
    const handleProjectsChange = () => this.handleProjectsChange();

    const onStartTask = (task : DataTypes.Task, activity : DataTypes.Activity) : Promise<any>  => {
      return this.onStartTask(task, activity);
    }
    const onStopTask = (task : DataTypes.Task) : Promise<any> => {
      return this.onStopTask(task);
    }

    let searchLeftIcon = "search";
    if ( this.state.searching ) {
      searchLeftIcon = (<Spinner size={15} intent={Intent.PRIMARY} className="small-spinner"/>);
    }

    return <div className="page page-tasks">
      <div className="page-title">Tasks</div>
      <div className="page-toolbar row">
        <ControlGroup className="ctrl-flex col-md-6 col-sm-12">
          <InputGroup 
            fill
            autoFocus
            className="ctrl-field ctrl-flex-auto"
            leftIcon={searchLeftIcon}
            type="search"
            placeholder="Search tasks..."
            onChange={handleSearchChange}
            />
          <Switch 
            large 
            className="ctrl-field ctrl-std ctrl-flex-static"
            checked={this.state.assignedOnly} 
            label="Assigned" 
            onChange={handleAssignedChange} />
        </ControlGroup>
        <ControlGroup className="ctrl-flex col-md-6 col-sm-12">
          <ProjectFilter 
            backend={this.props.backend} 
            onChange={handleProjectsChange}
            />
        </ControlGroup>
      </div>
      <div className="page-content">
        <div className="task-list">
            { this.state.renderTasks.map((t, k) => 
                <TaskListItem 
                  key={`task-${t.id}`} 
                  task={t}
                  backend={this.props.backend}
                  activities={this.props.backend.activities || []}
                  onStartTask={onStartTask}
                  onStopTask={onStopTask} />
            )}
        </div>
      </div>
    </div>
  }
}

export function TaskPage(props : DataTypes.PageProps) {
  return <BackendConsumer>
    {backend => <TaskList backend={backend} {...props} />}
  </BackendConsumer>
}

export default TaskPage;