// @flow

import * as DataTypes from "../connectors/Data.flow";
import * as Types from "./Types.flow";

export type Props = {
  backend : any,
  onLoggedIn : Types.CallbackOnLoggedIn
}
export type State = {
  auth : DataTypes.Auth,
  autoLogin : boolean,
  rememberLogin: boolean,
  loadingSettings: boolean,
  displayChangeLog : boolean,
  lastChangeLogVersion : string,
  changeLog : any
}
