const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('backupDesktop', Object.freeze({
  getSession: () => ipcRenderer.invoke('session:get'),
  configure: (input) => ipcRenderer.invoke('session:configure', input),
  loadData: () => ipcRenderer.invoke('data:load'),
  registerDevice: (info) => ipcRenderer.invoke('device:register', info),
  healthCheck: () => ipcRenderer.invoke('maintenance:health'),
  openApiDocs: () => ipcRenderer.invoke('maintenance:open-api')
}));
