import React from 'react'
import { Button, Spinner, FormGroup, InputGroup, Intent, Tooltip } from "@blueprintjs/core";
import { Select } from '@blueprintjs/select';

export class FieldSelect extends React.PureComponent {
  render() {
    return <Field
      label={this.props.label}
      id={this.props.id}
      fill
    >
      <Select
        fill
        id={this.props.id}
        items={this.props.items}
        itemPredicate={this.props.itemPredicate}
        itemRenderer={this.props.itemRenderer}
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