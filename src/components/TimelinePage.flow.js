// @flow

import * as DataTypes from "../connectors/Data.flow";

export type TimelineCompProps = {
  backend: DataTypes.State,
  nav: (path : string) => void
}

export type TimelineCompState = {
  zoom: number
}