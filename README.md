# ERPNext Timesheet App (WIP)

Custom time tracking app for ERPNext.

All connections to the server are done through the frappe rest api.

The following projects were used to build this app:

- [ReactJS](https://reactjs.org/docs/getting-started.html) - Web App Framework.
- [BluePrintJS](http://blueprintjs.com/docs/#blueprint) - UI Framework.
- [React Router](https://reacttraining.com/react-router/) - To internllay track page switching.
- [React Transition Group](https://reactcommunity.org/react-transition-group/) - To cleanly handle smooth page switching.
- [Electron Desktop Idle](https://github.com/bithavoc/node-desktop-idle) - Track user idle time.
- [Axios](https://github.com/axios/axios) - HTTP(s) remote request library to handle rest api.
- [Nwb](https://github.com/insin/nwb) - cli tools to handle react building and live reload during development
- [nwb-electron-starter](https://github.com/brumm/nwb-electron-starter) - A clean nwb setup for electron + nwb app development.

# ERPNext Connector

To keep the app UI development loosely coupled to its backed, we've put all server CRUD operations in the ERPNext.js component and abstracted operations there. 

The idea here is to have this connector return promises on all actions against the server.

# Planned Implementation Details

For this app to work a timesheet will be generated every day for it's user. This can be done either server side as required or app side if no timesheet is found for that day. 

Tho, no timesheet would be generated without at least one task for that day.

Tasks will be grouped by project so that user has to:

1) Pick the project a task is being worked on
2) Pick the task itself belonging to that project
3) Or create tasks on the fly for the project as well.

The app app should enforce only one active task at a time and display a custom timer on the OS's task tray icon.

Also, by default if a timer was started every 10 minute desktop idle time the app will display a reminder that the task was left running.

The idle reminder should give two options: 

1) Remove X minutes of detected idle time and stop timer.
2) or close reminder. Resetting idle timer check until next timeout.

There should be a logout option in the settings page as well as the login widget.



# TODO

- [X] Add Windows installer
- [X] Add Mac DMG installer
- [X] Add Linux Installer?
- [X] Finish erpnext connector to send/receipt timesheet info
- [X] Build task entry details popup
- [X] Close and minimize to tray actions
- [ ] Logout button inside settings
- [ ] Add quit app in settings page and login page.
- [ ] Add settings idle timeout settings
- [X] Add task icon active task icon generation
- [ ] Tie desktop idle to current cative task to remind user of active timer.
