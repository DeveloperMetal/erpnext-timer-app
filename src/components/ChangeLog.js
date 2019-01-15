// @flow

// Third party Components
import React from "react";
import { Button, Card } from "@blueprintjs/core";

export default class ChangeLog extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    const currentLog = this.props.changeLog[0];
    console.log(currentLog);

    return <div className="changelog">
      <Card elevation="3">
        <div className="message">{currentLog.message || ""}</div>
      </Card>
      { currentLog && (
        <Card elevation="3" className="items">
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
        <Button large text="Next" onClick={ this.props.onClose } rightIcon="arrow-right" />
      </div>
    </div>;
  }
}