import React from 'react';
import { MenuItem, Button } from '@blueprintjs/core';
import { MultiSelect } from '@blueprintjs/select';


export default class ItemFilterDropdown extends React.Component {

  constructor(props) {
    super(props);
  
    this.renderers = {
      renderItem: this.renderItem.bind(this),
      renderTag: this.renderItem.bind(this)
    }

    this.handlers = {
      handleItemSelect: this.handleItemSelect.bind(this),
      handleTagRemove: this.handleTagRemove.bind(this),
      handleClear: this.handleClear.bind(this)
    }
  }

  renderTag(item) {
    throw "renderTag Not Implemened";
  }

  getItemKey(item) {
    return item.id;
  }

  getItemText(item) {
    return item.label;
  }

  setSelectedItem(item) {
    return Promise.reject("Not Implemented");
  }

  unsetSelectedItem(item) {
    return Promise.reject("Not Implemented");
  }

  clearSelectedItems() {
    return Promise.reject("Not Implemented");
  }

  getAllItems() {
    return [];
  }

  getSelectedItems() {
    return [];
  }

  getTagInputProps(totalSelectedItems) {
    const { handleTagRemove, handleClear } = this.handlers;
    const clearButtton = totalSelectedItems > 0?<Button icon="cross" minimal={true} onClick={handleClear} /> : null;

    return Object.assign({
      className: "ctrl-fill",
      onRemove: handleTagRemove,
      rightElement: clearButtton,
      fill: true
    }, this.props.tagInputProps || {});
  }

  getPopoverProps() {
    return Object.assign({
      usePortal: true,
      className: "popover-wrapper-fill"
    }, this.props.popoverProps || {});
  }

  renderItem( item, { modifiers, handleClick } ) {
    const { backend } = this.props;
    const { isItemSelected } = backend.actions;

    if ( !modifiers.matchesPredicate) {
      return null;
    }
  
    return (
      <MenuItem
        active={modifiers.active}
        icon={ this.isItemSelected(item) ? 'tick' : 'blank' }
        key={this.getItemKey(item)}
        onClick={handleClick}
        text={this.getItemText(item)}
        shouldDismissPopover={false}
      />
    )
  }

  handleItemSelect(item) {
    if ( !this.isItemSelected(item)) {
      this.setSelectedItem(item)
        .then(this.props.onChange);
    } else {
      this.unsetSelectedItem(item)
        .then(this.props.onChange);
    }
  }

  handleTagRemove(tag, index) {
    const selectedItems = this.getSelectedItems();
    const item = selectedItems[index];

    this.unsetSelectedItem(item)
      .then(this.props.onChange)
  }

  handleClear() {
    this.clearSelectedItems()
      .then(this.props.onChange);
  }

  render() {
    const { handleItemSelect } = this.handlers;
    const { renderTag, renderItem } = this.renderers;
    const selectedItems = this.getSelectedItems();

    return (
      <MultiSelect 
        itemRenderer = {renderItem}
        className="ctrl-field ctrl-flex-auto"
        noResults = {<MenuItem disabled={true} text="No results." />}
        onItemSelect = {handleItemSelect}
        tagRenderer = {renderTag}
        placeholder = {this.getPlaceholderText()}
        tagInputProps = {this.getTagInputProps(selectedItems.length)}
        popoverProps = {this.getPopoverProps()}
        selectedItems = {selectedItems}
        items = {this.getAllItems()}
      />
    );

  }
}