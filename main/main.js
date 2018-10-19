const { DEV, PORT = '8080' } = process.env

import * as Sentry from '@sentry/electron';

Sentry.init({dsn: 'https://5af676ee91b945a5aed4e106e339a204@sentry.io/1301366', environment: DEV?"development":"production"});

import { app, BrowserWindow, screen, Menu, Tray, ipcMain } from 'electron';
import template from './menu-template.js';
import windowStateKeeper from 'electron-window-state';
import { autoUpdater } from 'electron-updater';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer'
import settings from 'electron-settings';
import desktopIdle from 'desktop-idle';
import path from 'path';

const windowUrl = DEV ? `http://localhost:${PORT}/` : `file://${app.getAppPath()}/dist/index.html`

let mainWindow

autoUpdater.logger = console.log;


installExtension(REACT_DEVELOPER_TOOLS)
  .then(name => {
    let { width, height } = screen.getPrimaryDisplay().workAreaSize

    Menu.setApplicationMenu(DEV?Menu.buildFromTemplate(template):null);

    //let tray = new Tray();

    let mainWindowState = windowStateKeeper({
      defaultWidth: 400,
      defaultHeight: 600,
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
      //titleBarStyle: 'hiddenInset',
      webPreferences: {
        webSecurity: false,
        preload: path.join(__dirname, 'sentry.js')
      },
      show: false,
    })

    mainWindowState.manage(mainWindow)
    mainWindow.loadURL(windowUrl)

    if (DEV) {
      mainWindow.webContents.once('dom-ready', () => {
        mainWindow.webContents.openDevTools()
      })
    }

    mainWindow.on('closed', () => {
      mainWindow = null
    })

    mainWindow.once('ready-to-show', mainWindow.show)

    autoUpdater.on('checking-for-update', () => {
      Sentry.captureMessage("Checking for updates...");
   })
    autoUpdater.on('update-available', (info) => {
      Sentry.captureMessage("Update available...");
    })
    autoUpdater.on('update-not-available', (info) => {
      Sentry.captureMessage("Update not available...");
    })
    autoUpdater.on('error', (err) => {
      Sentry.captureMessage("Error auto updating... ");
      Sentry.captureError(err);
    })

    autoUpdater.on('download-progress', (progressObj) => {
      let log_message = "Download speed: " + progressObj.bytesPerSecond;
      log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
      log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
      mainWindow.webContents.send("message", log_message);
    })

    autoUpdater.on('update-downloaded', (info) => {
      mainWindow.webContents.send("message", "Update downloaded");
      Sentry.captureMessage("Update downloaded and ready to install!");
      autoUpdater.checkForUpdatesAndNotify(); // This version waits for app to quit before installing new version.
      //autoUpdater.quitAndInstall(); // This version installs immediately without waiting on user.
    });

    ipcMain.on('getIdleTime', (event, arg) => {
      event.sender.send('setIdleTime', desktopIdle.getIdleTime())
    })

    ipcMain.on('getSetting', (event, key, defaultValue) => {
      let result = settings.get(key, defaultValue);
      event.returnValue = result || '';
    });

    ipcMain.on('setSetting', (event, key, value) => {
      settings.set(key, value);
      event.returnValue = true;
    });


  })
  .catch(err => console.log('An error occurred: ', err))

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('ready', () => {
  mainWindow.webContents.send("message", "Begin App...");
  autoUpdater.checkForUpdates();
})

process.on('uncaughtException', console.log)
