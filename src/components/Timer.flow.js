// @flow

import type Moment from "moment";

export type Props = {
    time: Moment,
    started: boolean,
    format?: string
}

export type State = {
    time: Moment,
    timerId: IntervalID | void
}