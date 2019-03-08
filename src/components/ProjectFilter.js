import React from 'react';
import { BackendConsumer } from '../connectors/Data';
import { MenuItem, Button } from '@blueprintjs/core';
import MultiSelectDropdown from './MultiSelectDropdown';
import { MultiSelect } from '@blueprintjs/select';

class ProjectFilterDropdownOld extends React.Component {

  constructor(props) {
    super(props);
  
    this.renderers = {
      projectItemRenderer: this.projectItemRenderer.bind(this),
      tagRenderer: this.TagRenderer.bind(this)
    }

    this.handlers = {
      onProjectSelect: this.handleProjectSelect.bind(this),
      onTagRemove: this.handleTagRemove.bind(this),
      onHandleClear: this.handleClear.bind(this)
    }
  }

  TagRenderer(project) {
    return project.label;
  }

  projectItemRenderer( project, { modifiers, handleClick } ) {
    const { backend } = this.props;
    const { isProjectSelected } = backend.actions;

    if ( !modifiers.matchesPredicate) {
      return null;
    }
  
    return (
      <MenuItem
        active={modifiers.active}
        icon={ isProjectSelected(project.id) ? 'tick' : 'blank' }
        key={project.id}
        onClick={handleClick}
        text={project.label}
        shouldDismissPopover={false}
      />
    )
  }

  handleProjectSelect(project) {
    const { backend } = this.props;
    const { 
      setSelectedProject, 
      unsetSelectedProject, 
      isProjectSelected } = backend.actions;

    if ( !isProjectSelected(project.id)) {
      setSelectedProject(project.id)
        .then(this.props.onChange);
    } else {
      unsetSelectedProject(project.id)
        .then(this.props.onChange);
    }
  }

  handleTagRemove(tag, index) {
    const { backend } = this.props;
    const { unsetSelectedProject, getSelectedProjects } = backend.actions;
    const selectedProjects = getSelectedProjects();
    const project = selectedProjects[index];

    unsetSelectedProject(project.id)
      .then(this.props.onChange)
  }

  handleClear() {
    const { backend } = this.props;
    const { clearSelectedProjects } = backend.actions;

    clearSelectedProjects()
    .then(this.props.onChange);
  }

  render() {
    const { backend } = this.props;
    const { getSelectedProjects } = backend.actions;
    const { onTagRemove, onProjectSelect, onHandleClear } = this.handlers;
    const { tagRenderer, projectItemRenderer } = this.renderers;
    const selectedProjects = getSelectedProjects();

    const clearButtton = selectedProjects.length > 0?<Button icon="cross" minimal={true} onClick={onHandleClear} /> : null;

    return (
      <MultiSelect 
        itemRenderer = {projectItemRenderer}
        className="ctrl-field ctrl-flex-auto"
        noResults = {<MenuItem disabled={true} text="No results." />}
        onItemSelect = {onProjectSelect}
        tagRenderer = {tagRenderer}
        placeholder = "Filter by Project..."
        tagInputProps = {{
          className: "ctrl-fill",
          onRemove: onTagRemove,
          rightElement: clearButtton,
          fill: true,
          icon: "search"
        }}
        popoverProps = {{
          usePortal: true,
          className: "popover-wrapper-fill"
        }}
        selectedItems = {selectedProjects}
        items = {this.props.backend.projects}

      />
    );

  }
}

class ProjectFilterDropdown extends MultiSelectDropdown {

  itemPredicate(query, item) {
    return item.label.toLowerCase().indexOf(query.toLowerCase()) > -1;
  }
  
  renderTag(item) {
    return item.label;
  }

  getItemKey(item) {
    return item.id;
  }

  getItemText(item) {
    return item.label;
  }

  getPlaceholderText() {
    return "Filter by Project..."
  }

  async setSelectedItem(item) {
    const { backend } = this.props;
    const { setSelectedProject } = backend.actions;

    return setSelectedProject(item.id);
  }

  async unsetSelectedItem(item) {
    const { backend } = this.props;
    const { unsetSelectedProject } = backend.actions;

    return unsetSelectedProject(item.id);
  }

  async clearSelectedItems() {
    const { backend } = this.props;
    const { clearSelectedProjects } = backend.actions;
    return clearSelectedProjects();
  }

  getAllItems() {
    const { backend } = this.props;
    return backend.projects
  }

  getSelectedItems() {
    const { backend } = this.props;
    const { getSelectedProjects } = backend.actions;
    return getSelectedProjects();
  }


}

export default function ProjectFilter(props) {
  return (
    <BackendConsumer>
      { (backend) => (<ProjectFilterDropdown backend={backend} {...props} />) }
    </BackendConsumer>
  )
}