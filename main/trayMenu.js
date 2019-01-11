import { Menu } from 'electron';

export function buildTrayMenu(app, mainWindow, tray, loggedIn, showDebug) {
  var trayMenu = [{
    label: "Show App",
    click: function() {
      mainWindow.show();
    }
  }];

  if ( showDebug ) {
    trayMenu.push({
      label: 'Debug',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click(item) {
            if (mainWindow) {
              mainWindow.reload()
            }
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click(item) {
            if (mainWindow) {
              mainWindow.toggleDevTools()
            }
          },
        },
      ],
    });
  }

  if ( loggedIn ) {
    trayMenu.push({
      type: 'separator',
    });

    trayMenu.push({
      label: "Log out",
      click: function() {
        mainWindow.webContents.send('user-logout');
      }
    });
  }
  
  trayMenu.push({
    type: 'separator',
  });

  trayMenu.push({
    label: "Quit",
    click: function() {
      app.isQuiting = true;
      app.quit();
    }
  });

  tray.setContextMenu(Menu.buildFromTemplate(trayMenu));
}