import React from 'react'
import { Button, Spinner, FormGroup, InputGroup, Intent, Tooltip, MenuItem } from "@blueprintjs/core";
import { Select } from '@blueprintjs/select';

export class FieldSelect extends React.PureComponent {

  render() {
    const { noResults=<MenuItem disabled text="No results." /> } = this.props;

    return <Field
      {...this.props}
      id={`${this.props.id}-field-group`}
    >
      <Select
        id={this.props.id}
        items={this.props.items}
        itemPredicate={this.props.itemPredicate}
        itemRenderer={this.props.itemRenderer}
        noResults={noResults}
        onItemSelect={this.props.onItemSelect}
        popoverProps={{
          className: this.props.fill?"popover-wrapper-fill": null,
          modifiers: {
            arrow: { enabled: true },
            flip: { enabled: true },
            keepTogether: { enabled: true },
            preventOverflow: { enabled: true, boundariesElement: "window" },
          },
          usePortal: true
        }}
      >
        {this.props.children}
      </Select>
    </Field>
  }
}

export class Field extends React.PureComponent {
  render() {
    return <FormGroup
      label={this.props.label}
      labelFor={this.props.id}
    >
      {this.props.children}
    </FormGroup>
  }
}