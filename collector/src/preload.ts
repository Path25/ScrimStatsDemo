import { contextBridge, ipcRenderer } from 'electron';

import type { CollectorStatus, ScrimStatsCollectorBridge } from './types';

const bridge: ScrimStatsCollectorBridge = {
  getCapabilities: () => ipcRenderer.invoke('collector:capabilities'),
  getStatus: () => ipcRenderer.invoke('collector:status'),
  pair: (code, label) => ipcRenderer.invoke('collector:pair', code, label),
  refreshConfiguration: () => ipcRenderer.invoke('collector:refresh-configuration'),
  selectScrim: (scrimId) => ipcRenderer.invoke('collector:select-scrim', scrimId),
  setRecordingEnabled: (enabled) => ipcRenderer.invoke('collector:set-recording-enabled', enabled),
  exportDiagnostics: () => ipcRenderer.invoke('collector:export-diagnostics'),
  onStatus(callback) {
    const listener = (_event: Electron.IpcRendererEvent, status: CollectorStatus) => callback(status);
    ipcRenderer.on('collector:status', listener);
    return () => ipcRenderer.removeListener('collector:status', listener);
  },
};

contextBridge.exposeInMainWorld('scrimstatsCollector', bridge);
