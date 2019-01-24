// @flow

// Third party components
import React from "react";
import {
  SPECIALKEYS, 
  KEYS, 
  findSpecialKey, 
  findKey,
  GetSpecialKeyIcon, 
  GetSpecialKeyLabel 
} from "./SpecialKeys";

import { ButtonGroup, Button, ControlGroup, FormGroup, MenuItem, Tooltip, Icon, Intent, Position, Alignment } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import classNames from "classnames";
import moment from "moment"
import { mainProcessAPI } from "../utils";

// Components
import { BackendConsumer, ConnectorError } from "../connectors/Data";

// flow types
import type { ItemRenderer, ItemPredicate } from "@blueprintjs/core";
import type { Node } from "react";
import * as DataTypes from "../connectors/Data.flow";
import type Moment from "moment";
import type { 
  SettingsProps, 
  SettingsState, 
  SpecialKey
} from "./SettingsPage.flow";

const RenderSpecialKey = (key : SpecialKey, keyPrefix? : string) => {
  const label : string = GetSpecialKeyLabel(key);
  const icon : any = GetSpecialKeyIcon(key);

  return <span className="key special" key={`key-${keyPrefix?keyPrefix:""}${key.id}`}>
    <span className="icon">{icon}</span>
    <span className="label">{label}</span>
  </span>;
}

const SpecialKeyPredicate = (query, key) => {
  return `${key.id}.${GetSpecialKeyLabel(key)}`.replace("+", ".").toLowerCase().indexOf(query.toLowerCase()) >= 0;
};

const ShortcutKeys = (key : SpecialKey | void | null, special? : boolean) => {
  if ( !key ) {
    return <span>Error Rendering Missing Key!</span>;
  }

  if ( typeof key !== undefined && key != null ) {
    let content = [];
    let keyid = key.id;
    // check for combo keys
    if ( key.id.indexOf("+") > -1 ) {
      content = keyid.split("+").reduce((result, k, i) => {
        if ( i > 0 ) {
          result.push(<span key={`plus-${i}`} className="plus"> + </span>);
        }
        let sk = findSpecialKey(k);
        if ( sk ) {
          result.push(RenderSpecialKey(sk, keyid));
        }
        return result;
      }, []);
    } else {
      content = [RenderSpecialKey(key, keyid)];
    }

    return <div key={`key-group-${key.id}`} className={classNames("key-group", { special })}>{content}</div>;
  }

  return [];
}

const SpecialKeysRenderer = (key : SpecialKey, { handleClick, modifiers }) : ItemRenderer => {
  if ( !modifiers.matchesPredicate ) {
    return null;
  }

  return <MenuItem
    active={modifiers.active}
    key={key.id}
    onClick={handleClick}
    text={ShortcutKeys(key)}
  />
}

export class Settings extends React.PureComponent<SettingsProps, SettingsState> {
  constructor(props : SettingsProps) {
    super(props);

    this.state = {
      visibleToggleShortcutModifier: null,
      visibleToggleShortcutKey: null,
      validVisibilityShortcut: null,
      validVisibilityShortcutTooltip: "",
      onTimerStartGoto: ""
    }
  }

  componentDidMount() : void {
    mainProcessAPI("getUserSettings", [
      "visibleToggleShortcutModifier", 
      "visibleToggleShortcutKey",
      "onTimerStartGoto"
    ])
    .then((result) => {
      this.setState({
        ...result
      });
    });
  }

  handleRegisterVisibleToggleShortcutSet() : Promise<any> {
    return mainProcessAPI(
      "registerVisibleToggleShortcut", 
      this.state.visibleToggleShortcutModifier,
      this.state.visibleToggleShortcutKey
    )
    .then((result) => {
      if ( !result ) {
        this.props.backend.actions.throwError(new ConnectorError("Unable to set shortcut"));
      } else {
        this.props.backend.actions.userMessage({
          message: "Global shortcut set!",
          intent: Intent.SUCCESS,
          icon: "tick-circle",
          timeout: 2000
        })
      }

      this.setState({
        validVisibilityShortcut: result,
        validVisibilityShortcutTooltip: result?"Shortcut Set":"Unable to set shortcut"
      })
    })
    .catch((err) => {
      this.props.backend.actions.throwError(new ConnectorError(err));
      console.error(err);
      this.setState({
        validVisibilityShortcut: false,
        validVisibilityShortcutTooltip: err
      })
    })
  }

  onVisibleToggleShortcutModifierSelected(key : SpecialKey) : void {
    if ( key ) {
      this.setState({
        visibleToggleShortcutModifier: key.id
      }, () => {
        this.handleRegisterVisibleToggleShortcutSet();
      })
    }
  }

  onVisibleToggleShortcutKeySelected(key : SpecialKey) : void {
    if ( key ) {
      this.setState({
        visibleToggleShortcutKey: key.id
      }, () => {
        this.handleRegisterVisibleToggleShortcutSet();
      });
    }
  }

  handleQuit() : void {
    mainProcessAPI("quit");
  }

  handleLogout() : void {
    mainProcessAPI("logout");
  }

  handleOnTimerStartGoto(where : string) : void {
    mainProcessAPI("setUserSettings", { "onTimerStartGoto": where})
    .then((result) => {
      console.log(result);
      this.setState({
        onTimerStartGoto: where
      });
    })
    .catch((err) => {
      console.log(err);
    })
  }

  render() : Node {
    const handleQuit = () => this.handleQuit();
    const handleLogout = () => this.handleLogout();
    const handleOnTimerStartGotoTimesheet = () => this.handleOnTimerStartGoto('timesheet');
    const handleOnTimerStartGotoTasks = () => this.handleOnTimerStartGoto('tasks');
    const { 
      visibleToggleShortcutModifier,
      visibleToggleShortcutKey,
      validVisibilityShortcut,
      validVisibilityShortcutTooltip
     } = this.state;
    const commonPopoverProps = {
      portalClassName: "bp3-dark ctrl-popover",
      className: "ctrl-flex ctrl-flex-row",
      targetClassName: "ctrl-flex-auto",
      lazy: true,
      usePortal: true
    };

    const specialKeyItems = SPECIALKEYS.filter(
      (key) => key.platforms?key.platforms.indexOf(process.platform) > -1:true
    );
    const normalKeyItems = KEYS.slice(0);

    const onVisibleToggleShortcutModifierSelected = (key) => this.onVisibleToggleShortcutModifierSelected(key);
    const onVisibleToggleShortcutKeySelected = (key) => this.onVisibleToggleShortcutKeySelected(key);
    
    const visibleToggleShortcutModifierSelected = visibleToggleShortcutModifier?ShortcutKeys(findSpecialKey(visibleToggleShortcutModifier), true):"Select a modifier";
    const visibleToggleShortcutKeySelected = visibleToggleShortcutKey?ShortcutKeys(findKey(visibleToggleShortcutKey), false):"Select a key";

    return <div className="page settings">
      <div className="page-title">Settings</div>
      <div className="page-content padded">
        <ControlGroup fill>
          <Button fill icon="power" text="Quit App" intent={Intent.DANGER} onClick={handleQuit} />
          <Button fill icon="log-out" text="Log Out" onClick={handleLogout} />
        </ControlGroup>
        <FormGroup
            className="ctrl-field"
            label="Global Toggle"
            labelFor="global-shortcut-toggle"
            labelInfo="(required)"
            fill
          >
            <ControlGroup 
              fill
              className="ctrl-flex-center-items"
            >
              <Select
                popoverProps={commonPopoverProps}
                items={specialKeyItems}
                noResults={<MenuItem disabled={true} text="Select a modifier"/>}
                itemRenderer={SpecialKeysRenderer}
                itemPredicate={SpecialKeyPredicate}
                onItemSelect={onVisibleToggleShortcutModifierSelected}>
                <Button fill alignText={Alignment.LEFT} text={visibleToggleShortcutModifierSelected} rightIcon="double-caret-vertical" />
              </Select>
              <div className="bp3-fixed"><div className="ctrl-std">+</div></div>
              <Select
                popoverProps={commonPopoverProps}
                items={normalKeyItems}
                noResults={<MenuItem disabled={true} text="Select a key"/>}
                itemRenderer={SpecialKeysRenderer}
                itemPredicate={SpecialKeyPredicate}
                onItemSelect={onVisibleToggleShortcutKeySelected}>
                <Button fill alignText={Alignment.LEFT}  text={visibleToggleShortcutKeySelected} rightIcon="double-caret-vertical" />
              </Select>
              { validVisibilityShortcut != null && (
                <Tooltip 
                  className="bp3-fixed"
                  disabled={!validVisibilityShortcutTooltip} 
                  content={validVisibilityShortcutTooltip} 
                  position={Position.LEFT}
                  intent={validVisibilityShortcut?Intent.SUCCESS:Intent.DANGER}
                >
                  <Icon
                    className="ctrl-std"
                    icon={validVisibilityShortcut?"tick-circle":"error"}
                    intent={validVisibilityShortcut?Intent.SUCCESS:Intent.DANGER}
                  />
                </Tooltip>
              )}
            </ControlGroup>
          </FormGroup>
          <FormGroup
            className="ctrl-field"
            label="When timer starts display"
            labelFor="when-timer-starts-display"
            fill
          >
            <ButtonGroup fill>
              <Button 
                fill
                text="Go to timesheet" 
                onClick={handleOnTimerStartGotoTimesheet}
                active={this.state.onTimerStartGoto === 'timesheet'} />
              <Button 
                fill
                text="Stay in tasks" 
                onClick={handleOnTimerStartGotoTasks}
                active={this.state.onTimerStartGoto === 'tasks'} />
            </ButtonGroup>
          </FormGroup>
      </div>
    </div>
  }
}


export function SettingsPage(props: DataTypes.PageProps) : Node{
  return <BackendConsumer>
    {backend => <Settings backend={backend} {...props} />}
  </BackendConsumer>
}

export default SettingsPage;