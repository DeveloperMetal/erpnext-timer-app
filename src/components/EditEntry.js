import React from 'react'
import { Button, Spinner, FormGroup, InputGroup, Intent, Tooltip } from "@blueprintjs/core";
import { Select } from '@blueprintjs/select';
import { Future } from './Future';
import { BackendConsumer } from '../connectors/Data';
import { FieldSelect } from './Fields';

class EditorFields extends React.PureComponent {

  taskPredicate(query, task) {
    // don't filter out actions from list
    if (task.hasOwnProperty('_action')) {
      return true;
    }

    // combine values from project and task so we can search both
    let parts = Object.values(task).concat(Object.values(task.project))
      .filter(i => i != null)
      .map(i => i.toString().toLowerCase())
      .join('.');
    return parts
      .indexOf(query.toLowerCase()) >= 0;
  }

  renderTask(task, { handleClick, modifiers }) {
    if (!modifiers.matchesPredicate) {
      return null;
    }
    return (
      <li 
        key={task.name}
        onClick={handleClick}>

      </li>
    );
  }

  render() {
    return <div>
      <FieldSelect
        label="Task"
        id="tasks_select"
        items={this.props.tasks}
        itemRenderer={this.renderTask.bind(this)}
        itemPredicate={this.taskPredicate.bind(this)}
      >
        <Button 
          fill
          large
          text={this.props.selectedTask ? this.props.selectedTask.label:" - Select Task - "} 
          rightIcon="double-caret-vertical" />
      </FieldSelect>
    </div>;
  }
}

class Editor extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      name: null,
      availableTasks: [],
      task: null,
      project: null,
      description: '',
    }
  }

  onProjectChange(item) {

  }

  updateProjects() {
    return Promise.all([
      this.props.backend.fetchProjects(),
      this.props.backend.fetchTasks()
    ]).then(results => {

      this.projects = results[0];
      this.tasks = results[1];

      this.setState({
        availableTasks: [{
          name: '-new-task-',
          label: 'New Task',
          _action: true,
          project: null
        }].concat(results[1])
      }, () => {
        console.log('Got data...', this.state.availableTasks);
      })
    });
  }

  render() {

    console.log("Entry Editor: ", this.props);

    return (
      <Future
        interface={ 
          (futureInt) => this.setState(
              { futureInt }, 
              () => futureInt.waitPromise(this.updateProjects())
            )
          }
        onWait={ (futureInt) => <Spinner /> }
        onFail={ (futureInt, err) => <div>There was an error fetching this entry. See error below<br/>{err.toString()}</div> }
        onRender={ (futureInt, result) => (
          <div>
            <EditorFields
              tasks={this.state.availableTasks}
              selectedTask={this.state.selectedTask}
            />
          </div>
        )} />
    );
  }

}

export const TimeEntry = (props) => {
  return (
    <div className="page entry">
      <BackendConsumer>
        { backend => <Editor backend={backend} {...props}/> }
      </BackendConsumer>
    </div>
  );
}

export default TimeEntry;
