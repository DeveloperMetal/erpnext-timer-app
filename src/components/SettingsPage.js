// @flow

// Third party components
import React from "react";
import { ButtonGroup, Button, Popover, Menu, MenuItem, Intent } from "@blueprintjs/core";
import moment from "moment"

// Components
import { BackendConsumer } from "../connectors/Data";

// flow types
import * as DataTypes from "../connectors/Data.flow";
import type Moment from "moment";
import type { SettingsProps, SettingsState } from "./SettingsPage.flow";

export class Settings extends React.PureComponent<SettingsProps, SettingsState> {
  constructor(props : SettingsProps) {
    super(props);

    this.state = {

    }
  }

  render() {
    return <div className="page settings">
      <div className="page-title">Settings</div>
    </div>
  }
}


export function SettingsPage(props: DataTypes.PageProps) {
  return <BackendConsumer>
    {backend => <Settings backend={backend} {...props} />}
  </BackendConsumer>
}

export default SettingsPage;