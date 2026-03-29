const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loadConfig: (file) => ipcRenderer.invoke('load-config', file),
    openFile: () => ipcRenderer.invoke('open-file'),
    saveFile: (content) => ipcRenderer.invoke('save-file', content),
    quickSaveFile: (data) => ipcRenderer.invoke('quick-save-file', data),
});