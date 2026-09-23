const { contextBridge, ipcRenderer } = require('electron');

// One preload is shared by both the detector window and the celebration
// window. Each window only calls the parts of this API it needs.
contextBridge.exposeInMainWorld('blinkPopperAPI', {
  // --- Detector (main) window -> main process ---
  triggerCelebration: () => ipcRenderer.send('trigger-celebration'),
  setMuted: (muted) => ipcRenderer.send('set-muted', muted),
  openCameraSettings: () => ipcRenderer.send('open-camera-settings'),
  openDevTools: () => ipcRenderer.send('toggle-devtools'),

  onCelebrationFinished: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('celebration-finished', listener);
    return () => ipcRenderer.removeListener('celebration-finished', listener);
  },

  // --- Celebration window <- main process ---
  onStartCelebration: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('start-celebration', listener);
    return () => ipcRenderer.removeListener('start-celebration', listener);
  },

  onSetMuted: (callback) => {
    const listener = (_event, muted) => callback(muted);
    ipcRenderer.on('set-muted', listener);
    return () => ipcRenderer.removeListener('set-muted', listener);
  },

  notifyCelebrationFinished: () => ipcRenderer.send('celebration-finished'),
});
