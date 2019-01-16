const { DEV, PORT = '8080' } = process.env

import * as Sentry from '@sentry/electron';

Sentry.init({dsn: 'https://5af676ee91b945a5aed4e106e339a204@sentry.io/1301366', environment: DEV?"development":"production"});

import { app, BrowserWindow, screen, Menu, Tray, globalShortcut, ipcMain } from 'electron';
import template from './menu-template';
import windowStateKeeper from 'electron-window-state';
import { autoUpdater } from 'electron-updater';
import settings from 'electron-settings';
import desktopIdle from 'desktop-idle';
import path from 'path';
import log from 'electron-log';
import { buildEditContext } from './contextEditMenu';
import keytar from 'keytar';
import { buildTrayMenu } from './trayMenu';
import { TrayState, TrayAnimation } from './trayAnimations';
import changeLog from '../changelog.json';
import moment from "moment";
import momentDurationFormatSetup from "moment-duration-format";
momentDurationFormatSetup(moment);

const KEYTAR_SERVICE = 'com.bloomstack.timerapp';
const SHOW_TRAY_DEBUGGER = true;
const windowUrl = DEV ? `http://localhost:${PORT}/` : `file://${app.getAppPath()}/dist/index.html`

let mainWindow;
let timerInterval = false;

autoUpdater.logger = log;
autoUpdater.autoDownload = true;

let init = Promise.resolve();

if ( DEV ) {
  const {
    default: installExtension,
    REACT_DEVELOPER_TOOLS
  } = require('electron-devtools-installer');
  init = init.then(() => installExtension(REACT_DEVELOPER_TOOLS));
}

init.then(() => {
    let { width, height } = screen.getPrimaryDisplay().workAreaSize

    if (process.platform === 'darwin') {
      Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    } else {
      Menu.setApplicationMenu(DEV?Menu.buildFromTemplate(template):null);
    }
    

    let mainWindowState = windowStateKeeper({
      defaultWidth: 400,
      defaultHeight: 500,
      defaultX: width - 400,
      defaultY: 0
    })

    mainWindow = new BrowserWindow({
      width: mainWindowState.width,
      height: mainWindowState.height,
      x: mainWindowState.x,
      y: mainWindowState.y,
      minWidth: 400,
      minHeight: 200,
      webPreferences: {
        webSecurity: false,
        preload: path.join(__dirname, 'sentry.js')
      },
      show: false,
      autoHideMenuBar : true,
      alwaysOnTop: true
    });

    mainWindowState.manage(mainWindow);

    let tray = new Tray(path.join(__dirname, 'assets', 'tray.png'));

    let trayState = new TrayState(tray, mainWindow);
    let animationDelay = 150;
    let animationFrames = [];
    for(let i=1; i <= 8; i++) {
      animationFrames.push({ 
        path: path.join(__dirname, 'assets', `tray-frame-${i}.png`), 
        delay: animationDelay });
    }
    trayState.addIdleImage(path.join(__dirname, 'assets', 'tray.png'));
    trayState.addRunningAnimation(new TrayAnimation(animationFrames));
    trayState.setIdle(); // start with stopped timer icon

    mainWindow.webContents.on("did-fail-load", (e) => {
      console.error("Error loading app: ", e);
    });

    mainWindow.webContents.once('dom-ready', () => {
      if (!DEV) {
        mainWindow.webContents.send("message", "Begin App...");
        autoUpdater.checkForUpdatesAndNotify();
      }
    });

    buildTrayMenu(app, mainWindow, tray, false, SHOW_TRAY_DEBUGGER);
    buildEditContext(mainWindow);

    tray.on('click', () => {
      mainWindow.isVisible()?mainWindow.hide():mainWindow.show();
    })

    mainWindow.on('closed', () => {
      mainWindow = null
    })

    mainWindow.on('show', () => {
      tray.setHighlightMode('always');
    })

    mainWindow.on('hide', () => {
      tray.setHighlightMode('never');
    })

    mainWindow.once('ready-to-show', () => {
      positionWindow(mainWindow, tray);
      mainWindow.show();

      const ret = globalShortcut.register('CommandOrControl+Alt+T', () => {
        let visible = mainWindow.isVisible();

        if ( !visible ) {
          positionWindow(mainWindow, tray);
          mainWindow.show();
        } else {
          if ( isMouseOnAppDisplay(mainWindow) ) {
            mainWindow.hide();
          } else {
            positionWindow(mainWindow, tray);
          }
        }
      });
    
    })

    mainWindow.on('minimize', (event) => {
      event.preventDefault();
      mainWindow.hide();
    });


    mainWindow.on('close', (event) => {
      if ( !app.isQuiting ) {
        event.preventDefault();
        mainWindow.hide();
      }
    });

    autoUpdater.on('checking-for-update', () => {
      Sentry.captureMessage("Checking for updates...");
    });

    autoUpdater.on('update-available', (info) => {
      Sentry.captureMessage("Update available...");
      mainWindow.webContents.send("update-available");
    });

    autoUpdater.on('update-not-available', (info) => {
      Sentry.captureMessage("Update not available...");
    });

    autoUpdater.on('error', (err) => {
      Sentry.captureMessage("Error auto updating... ");
      Sentry.captureError(err);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      let log_message = "Download speed: " + progressObj.bytesPerSecond;
      log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
      log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
      mainWindow.webContents.send("message", log_message);
      mainWindow.webContents.send("update-download-progress", progressObj);
    });

    autoUpdater.on('update-downloaded', (info) => {
      mainWindow.webContents.send("message", "Update downloaded");
      mainWindow.webContents.send("update-ready");
      Sentry.captureMessage("Update downloaded and ready to install!");
    });

    ipcMain.on('getIdleTime', (event, arg) => {
      event.sender.send('setIdleTime', desktopIdle.getIdleTime())
    });

    ipcMain.on('getSetting', (event, key, defaultValue) => {
      let result = settings.get(key, defaultValue);
      event.returnValue = result || '';
    });

    ipcMain.on('setSetting', (event, key, value) => {
      settings.set(key, value);
      event.returnValue = true;
    });

    ipcMain.on('update-install', (event) => {
      autoUpdater.quitAndInstall();
      event.returnValue = true;
    });

    ipcMain.on('getCredentials', (event, usr) => {
      if ( usr ) {
        keytar.getPassword(KEYTAR_SERVICE, usr).then(result => {
          event.returnValue = result;
        })
        .catch((err) => {
          console.error(err);
          event.returnValue = '';
        })
      } else {
        event.returnValue = '';
      }
    })

    ipcMain.on('saveCredentials', (event, account, password) => {
      keytar.setPassword(KEYTAR_SERVICE, account, password);
      event.returnValue = true;
    });

    ipcMain.on('removeCredentials', (event, account) => {
      keytar.deletePassword(KEYTAR_SERVICE, account);
      event.returnValue = true;
    });

    function getLoginInfo() {
      let rememberLogin = settings.get('rememberLogin', false);
      let autoLogin = settings.get('autoLogin', false);
      let host = settings.get('host', '');
      let usr = '', pwd = '';
      if ( rememberLogin ) {
        usr = settings.get('usr', '');
      }
      
      return Promise.resolve({
        auth: {
          host, usr, pwd
        },
        options: {
          rememberLogin,
          autoLogin
        }
      })
    }

    ipcMain.on('api:appStarted', (event, request) => {
      console.log("on App Started");

      let response = {
        displayChangeLog: false,
        changeLog
      };

      let lastChangeLog = settings.get('last-changelog-displayed');
      if ( lastChangeLog != app.getVersion() ) {
        //settings.set('last-changelog-displayed', app.getVersion());
        response.displayChangeLog = true;
      }

      console.log(response);
      event.sender.send(request.response_channel, response);

    })

    ipcMain.on('api:getLoginInfo', (event, request) => {

      getLoginInfo()
        .then((result => {
          if ( result.options.rememberLogin && result.auth.usr ) {
            return keytar.getPassword(KEYTAR_SERVICE, result.auth.usr).then(pwd => {
              result.auth.pwd = pwd;
              return result;
            })
            .catch((err) => {
              console.error(err);
              return result;
            });
          }

          return result;
        }))
        .then((response) => {
          return event.sender.send(request.response_channel, response);
        })
        .catch((error) => {
          console.error(error);
          event.sender.send(request.error_channel, error);
        })

    });

    ipcMain.on('user-login', (event) => {
      buildTrayMenu(app, mainWindow, tray, true, SHOW_TRAY_DEBUGGER);
    });

    ipcMain.on('user-logout', (event) => {
      buildTrayMenu(app, mainWindow, tray, false, SHOW_TRAY_DEBUGGER);
    })

    ipcMain.on('timer-started', (event, hours, from_time_ms) => {
      if ( typeof from_time_ms === undefined ) {
        return;
      }

      trayState.setTimerRunning();
      hours = Math.floor((hours || 0) * 3600000);
      const from_time = moment(from_time_ms, "X");

      if ( timerInterval ) {
        clearInterval(timerInterval);
      }
      timerInterval = setInterval(() => {
        let to_time = moment();
        let total_ms = moment.duration(to_time.diff(from_time), "ms").asMilliseconds();
        app.dock.setBadge(moment.duration(hours + total_ms, "ms").format())
      }, 1000)
    })

    ipcMain.on('timer-stopped', (event) => {
      trayState.setIdle();
      if ( timerInterval ) {
        clearInterval(timerInterval);
      }
      app.dock.setBadge("");
    })

    mainWindow.loadURL(windowUrl);

  })
  .catch(err => console.log('An error occurred: ', err))

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

function positionWindow(win, tray) {
  let mousePos = screen.getCursorScreenPoint();
  let display = screen.getDisplayNearestPoint(mousePos);

  const { x, y, width, height } = display.workArea;
  const [ winWidth, winHeight ] = win.getSize();

  win.setPosition(x + (width - winWidth), y);
  win.setSize(winWidth, height - tray.getBounds().height);
}

function isMouseOnAppDisplay(win) {
  let winPosition = win.getPosition();
  let mousePos = screen.getCursorScreenPoint();
  let appDisplay = screen.getDisplayNearestPoint({x: winPosition[0], y: winPosition[1]});
  let mouseDisplay = screen.getDisplayNearestPoint(mousePos);
 
  return appDisplay.id === mouseDisplay.id;
}

process.on('uncaughtException', console.log)
