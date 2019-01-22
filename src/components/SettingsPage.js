// @flow

// Third party components
import React from "react";
import {
  SPECIALKEYS, 
  KEYS, 
  findSpecialKey, 
  GetSpecialKeyIcon, 
  GetSpecialKeyLabel 
} from "./SpecialKeys";

import { ButtonGroup, Button, Popover, Menu, MenuItem, Intent } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";

import moment from "moment"

// Components
import { BackendConsumer } from "../connectors/Data";

// flow types
import type { ItemRenderer, ItemPredicate } from "@blueprintjs/core";
import type { Node } from "react";
import * as DataTypes from "../connectors/Data.flow";
import type Moment from "moment";
import type { 
  SettingsProps, 
  SettingsState, 
  SpecialKey,
  NormalKey
} from "./SettingsPage.flow";

const RenderSpecialKey = (key) => {
  let label = GetSpecialKeyLabel(key);
  let icon = GetSpecialKeyIcon(key);

  return <span className="key special">
    <span className="icon">{icon}</span>
    <span className="label">{label}</span>
  </span>;
}

const SpecialKeyPredicate = (query, key) => {
  return `${key.id}.${GetSpecialKeyLabel(key)}`.replace("+", ".").toLowerCase().indexOf(query.toLowerCase()) >= 0;
};

const SpecialKeysRenderer = (key, { handleClick, modifiers }) : ItemRenderer => {
  if ( !modifiers.matchesPredicate ) {
    return null;
  }

  let content = "";

  // check for combo keys
  if ( key.id.indexOf("+") > -1 ) {
    content = key.id.split("+").reduce((result, key, i) => {
      if ( i > 0 ) {
        result.push(<span> + </span>);
      }
      result.push(RenderSpecialKey(findSpecialKey(key)));
      return result;
    }, []);
  } else {
    content = [RenderSpecialKey(key)];
  }

  return <MenuItem
    active={modifiers.active}
    key={key.id}
    onClick={handleClick}
    text={content}
  />
}

export class Settings extends React.PureComponent<SettingsProps, SettingsState> {
  constructor(props : SettingsProps) {
    super(props);

    this.state = {
      modifier: null
    }
  }

  onModifiersSelected(key) {
    console.log(key);
    this.setState({
      modifier: key.id
    })
  }

  render() {
    const { modifier } = this.state;
    const specialKeyItems = SPECIALKEYS.filter((key) => key.platforms?process.platform in key.platforms:true);
    const onModifiersSelected = (key) => this.onModifiersSelected(key);
    const selectedModifier = modifier?RenderSpecialKey(findSpecialKey(modifier)):"Select a modifier";

    return <div className="page settings">
      <div className="page-title">Settings</div>
      Shortcuts:
      <div className="row">
        <div className="col-3-sm">
          Global Toggle: 
        </div>
        <div className="col-9-sm">
          <Select
            items={specialKeyItems}
            noResults={<MenuItem disabled={true} text="Select a modifier"/>}
            itemRenderer={SpecialKeysRenderer}
            itemPredicate={SpecialKeyPredicate}
            onItemSelect={onModifiersSelected}>
            <Button text={selectedModifier} rightIcon="double-caret-vertical" />
          </Select>
        </div>
      </div>
    </div>
  }
}


export function SettingsPage(props: DataTypes.PageProps) {
  return <BackendConsumer>
    {backend => <Settings backend={backend} {...props} />}
  </BackendConsumer>
}

export default SettingsPage;