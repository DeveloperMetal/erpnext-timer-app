// @flow

// Thirdparty components
import React from "react";
import { Button, MenuItem, Intent, Alignment } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";

// types
import type { Props, State } from "./ProjectSelect.flow";
import * as DataTypes from "../connectors/Data.flow";
import type { ItemPredicate, ItemRenderer } from "@blueprintjs/select";

function ProjectRenderer(project : DataTypes.Project, { handleClick, modifiers }) {
  if (!modifiers.matchesPredicate) {
    return null;
  }

  return <MenuItem 
    key={project.id}
    onClick={handleClick}
    text={project.label}
  />
}

function ProjectPredicate(query, project) {
  return project.label.toLowerCase().indexOf(query.toLowerCase()) >= 0;
}

export class ProjectSelect extends React.PureComponent<Props, State> {
  constructor(props : Props) {
    super(props);
    
    this.state = {
      selected: props.value
    }
  }

  value() {
    return this.state.selected;
  }

  componentDidMount() {
    if ( this.props.compRef ) {
      this.props.compRef(this);
    }
  }

  render() {

    const selectedLabel = this.state.selected?this.state.selected.label:"- Select Project -";
    const onItemSelect = (project) => {
      this.setState({ selected: project }, () => {
        if ( this.props.onChange ) {
          this.props.onChange(project);
        }
      })
    }

    return <Select
      fill
      className="flex-fill"
      items={this.props.projects}
      itemRenderer={ProjectRenderer}
      itemPredicate={ProjectPredicate}
      noResults={<MenuItem disabled text="No results." />}
      onItemSelect={onItemSelect}
      >
        <Button 
          large 
          fill
          intent={this.props.intent}
          rightIcon="double-caret-vertical"
          text={selectedLabel} 
          alignText={Alignment.LEFT}
        />
      </Select>
  }
}

export default ProjectSelect;