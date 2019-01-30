// @flow
import { remote } from "electron";

// Third party Components
import React from "react";
import { Button, Card, Callout, Intent } from "@blueprintjs/core";
import moment from "moment";

const version = remote.app.getVersion();

const LogEntry = ({log}) => {
  return <React.Fragment>
    <Callout 
      intent={ Intent.SUCCESS }
      icon="updated"
      title={moment(log.date).format("Y-MM-DD") + " | v" + log.version}
      >
      <div className="message">{log.message || ""}</div>
    </Callout>
    { log && (
      <Card elevation="0">
        <ul>
        { (log.added || []).map((item, key) => (
          <li key={ `added-${key}`} className="added">{ item }</li>
        ))}
        { (log.changed || []).map((item, key) => (
          <li key={ `changed-${key}`} className="changed">{ item }</li>
        ))}
        { (log.removed || []).map((item, key) => (
          <li key={ `removed-${key}`} className="removed">{ item }</li>
        ))}
        </ul>
      </Card>
    )}
  </React.Fragment>
}

export default class ChangeLog extends React.PureComponent<any, any> {

  render() {
    let logs = [];
    console.log(this.props.changeLog);
    if ( this.props.changeLog ) {
      // find last change log index
      let lastLogIndex = this.props.changeLog.findIndex((item) => item.version === this.props.lastChangeLogVersion);
      console.log(lastLogIndex);
      if ( lastLogIndex >= 0 ) {
        logs = this.props.changeLog.slice(0, lastLogIndex);
      } else {
        logs = [ this.props.changeLog[0] ];
      }
    }

    console.log(logs);

    return <div className="changelog">
      <div className="header">
        <div className="version">v{ version }</div>
      </div>
      <div className="items">
        { logs.map((log) => <LogEntry key={`log-${log.version}`} log={log} />) }
      </div>
      <div className="actions">
        <Button large intent={ Intent.PRIMARY } text="Next" onClick={ this.props.onClose } rightIcon="arrow-right" />
      </div>
    </div>;
  }
}