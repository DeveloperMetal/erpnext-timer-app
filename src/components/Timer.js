// @flow 

import React from "react";
import moment from "moment";

// flow types
import type { Props, State } from "./Timer.flow";

export class Timer extends React.PureComponent<Props, State> {
  constructor(props : Props) {
    super(props);

    this.state = {
      time: this.props.time,
      timerId: undefined
    }
  }

  start() {
    this.setState({
      timerId: setInterval(() => {
        this.setState({
          time: moment()
        })
      }, 1000)
    });
  }

  stop() {
    if ( this.state.timerId ) {
      clearInterval(this.state.timerId);
      this.setState({
        timerId: undefined
      });
    }
  }

  componentDidMount() {
    if ( this.props.started ) {
        this.start();
    }
  }

  componentWillUnmount() {
    this.stop();
  }

  componentDidUpdate() {
    if ( this.props.started && !this.state.timerId ) {
      this.start();
    } else if ( !this.props.started && this.state.timerId ) {
      this.stop();
    }
  }

  render() {
    const { format = this.state.timerId?"h:mm:ss a":"h:mm a" } = this.props;
    return <React.Fragment>{this.state.time.format(format)}</React.Fragment>
  }
}