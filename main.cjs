const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    backgroundColor: '#000000',
    title: 'Traveler Trade Terminal',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Hides the standard standard windows menu bar
  mainWindow.setMenuBarVisibility(false);

  // Configure popups to have a dark background and hide their menu
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        backgroundColor: '#051405',
        autoHideMenuBar: true,
      }
    };
  });

  // In production, we load the bundled index.html
  // In dev, we load the Vite dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Intercept iframe URL changes (for tracking the Traveller Map)
  mainWindow.webContents.on('did-navigate-in-page', (event, url, isMainFrame) => {
    if (!isMainFrame && url.includes('travellermap.com')) {
      mainWindow.webContents.send('save-map-url', url);
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
