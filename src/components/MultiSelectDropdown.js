import React from 'react';
import { MenuItem, Button } from '@blueprintjs/core';
import { MultiSelect } from '@blueprintjs/select';


export default class ItemFilterDropdown extends React.Component {

  constructor(props) {
    super(props);
  
    this.renderers = {
      renderItem: this.renderItem.bind(this),
      renderTag: this.renderTag.bind(this)
    }

    this.handlers = {
      handleItemPredicate: this.itemPredicate.bind(this),
      handleItemSelect: this.handleItemSelect.bind(this),
      handleTagRemove: this.handleTagRemove.bind(this),
      handleClear: this.handleClear.bind(this),
      handleIsItemSelected: this.isItemSelected.bind(this)
    }
  }

  renderTag(item) {
    throw "renderTag Not Implemened";
  }

  getItemKey(item) {
    throw "getItemKey Not Implemened";
  }

  getItemText(item) {
    throw "getItemText Not Implemened";
  }

  getPlaceholderText() {
    return "Search...";
  }

  itemPredicate(query, item) {
    return item.toLowerCase().indexOf(query.toLowerCase()) > -1;
  }

  isItemSelected(item) {
    return this.getSelectedItems().indexOf(item) > -1;
  }

  async setSelectedItem(item) {
    return Promise.reject("Not Implemented");
  }

  async unsetSelectedItem(item) {
    return Promise.reject("Not Implemented");
  }

  async clearSelectedItems() {
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
      className: "popover-wrapper-fill",
      portalProps: {
        className: "popover-md-height"
      }
    }, this.props.popoverProps || {});
  }

  renderItem( item, { modifiers, handleClick } ) {
    const { handleIsItemSelected } = this.handlers;

    if ( !modifiers.matchesPredicate) {
      return null;
    }
  
    return (
      <MenuItem
        active={modifiers.active}
        icon={ handleIsItemSelected(item) ? 'tick' : 'blank' }
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
    const { handleItemSelect, handleItemPredicate } = this.handlers;
    const { renderTag, renderItem } = this.renderers;
    const selectedItems = this.getSelectedItems();

    return (
      <MultiSelect 
        itemRenderer = {renderItem}
        className="ctrl-field ctrl-flex-auto"
        itemPredicate = { handleItemPredicate }
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