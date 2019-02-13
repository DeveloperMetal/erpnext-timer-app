
import React from 'react';
import { Dialog, Position, Button, Classes } from '@blueprintjs/core';

import moment from 'moment';
import momentDurationFormatSetup from "moment-duration-format";
momentDurationFormatSetup(moment);

import { mainProcessAPI } from '../utils';

export default class IdleMessage extends React.Component<{}, { isOpen: boolean}> {

  constructor(props) {
    super(props);

    this.state = {
      isOpen: false,
      idleStartTS: 0,
      diff: "X"
    }
    this._willUnmount = false;
  }

  initTimer() {
    this.timerID = setInterval(() => {
      if ( this._willUnmount ) {
        return
      }

      const { idleMaxTS, idleStartTS, activeTaskID } = this.props.backend;
      const now = moment().utc();
      if ( !!activeTaskID && !!idleMaxTS && !!idleStartTS && this.state.isOpen === false) {
        const isOpen = now.diff(idleMaxTS) > 0;

        if ( isOpen ) {
          this.setState({
            isOpen,
            idleStartTS
          });

          mainProcessAPI('showApp');
          new Notification('Timer App', { 
            body: 'Your computer has been idle for longer than 10 minutes with a timer running',

          });
        }
      } if ( this.state.isOpen && !!activeTaskID ) {
        const diff = moment.duration(Math.abs(now.diff(this.state.idleStartTS))).humanize();
        this.setState({
          diff
        });
      }
    }, 1000);
  }

  stopTimer() {
    if ( !!this.timerID ) {
      clearInterval(this.timerID);
      this.timerID = false;
    }
  }

  componentDidMount() {
    this.initTimer();
    this._willUnmount = false;
  }

  componentWillUnmount() {
    this._willUnmount = true;
    this.stopTimer();
  }

  handleReset() {
    this.setState({
      isOpen: false
    })
  }

  handleResetAndStop() {
    const now = moment().utc();
    this.props.backend.actions.stopActiveTask(true, moment.duration(Math.abs(now.diff(this.state.idleStartTS))))
      .then(() => {
        this.setState({
          isOpen: false
        });
      });
  }

  render() {
    const dialogProps = {
      autoFocus: true,
      canEscapeKeyClose: false,
      canOutsideClickClose: false,
      enforceFocus: true,
      isOpen: this.state.isOpen,
      isClosebuttonShown: false,
      lazy: true,
      useProtal: true
    }

    return (
      <Dialog
        {...dialogProps}
        icon="info-sign"
        onClose={this.props.onReset}
        title="Idle Warning"
      >
        <div className={Classes.DIALOG_BODY}>
          <p>
            You have been idle for {this.state.diff}. Are you still working on a tasks?
          </p>
          <div className="actions">
            <Button text="Continue Timing" onClick={() => this.handleReset()}/>
            <Button text="Stop Timer" onClick={() => this.handleResetAndStop()}/>
          </div>
        </div>
      </Dialog>
    )
  }

}