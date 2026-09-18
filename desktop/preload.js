const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('backupDesktop', Object.freeze({
  getSession: () => ipcRenderer.invoke('session:get'),
  configure: (input) => ipcRenderer.invoke('session:configure', input),
  loadData: () => ipcRenderer.invoke('data:load'),
  registerDevice: (info) => ipcRenderer.invoke('device:register', info),
  healthCheck: () => ipcRenderer.invoke('maintenance:health'),
  openApiDocs: () => ipcRenderer.invoke('maintenance:open-api'),

  getSystemHealth: () => ipcRenderer.invoke('system:health'),
  checkForUpdates: () => ipcRenderer.invoke('system:check-updates'),
  openUpdateSettings: () => ipcRenderer.invoke('system:open-update-settings'),
  restartComputer: () => ipcRenderer.invoke('system:restart'),

  openScreensaver: () => ipcRenderer.invoke('screensaver:open'),
  closeScreensaver: () => ipcRenderer.invoke('screensaver:close'),
  recordAdView: (payload) => ipcRenderer.invoke('ads:record', payload),
  getEarnings: () => ipcRenderer.invoke('ads:earnings'),
  onEarningsChanged: (cb) => ipcRenderer.on('earnings:changed', cb),
}));
