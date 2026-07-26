import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  nativeImage,
  safeStorage,
  shell,
  Tray,
} from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';

import { pair } from './api-client';
import { CollectorService } from './collector-service';
import type { CollectorCapabilities, CollectorPersistence, Credential, PersistedCaptureState, ScheduledScrim } from './types';

const captureStatePath = () => path.join(app.getPath('userData'), 'collector-capture-state.bin');
const persistedCaptureState: CollectorPersistence = {
  async clear() { await fs.rm(captureStatePath(), { force: true }); },
  async load() {
    try {
      const encrypted = await fs.readFile(captureStatePath());
      return safeStorage.isEncryptionAvailable()
        ? JSON.parse(safeStorage.decryptString(encrypted)) as PersistedCaptureState
        : undefined;
    } catch {
      return undefined;
    }
  },
  async save(state) {
    if (!safeStorage.isEncryptionAvailable()) throw new Error('Windows secure storage is unavailable.');
    await fs.writeFile(captureStatePath(), safeStorage.encryptString(JSON.stringify(state)));
  },
};
const collector = new CollectorService(persistedCaptureState);
const dashboardUrl = process.env.SCRIMSTATS_APP_URL ?? 'https://scrimstats.gg';
const dashboardOrigin = new URL(dashboardUrl).origin;
let window: BrowserWindow | undefined;
let tray: Tray | undefined;
let scrims: ScheduledScrim[] = [];
let quitting = false;

const dataPath = () => path.join(app.getPath('userData'), 'collector-credential.bin');
const logPath = () => path.join(app.getPath('userData'), 'collector-diagnostics.log');
const log = async (message: string) =>
  fs.appendFile(logPath(), `${new Date().toISOString()} ${message}\n`).catch(() => undefined);

async function restoreCredential() {
  try {
    const encrypted = await fs.readFile(dataPath());
    if (safeStorage.isEncryptionAvailable()) {
      return JSON.parse(safeStorage.decryptString(encrypted)) as Credential;
    }
  } catch {
    // An absent or unreadable credential returns the collector to pairing.
  }
  return undefined;
}

async function saveCredential(credential: Credential) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Windows secure storage is unavailable.');
  }
  await fs.writeFile(dataPath(), safeStorage.encryptString(JSON.stringify(credential)));
}

function isDashboardUrl(candidate: string) {
  try {
    return new URL(candidate).origin === dashboardOrigin;
  } catch {
    return false;
  }
}

function showWindow() {
  if (!window) {
    window = new BrowserWindow({
      width: 1440,
      height: 900,
      minWidth: 960,
      minHeight: 680,
      backgroundColor: '#0b1014',
      show: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
      },
    });
    window.webContents.setWindowOpenHandler(({ url }) => {
      if (isDashboardUrl(url)) return { action: 'allow' };
      if (url.startsWith('https://')) void shell.openExternal(url);
      return { action: 'deny' };
    });
    window.webContents.on('will-navigate', (event, url) => {
      if (!isDashboardUrl(url)) {
        event.preventDefault();
        if (url.startsWith('https://')) void shell.openExternal(url);
      }
    });
    window.webContents.on('will-attach-webview', (event) => event.preventDefault());
    window.on('close', (event) => {
      if (!quitting) {
        event.preventDefault();
        window?.hide();
      }
    });
    window.on('ready-to-show', () => window?.show());
    void window.loadURL(`${dashboardOrigin}/collector`);
  }
  window.show();
}

app.whenReady().then(async () => {
  await collector.restore();
  const credential = await restoreCredential();
  if (credential) collector.setCredential(credential);
  collector.start();
  tray = new Tray(nativeImage.createEmpty());
  tray.setToolTip('ScrimStats Collector');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open ScrimStats', click: showWindow },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          quitting = true;
          collector.stop();
          app.quit();
        },
      },
    ]),
  );
  tray.on('click', showWindow);
  collector.on('status', (status) => {
    tray?.setToolTip(`ScrimStats Collector — ${status.message}`);
    window?.webContents.send('collector:status', status);
  });
  showWindow();
});

ipcMain.handle('collector:capabilities', (): CollectorCapabilities => ({
  bridgeVersion: 1,
  capture: true,
  secureStorage: safeStorage.isEncryptionAvailable(),
  platform: process.platform,
}));
ipcMain.handle('collector:status', () => ({ ...collector.getStatus(), scrims }));
ipcMain.handle('collector:pair', async (_, code: unknown, label: unknown) => {
  if (typeof code !== 'string' || !/^[A-Za-z0-9-]{4,64}$/.test(code)) {
    throw new Error('A valid pairing code is required.');
  }
  if (typeof label !== 'string' || label.trim().length < 2 || label.length > 100) {
    throw new Error('A device label between 2 and 100 characters is required.');
  }
  const response = await pair(code, label.trim());
  const credential = {
    deviceId: response.device_id,
    credential: response.credential,
    tenantId: response.tenant_id,
    label: label.trim(),
  };
  await saveCredential(credential);
  scrims = response.scrims;
  collector.setCredential(credential);
  collector.setRoster(response.roster);
  await log(`Paired device ${response.device_id}`);
  return { scrims };
});
ipcMain.handle('collector:select-scrim', (_, id: unknown) => {
  if (typeof id !== 'string') throw new Error('A scrim ID is required.');
  const scrim = scrims.find((candidate) => candidate.id === id);
  if (!scrim) throw new Error('That practice block is not available to this device.');
  collector.selectScrim(scrim);
});
ipcMain.handle('collector:export-diagnostics', async () => {
  const result = await dialog.showSaveDialog({
    defaultPath: 'scrimstats-collector-diagnostics.log',
  });
  if (!result.canceled && result.filePath) await fs.copyFile(logPath(), result.filePath);
});

app.on('before-quit', () => {
  quitting = true;
});
// On Windows the tray process remains alive while the dashboard window is hidden.
app.on('window-all-closed', () => undefined);
