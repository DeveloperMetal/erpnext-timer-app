// @flow

import * as DataTypes from "../connectors/Data.flow";
import * as Types from "./Types.flow";

export type SettingsProps = {
  backend: DataTypes.State,
  nav: (path : string) => void
}

export type SettingsState = {
}

export type SpecialKey = {
  id : string,
  label : Types.CrossPlatLabel,
  icon: Types.CrossPlatIcon
}

export type NormalKey = {
  id : string,
  label? : string,
  icon? : string
}