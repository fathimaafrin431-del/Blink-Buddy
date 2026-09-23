const electron = require('electron');

if (!electron.app) {
  // If run via node main.js or if ELECTRON_RUN_AS_NODE=1 was set, respawn inside full Electron
  const { spawn } = require('child_process');
  const electronPath = typeof electron === 'string' ? electron : require('electron');
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const child = spawn(electronPath, [__dirname], { env, stdio: 'inherit' });
  child.on('close', (code) => process.exit(code || 0));
  return;
}

const { app, BrowserWindow, ipcMain, screen, session, shell, powerSaveBlocker } = electron;
const path = require('path');

// Automatically grant media/camera stream access in Chromium without prompt
// Prevent Chromium from blocking camera or throttling in background/minimized windows
app.commandLine.appendSwitch('use-fake-ui-for-media-stream');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

let mainWindow = null;
let celebrationWindow = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 940,
    height: 840,
    minWidth: 640,
    minHeight: 700,
    backgroundColor: '#0f0f1a',
    title: 'Blink Popper',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Automatically open DevTools console for easy debugging
  mainWindow.webContents.openDevTools({ mode: 'right' });

  // Allow F12 or Ctrl+Shift+I to toggle DevTools easily
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    // The celebration window has no meaningful life without the main window.
    if (celebrationWindow && !celebrationWindow.isDestroyed()) {
      celebrationWindow.destroy();
    }
    celebrationWindow = null;
  });
}

function createCelebrationWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { x, y, width, height } = primaryDisplay.bounds;

  celebrationWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    transparent: true,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    focusable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  // Keep it above (almost) everything, including other fullscreen apps where the OS allows it.
  celebrationWindow.setAlwaysOnTop(true, 'screen-saver');
  celebrationWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  celebrationWindow.setIgnoreMouseEvents(true, { forward: true });

  celebrationWindow.loadFile(path.join(__dirname, 'src', 'celebration.html'));

  celebrationWindow.on('closed', () => {
    celebrationWindow = null;
  });
}

app.whenReady().then(() => {
  try {
    powerSaveBlocker.start('prevent-app-suspension');
  } catch (e) {
    console.warn('Could not start powerSaveBlocker:', e);
  }

  // Unconditionally grant all media/device permissions so Chromium never blocks the camera
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });

  session.defaultSession.setPermissionCheckHandler(() => true);

  createMainWindow();
  createCelebrationWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
      createCelebrationWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (celebrationWindow && !celebrationWindow.isDestroyed()) {
    celebrationWindow.destroy();
  }
});

// --- IPC -------------------------------------------------------------

// Detector window asks for the fullscreen celebration to play.
ipcMain.on('trigger-celebration', () => {
  if (!celebrationWindow || celebrationWindow.isDestroyed()) {
    createCelebrationWindow();
  }
  celebrationWindow.setIgnoreMouseEvents(true, { forward: true });
  celebrationWindow.showInactive();
  celebrationWindow.webContents.send('start-celebration');
});

// Celebration window reports that its animation sequence has finished.
ipcMain.on('celebration-finished', () => {
  if (celebrationWindow && !celebrationWindow.isDestroyed()) {
    celebrationWindow.hide();
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('celebration-finished');
  }
});

// Main window toggles mute; forward the setting to the celebration window.
ipcMain.on('set-muted', (_event, muted) => {
  if (celebrationWindow && !celebrationWindow.isDestroyed()) {
    celebrationWindow.webContents.send('set-muted', muted);
  }
});

// Allow user to open system camera privacy settings directly
ipcMain.on('open-camera-settings', () => {
  if (process.platform === 'win32') {
    shell.openExternal('ms-settings:privacy-webcam');
  } else if (process.platform === 'darwin') {
    shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Camera');
  }
});

// Allow frontend button to toggle DevTools console
ipcMain.on('toggle-devtools', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.toggleDevTools();
  }
});

