// @flow

import * as DataTypes from "../connectors/Data.flow";

export type Props = {
  projects : DataTypes.Project[],
  onChange? : ( item : DataTypes.Project ) => void,
  value? : DataTypes.Project,
  intent? : string | null,
  compRef? : (component : any) => void
}

export type State = {
  selected? : DataTypes.Project
}