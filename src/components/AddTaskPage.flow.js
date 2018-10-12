// @flow

import * as DataTypes from "../connectors/Data.flow";

export type Props = {
  backend : DataTypes.State,
  nav : ( path : string ) => void
}

export type State = {
  project: DataTypes.Project | void,
  title: "",
  description: "",
  requireProject: string | null,
  requireTitle: string | null,
  requireDescription: string | null
}