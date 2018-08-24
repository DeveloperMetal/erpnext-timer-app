import React from 'react'
import { Button, Spinner, FormGroup, InputGroup, Intent, Tooltip } from "@blueprintjs/core";
import { Select } from '@blueprintjs/select';
import { Future } from './Future';
import { ERPNextConsumer } from './ErpNext';

const TaskPredicate = () => {
  (query, item) => {
    // don't filter out actions from list
    if (item.hasOwnProperty('_action')) {
      return true;
    }

    let parts = Object.values(item)
      .filter(i => i != null)
      .map(i => i.toString().toLowerCase())
      .join('.');
    return parts
      .indexOf(query.toLowerCase()) >= 0;
  }
}

const SelectItemRendererFactory = (icon, ) => {
  return (item, { handleClick, modifiers }) => {
    if (!modifiers.matchesPredicate) {
      return null;
    }
    return (
      <MenuItem
        active={modifiers.active}
        disabled={modifiers.disabled}
        key={item}
        text={item}
        onClick={handleClick}
      />
    );
  };
};

class Editor extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      name: null,
      project: {
        project_name: "Undefined"
      },
      task: {
        task_name: "Undefined"
      }
    }
  }

  onProjectChange(item) {

  }

  updateProjects() {
    console.log("update projects...");
    return Promise.all([
      this.props.backend.getProjects(),
      this.props.backend.getTasks()
    ]).then(results => {
    

      this.projects = projects.
      console.log("Got projects...");
      console.log(results);
    });
  }

  render() {

    return (
      <Future
        interface={ 
          (futureInt) => this.setState(
              { futureInt }, 
              () => futureInt.waitPromise(this.updateProjects())
            )
          }
        onWait={ (futureInt) => <Spinner /> }
        onFail={ (futureInt, err) => <div>Error...</div> }
        onRender={ (futureInt, result) => (
          <div> Editor Here </div>
        )} />
    );
  }

}

export default class TimeEntry extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = {
    }

  }

  render() {
    console.log("EditEntry", this.props);

    let entryName = null;

    return (
      <div className="page entry">
        <ERPNextConsumer>
          { backend => <Editor backend={backend}/> }
        </ERPNextConsumer>
      </div>
    );
  }
}

