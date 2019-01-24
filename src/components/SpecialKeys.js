// @flow

// Third party components
import React from "react";

import { Button, Menu, MenuItem, Intent, Icon } from "@blueprintjs/core";

import type { ItemRenderer, ItemPredicate } from "@blueprintjs/core";
import type { SpecialKey, NormalKey } from "./SettingsPage.flow";

export const PLATFORMS = {
  PC: ["win32", "linux"],
  Mac: ["darwin"]
}

export const SPECIALKEYS: Array<SpecialKey> = [
  {
    id: "Command",
    label: {
      default: "CMD"
    },
    icon: {
      default: <Icon icon="key-command" />
    },
    platforms: PLATFORMS.Mac
  }, {
    id: "Super",
    label: false,
    icon: {
      win32: <span>WIN</span>,
      default: <span>SUPER</span>
    },
    platforms: PLATFORMS.PC
  }, {
    id: "Control",
    label: {
      default: "CTRL"
    },
    icon: {
      default: <Icon icon="key-control" />
    }
  }, {
    id: "Alt",
    label: false,
    icon: {
      darwin: <Icon icon="key-option" />,
      default: <span>ALT</span>
    }
  }, {
    id: "AltGr",
    label: false,
    icon: {
      darwin: <Icon icon="key-option" />,
      default: <span>ALTGR</span>
    }
  }, {
    id: "Shift",
    label: {
      default: "Shift"
    },
    icon: {
      default: <Icon icon="key-shift" />
    }
  }, {
    id: "Control+Alt"
  }, {
    id: "Control+Shift"
  }, {
    id: "Alt+Shift"
  }, {
    id: "Command+Alt",
    platforms: PLATFORMS.Mac
  }, {
    id: "Command+Shift",
    platforms: PLATFORMS.Mac
  }, {
    id: "Command+Control",
    platforms: PLATFORMS.Mac
  }, {
    id: "Super+Alt",
    platforms: PLATFORMS.PC
  }, {
    id: "Super+Shift",
    platforms: PLATFORMS.PC
  }, {
    id: "Super+Control",
    platforms: PLATFORMS.PC
  }, {
    id: "Command+Control+Alt",
    platforms: PLATFORMS.Mac
  }, {
    id: "Command+Control+Shift",
    platforms: PLATFORMS.Mac
  }, {
    id: "Command+Alt+Shift",
    platforms: PLATFORMS.Mac
  }, {
    id: "Super+Control+Alt",
    platforms: PLATFORMS.PC
  }, {
    id: "Super+Control+Shift",
    platforms: PLATFORMS.PC
  }, {
    id: "Super+Alt+Shift",
    platforms: PLATFORMS.PC
  }
]

export function GenKeysFromCharCode(
  startCode: Number,
  endCode: Number
): Array<NormalKey> {

  let result: Array<NormalKey> = [];
  for (let c = startCode; c <= endCode; c++) {
    result.push({
      id: String.fromCharCode(c)
    });
  }

  return result;
}

export function GenKeys(
  start: Number,
  end: Number,
  idFn: (idx: Number) => string,
  iconFn: (key: string) => string
): Array<NormalKey> {

  let result: Array<NormalKey> = [];
  for (let i = start; i <= end; i++) {
    let id = idFn(i);
    let icon = null;
    if ( iconFn ) {
      icon = iconFn(id);
    }
    let kdef = { id };
    if ( icon ) {
      kdef.icon = { default: icon };
    }
    result.push(kdef);
  }

  return result
}

export const KEYS = GenKeysFromCharCode(48, 57) // 0 to 9
  .concat(GenKeysFromCharCode("A".charCodeAt(0), "Z".charCodeAt(0))) // A to Z
  .concat(GenKeys(1, 12, (idx) => `F${idx}`)) // F1 to F12
  .concat([
    {
      id: "space",
      label: "Space",
      icon: <span>&blank;</span>
    }, {
      id: "~"
    }, {
      id: "-"
    }, {
      id: "="
    }, {
      id: "["
    }, {
      id: "]"
    }, {
      id: "\\"
    }, {
      id: ","
    }, {
      id: "."
    }, {
      id: "/"
    }, {
      id: "Plus",
      icon: { default: <Icon icon="plus" /> }
    }, {
      id: "Tab",
      icon: { default: <Icon icon="key-tab" /> }
    }, {
      id: "VolumeUp",
      label: false,
      icon: { default: <Icon icon="volume-up" /> }
    }, {
      id: "VolumeDown",
      label: false,
      icon: { default: <Icon icon="volume-down" /> }
    }, {
      id: "VolumeMute",
      label: false,
      icon: { default: <Icon icon="volume-off" /> }
    }, {
      id: "PageUp",
      label: "PgUp",
      icon: { default: <Icon icon="double-chevron-up" /> }
    }, {
      id: "PageDown",
      label: "PgDn",
      icon: { default: <Icon icon="double-chevron-down" /> }
    }, {
      id: "Escape",
      label: "Esc",
      icon: { default: <Icon icon="key-escape" /> }
    }, {
      id: "Home"
    }, {
      id: "End"
    }, {
      id: "Return",
      icon: { default: <Icon icon="key-enter" /> }
    }, {
      id: "Insert",
      icon: { default: <Icon icon="insert" /> }
    }, {
      id: "Delete",
      icon: { default: <Icon icon="key-delete" /> }
    }, {
      id: "Backspace",
      icon: { default: <Icon icon="key-backspace" /> }
    }, {
      id: "MediaNextTrack",
      label: false,
      icon: { default: <Icon icon="step-forward" /> }
    }, {
      id: "MediaPreviousTrack",
      label: false,
      icon: { default: <Icon icon="step-backward" /> }
    }, {
      id: "MediaStop",
      label: false,
      icon: { default: <Icon icon="stop" /> }
    }, {
      id: "MediaPlayPause",
      label: false,
      icon: { default: <span><Icon icon="play" /><Icon icon="pause" /></span> }
    }
  ]);

export function findSpecialKey(id) {
  return SPECIALKEYS.find(item => item.id === id);
}

export function findKey(id) {
  return KEYS.find(item => item.id === id);
}

export const GetSpecialKeyLabel = (key) => {
  if ( key.label === false ) {
    return "";
  } else if ( typeof key.label === "string" ) {
    return key.label;
  } else if ( key.label ) {
    if ( process.platform in key.label ) {
      return Reflect.get(key.label, process.platform);
    } else if ( "default" in key.label ) {
      return key.label.default;
    }
  }

  return key.id;
}

export const GetSpecialKeyIcon = (key) => {
  if ( key.icon ) {
    if ( process.platform in key.icon ) {
      return key.icon[process.platform];
    } else if ( "default" in key.icon ) {
      return key.icon.default;
    }
  }

  return [];
}