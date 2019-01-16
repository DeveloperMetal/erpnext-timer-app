// @flow
import { remote } from "electron";

// Third party Components
import React from "react";
import { Button, Card, Callout, Intent } from "@blueprintjs/core";
import moment from "moment";

const version = remote.app.getVersion();

export default class ChangeLog extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    const currentLog = this.props.changeLog[0];

    return <div className="changelog">
      <div className="header">
        <div className="version">v{ version }</div>
      </div>
      <Callout 
        intent={ Intent.SUCCESS }
        icon="updated"
        title={moment(currentLog.date).format("Y-MM-DD") + " | v" + version}
        >
        <div className="message">{currentLog.message || ""}</div>
      </Callout>
      { currentLog && (
        <Card elevation="0" className="items">
          <ul>
          { (currentLog.added || []).map((item, key) => (
            <li key={ `added-${key}`} className="added">{ item }</li>
          ))}
          { (currentLog.changed || []).map((item, key) => (
            <li key={ `changed-${key}`} className="changed">{ item }</li>
          ))}
          { (currentLog.removed || []).map((item, key) => (
            <li key={ `removed-${key}`} className="removed">{ item }</li>
          ))}
          </ul>
        </Card>
      )}
      <div className="actions">
        <Button large intent={ Intent.PRIMARY } text="Next" onClick={ this.props.onClose } rightIcon="arrow-right" />
      </div>
    </div>;
  }
}