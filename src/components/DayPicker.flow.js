// @flow

import type Moment from "moment";

export type Props = {
    date: Moment,
    onChange: (date : Moment) => void
}

export type State = {
    size: number
}

export type DayProps = {
  date : Moment,
  size : number,
  active : boolean,
  onClick : (date : Moment) => void
}

export type DateSelectProps = {
  onChange: (date : Date) => void,
  date: Moment
}

export type DateSelectState = {
  editing: boolean
}