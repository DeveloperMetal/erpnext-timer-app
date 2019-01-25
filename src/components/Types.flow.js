// @flow

import * as DataTypes from "../connectors/Data.flow";
import type { Node } from "react";

export type CallbackOnLoggedIn = (auth : DataTypes.Auth, options : DataTypes.LoginOptions | null) => void

export type CrossPlatLabel = {
    darwin? : string | boolean,
    windows? : string | boolean,
    default? : string | boolean
  };
  
export type CrossPlatIcon = {
    darwin? : Node | boolean,
    windows? : Node | boolean,
    default? : Node | boolean
};

export type CrossPlatforms = Array<string>;