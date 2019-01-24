// @flow

import * as DataTypes from "../connectors/Data.flow";
import * as Types from "./Types.flow";
import type {Node} from 'react';

export type SettingsProps = {
  backend: DataTypes.State,
  nav: (path : string) => void
}

export type SettingsState = {
  visibleToggleShortcutModifier: string | null,
  visibleToggleShortcutKey: string | null,
  validVisibilityShortcut: string | boolean | null,
  validVisibilityShortcutTooltip: string,
  onTimerStartGoto: string
}

export type SpecialKey = {
  id : string,
  label? : Types.CrossPlatLabel | string | boolean,
  icon?: Types.CrossPlatIcon | Node | boolean,
  platforms?: Types.CrossPlatforms
}