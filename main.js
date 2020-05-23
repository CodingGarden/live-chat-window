// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let highlightWindow;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    title: 'Live Chat',
    closable: true,
    width: 640,
    height: 1080,
    frame: false,
    x: 1920 - 640,
    y: 30,
    hasShadow: false,
    transparent: true,
    titleBarStyle: 'customButtonsOnHover',
    minimizable: false,
    maximizable: false,
    // alwaysOnTop: true,
    backgroundColor: '#00FFFFFF',
    // type: 'desktop',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile('index.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

function createHighlightWindow (message) {
  if (highlightWindow) {
    return;
  }
  // Create the browser window.
  highlightWindow = new BrowserWindow({
    title: 'Highlight Chat',
    closable: true,
    width: 1000,
    height: 320,
    frame: false,
    x: 10,
    y: 1080 - 300,
    hasShadow: false,
    transparent: true,
    titleBarStyle: 'customButtonsOnHover',
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    backgroundColor: '#00FFFFFF',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // and load the index.html of the app.
  highlightWindow.loadFile('highlight.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  highlightWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    highlightWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit();
});

app.on('web-contents-created', (e, contents) => {
  contents.on('will-navigate', (event, url) => {
    event.preventDefault();
    console.log('blocked navigate:', url);
  });
  contents.on('new-window', async (event, url) => {
    event.preventDefault();
    console.log('blocked window:', url);
  });
});

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('highlightMessage', (message) => {
  createHighlightWindow();
});
