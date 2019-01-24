import settings from "electron-settings";

export default {
    get visibleToggleShortcut() {
        const modifier = this.visibleToggleShortcutModifier;
        const key = this.visibleToggleShortcutKey;
        return `${modifier}+${key}`;
    },

    get visibleToggleShortcutModifier() {
        let defaultValue = "Control+Alt";
        if ( process.platform === "darwin" ) {
            defaultValue = "Command+Alt";
        }
        return settings.get("userSettings.visibleToggleShortcutModifier", defaultValue);
    },

    set visibleToggleShortcutModifier(value) {
        settings.set("userSettings.visibleToggleShortcutModifier", value);
    },

    get visibleToggleShortcutKey() {
        let defaultValue = "T";
        return settings.get("userSettings.visibleToggleShortcutKey", defaultValue);
    },

    set visibleToggleShortcutKey(value) {
        settings.set("userSettings.visibleToggleShortcutKey", value);
    },

    get onTimerStartGoto() {
        return settings.get("userSettings.onTimerStartGoto", "timesheet");
    },

    set onTimerStartGoto(value) {
        settings.set("userSettings.onTimerStartGoto", value);
    }
}