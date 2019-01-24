// @flow

// thirdparty components
import React from "react";
import moment from "moment";
import { FormGroup, InputGroup, TextArea, Button, Intent } from "@blueprintjs/core";


// components
import { BackendConsumer } from "../connectors/Data";
import { ProjectSelect } from "./ProjectSelect";

// types
import type { Props, State } from "./AddTaskPage.flow";
import * as DataTypes from "../connectors/Data.flow";
import type Moment from "moment";


class AddTaskForm extends React.PureComponent<Props, State> {
  refs : any;
  titleRef : HTMLInputElement | void;
  descriptionRef : HTMLInputElement | void;
  projectComp : any | void;

  constructor(props : Props) {
    super(props);

    this.state = {
      project: undefined,
      title: "",
      description: "",
      requireProject: null,
      requireTitle: null,
      requireDescription: null
    }

    this.titleRef = undefined;
    this.descriptionRef = undefined;
    this.projectComp = undefined;
  }

  onSave() {
    const { backend } = this.props;
    const requireProject = this.projectComp && this.require(this.projectComp.value());
    const requireTitle = this.titleRef && this.require(this.titleRef.value);
    const requireDescription = this.descriptionRef && this.require(this.descriptionRef.value);

    if ( !requireProject && !requireTitle && !requireDescription ) {
      backend.actions.newTask({
        label: this.titleRef && this.titleRef.value,
        description: this.descriptionRef && this.descriptionRef.value,
        project_id: this.projectComp && this.projectComp.value().id
      })
      .then(() => {
        this.props.nav("timesheet/tasks")
      });
    } else {
      this.setState({
        requireProject,
        requireTitle,
        requireDescription
      })
    }
  }

  require(value) {
    if ( value ) {
      return null;
    } else {
      return Intent.DANGER;
    }
  }

  render() {
    const { backend } = this.props;
    const onSave = () => this.onSave()

    return <div className="page new-task">
      <div className="page-title">New Task</div>
      <div className="page-content padded">
        <FormGroup
          label="Project"
          labelFor="task-project"
          labelInfo="(required)"
        >
          <ProjectSelect 
            intent={this.state.requireProject}
            compRef={(ref) => this.projectComp = ref}
            projects={backend.projects} 
            value={this.state.project} />
        </FormGroup>
        <FormGroup
          label="Task Name"
          labelFor="task-name"
          labelInfo="(required)"
        >
          <InputGroup 
            large fill 
            intent={this.state.requireTitle}
            id="task-name" 
            placeholder="Untitled Task" 
            inputRef={(ref) => this.titleRef = ref} />
        </FormGroup>

        <FormGroup
          label="Description"
          labelFor="task-description"
          labelInfo="(required)"
        >
          <TextArea 
            large fill 
            intent={this.state.requireDescription}
            id="task-description" 
            inputRef={(ref) => this.descriptionRef = ref} />
        </FormGroup>
      </div>

      <div className="page-actions">
        <Button text="Save" large intent={Intent.PRIMARY} onClick={onSave} />
        <Button text="Cancel" large onClick={() => this.props.nav("timesheet/tasks")}/>
      </div>
    </div>
  }
}

export function AddTaskPage(props : DataTypes.PageProps) {
  return <BackendConsumer>
    {backend => <AddTaskForm backend={backend} {...props} />}
  </BackendConsumer>
}

export default AddTaskPage;