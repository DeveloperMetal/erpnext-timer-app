# ERPNext Timesheet App

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
- [Electron Packager](https://github.com/electron-userland/electron-packager) - Compile native applications for win, mac, linux
- [nwb-electron-starter](https://github.com/brumm/nwb-electron-starter) - A clean nwb setup for electron + nwb app development.

# ERPNext Connector

To keep the app UI development loosely coupled to its backed, we've put all server CRUD operations in the ERPNext.js component and abstracted operations there. 

The idea here is to have this connector return promises on all actions against the server.

# TODO

- [ ] Add Windows installer
- [ ] Add Mac DMG installer
- [ ] Add Linux Installer?
- [ ] Finish erpnext connector to send/receipt timesheet info
- [ ] Build task entry details popup
- [ ] Close and minimize to tray actions
- [ ] Logout button inside settings
- [ ] Add quit app in settings page and login page.
- [ ] Add settings idle timeout settings
- [ ] Add task icon active task icon generation
- [ ] Tie desktop idle to current cative task to remind user of active timer.
