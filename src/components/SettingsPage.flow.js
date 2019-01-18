// @flow

import * as DataTypes from "../connectors/Data.flow";

export type SettingsProps = {
  backend: DataTypes.State,
  nav: (path : string) => void
}

export type SettingsState = {
}