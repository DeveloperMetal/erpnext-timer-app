// @flow

import * as DataTypes from "../connectors/Data.flow";

export type CallbackOnLoggedIn = (auth : DataTypes.Auth, options? : DataTypes.LoginOptions) => void
