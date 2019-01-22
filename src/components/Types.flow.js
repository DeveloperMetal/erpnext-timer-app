// @flow

import * as DataTypes from "../connectors/Data.flow";
import type { Node } from "react";

export type CallbackOnLoggedIn = (auth : DataTypes.Auth, options : DataTypes.LoginOptions | null) => void

export type CrossPlatLabel = {
    darwin? : String,
    windows? : String,
    default? : String
  };
  
export type CrossPlatIcon = {
    darwin? : Node,
    windows? : Node,
    default? : Node
};