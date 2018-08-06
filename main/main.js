import { app, BrowserWindow, screen, Menu, ipcMain } from 'electron'
import template from './menu-template.js'
import windowStateKeeper from 'electron-window-state'
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer'
import settings from 'electron-settings';
import desktopIdle from 'desktop-idle';

const { DEV, PORT = '8080' } = process.env
const windowUrl = DEV ? `http://localhost:${PORT}/` : `file://${app.getAppPath()}/dist/index.html`

let mainWindow

installExtension(REACT_DEVELOPER_TOOLS)
  .then(name => {
    let { width, height } = screen.getPrimaryDisplay().workAreaSize

    Menu.setApplicationMenu(Menu.buildFromTemplate(template))

    let mainWindowState = windowStateKeeper({
      defaultWidth: width * 0.9,
      defaultHeight: height * 0.9,
    })

    mainWindow = new BrowserWindow({
      width: mainWindowState.width,
      height: mainWindowState.height,
      x: mainWindowState.x,
      y: mainWindowState.y,
      minWidth: 200,
      minHeight: 200,
      titleBarStyle: 'hiddenInset',
      webPreferences: {
        webSecurity: false,
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

    ipcMain.on('getIdleTime', (event, arg) => {
      event.sender.send('setIdleTime', desktopIdle.getIdleTime())
    })

    ipcMain.on('getSetting', (event, key, defaultValue) => {
      console.log('getSettings: ', event, key, defaultValue);
      let result = settings.get(key, defaultValue);
      console.log('result: ', result);
      event.returnValue = result || '';
    });

    ipcMain.on('setSetting', (event, key, value) => {
      console.log("Set Settings: ", key, value);
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

process.on('uncaughtException', console.log)
