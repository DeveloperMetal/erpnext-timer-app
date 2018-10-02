import React from "react";

// Third party
import { Card, Button, Tag } from "@blueprintjs/core";

// App 
import { BackendConsumer } from "../connectors2/Data";

export class TaskListItem extends React.PureComponent {
  constructor(props) {
    super(props)
  }

  render() {

    const { task_started, to_time, name, project, parent, subject, description, _user_tags, onStartTask, onStopTask } = this.props;
    const tags = [];
    if ( _user_tags ) {
      _user_tags.split(',').forEach(tag => {
        tag = tag.trim();
        if ( tag.length > 0 ) {
          tags.push(<Tag key={tag} minimal>{tag}</Tag>);
        }
      })
    }
    const onPlayClick = () => {
      if ( task_started ) {
        onStopTask(name)
      } else {
        onStartTask(name, project)
      }
    }

    return <Card elevation={1} interactive className="task-list-item">
      <div className="related">
        <div className="project-name">{ project && ( <Button minimal small icon="git-branch" text={project} /> )}</div>
        <div className="parent">{ parent && ( <Button minimal small icon="bookmark" text={parent} /> )}</div>
      </div>
      <div className="task-content">
        <div className="task-info">
          <div className="subject">{subject}</div>
          <div className="description">{(description || "").substring(0, 140)}</div>
          <div className="elapsed-time">Running Time: <span className="measure">0:00:00</span></div>
        </div>
        <div className="actions">
          <Button icon={task_started?"stop":"play"} minimal large onClick={onPlayClick} />
        </div>
      </div>
      <div className="tags">
        { tags }
      </div>
    </Card>
  }
}

export class TaskList extends React.PureComponent {
  constructor(props) {
    super(props);

    console.log(props);

    this.state = {
      tasks: []
    }
  }

  componentDidMount() {
    const { backend } = this.props;

    backend.actions.listTasks((tasks) => {
      this.setState({
        tasks
      });
    })
  }

  onStartTask(task_name, project_name) {
    const { backend } = this.props;

    backend.actions.startTask(task_name, project_name, (success, err) => {
      if ( success ) {
        let tasks = this.state.tasks.slice(0);
        let task = this.state.task.find(t => t.name === task_name);
        task.task_started = true;
        this.setState({
          tasks
        });
      }
    })
  }

  onStopTask(task_name) {
    const { backend } = this.props;

    backend.actions.stopTask(task_name, (success, err) => {
      if ( success ) {
        let tasks = this.state.tasks.slice(0);
        let task = this.state.task.find(t => t.name === task_name);
        task.task_started = false;
        this.setState({
          tasks
        });
      }
    })
  }

  render() {

    const onStartTask = (task_name, project_name) => this.onStartTask(task_name, project_name);
    const onStopTask = (task_name) => this.onStopTask(task_name);

    return <div className="page">
      <div className="page-title">Tasks</div>
      <div className="task-list">
        { this.state.tasks.map(t => <TaskListItem 
            key={t.name} {...t} 
            onStartTask={onStartTask}
            onStopTask={onStopTask}
          />) }
      </div>
    </div>
  }
}

export function TaskPage(props) {
  return <BackendConsumer>
    {backend => <TaskList backend={backend} />}
  </BackendConsumer>
}

export default TaskPage;