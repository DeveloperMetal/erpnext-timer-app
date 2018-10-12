// @flow

// Thirdparty Components
import React from "react";
import { Button, Slider, ProgressBar, Icon, Intent, PanelStack } from "@blueprintjs/core";
import { DateInput, type IDateFormatProps } from "@blueprintjs/datetime";
import { withContentRect } from 'react-measure';
import moment from "moment";
import cls from "classnames";

// types
import type { Props, State, DayProps, DateSelectProps, DateSelectState } from "./DayPicker.flow";
import type Moment from "moment";

function getMomentFormatter(format : string) : IDateFormatProps {
    return {
        formatDate: (date, locale) => moment(date).format(format),
        parseDate: (str, locale) => moment(str, format).toDate(),
        placeholder: format,
    }
};

function Day(props : DayProps) {
  
  const { date, size, active, onClick } = props;

  let name : string = date.format('d'.repeat(size));
  if (size == 1) {
    name = date.format('dd').charAt(0);
  }

  return <div className="day">
    <div
      className={cls("day-btn", { active })}
      onClick={() => onClick(date)}
    >
      <div className="name">{name}</div>
      { size > 1 && (
        <div className="date">{date.format('D' + (size > 3 ? 'o' : ''))}</div>
      )}
    </div>
  </div>
};

class DateSelect extends React.PureComponent<DateSelectProps, DateSelectState> {

  constructor(props : DateSelectProps) {
    super(props);

    this.state = {
      editing: false
    }
  }

  onEdit() {
    this.setState({
      editing: true
    });
  }

  onDateChange(date : Date) {
    this.setState({
      editing: false
    }, () => {
      this.props.onChange(date)
    })
  }

  render() {
    const { date } = this.props;
    const onEdit = () => this.onEdit();
    const onDateChange = (date : Date) => this.onDateChange(date);
    const onInputBlur = (e) => {
      e.target.removeEventListener("blur", onInputBlur);
      this.setState({
        editing: false
      })
    }

    return <React.Fragment>
      { this.state.editing && (
        <DateInput 
          className="date-selector"
          fill
          {...getMomentFormatter("Y/M/D")} 
          onChange={onDateChange}
          value={ date.toDate() }
          showActionsBar
          closeOnSelection
          canClearSelection={false}
          inputProps={{
            inputRef: (ref) => {
              if ( ref ) {
                ref.focus();
                ref.addEventListener("blur", onInputBlur);
              }
            }
          }}
        />
      )}
      { !this.state.editing && (
        <Button
          minimal={true}
          text={date.format("MMMM") + ", Week " + (Math.ceil(date.date() / 7)) + date.format(", YYYY")}
          fill={true}
          onClick={onEdit}
        />
      )}
    </React.Fragment>
  }
}

const DayGroup = withContentRect('bounds')(({ 
    measureRef, 
    measure, 
    contentRect, 
    date, 
    size, 
    activeDay, 
    onDayPick 
  }) => {

  const onDateChange = ( date : Date ) => {
    onDayPick(moment(date));
  }

  let days : Moment[] = [];
  let weekStart : Moment = date.clone();
  for (var i = 0; i < 7; i++) {
    let day = weekStart.add(1, 'days');
    days.push((<Day
      key={day.format()}
      date={moment(day)}
      size={size}
      active={activeDay == i}
      onClick={(date) => onDayPick(date)}
    />));
  }

  return <div className="day-column" ref={measureRef}>
    <DateSelect onChange={onDateChange} date={date} />
    <div className="day-nav">
      <Button icon="caret-left" minimal={true} onClick={() => {
        onDayPick(date.clone().add(activeDay + 1, 'days').subtract(1, 'days'));
      }} />
      <div className="days">{days}</div>
      <Button icon="caret-right" minimal={true} onClick={() => {
        onDayPick(date.clone().add(activeDay + 1, 'days').add(1, 'days'));
      }} />
    </div>
  </div>
});

export class DayPicker extends React.PureComponent<Props, State> {
  constructor(props : Props) {
    super(props);

    this.state = {
      size: 5
    }
  }

  render() {

    const weekDate = this.props.date.clone().startOf('week').subtract(1, 'days');
    const activeDay = this.props.date.day();

    return <div className="daypicker">
      <DayGroup
        onDayPick={this.props.onChange}
        date={weekDate}
        activeDay={activeDay}
        size={this.state.size}
        bounds
        onResize={(contentRect) => {
          let size = 4;
          if (contentRect.bounds.width < 600) {
            size = 3;
          }
          if (contentRect.bounds.width < 500) {
            size = 2;
          }
          if (contentRect.bounds.width < 400) {
            size = 1;
          }
          this.setState({
            size
          });
        }}
      />

    </div>
  }
}

export default DayPicker;