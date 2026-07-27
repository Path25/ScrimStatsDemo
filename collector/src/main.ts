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

import { loadConfiguration, pair } from './api-client';
import { CollectorService } from './collector-service';
import { isValidPairingCode, normalizePairingCode } from './pairing-code';
import type { CollectorCapabilities, CollectorPersistence, Credential, PersistedCaptureState, ScheduledScrim } from './types';

// Preserve the original encrypted pairing and capture queue when users upgrade
// from the Collector-branded installer to Game Capture.
app.setPath('userData', path.join(app.getPath('appData'), 'ScrimStats Collector'));

const appIconPath = () => app.isPackaged
  ? path.join(process.resourcesPath, 'icon.png')
  : path.join(__dirname, '..', 'build', 'icon.png');
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

async function refreshConfiguration(credential: Credential) {
  const configuration = await loadConfiguration(credential);
  scrims = configuration.scrims;
  collector.setRoster(configuration.roster);
  const current = collector.getStatus();
  if (current.selectedScrim && !scrims.some((scrim) => scrim.id === current.selectedScrim?.id)
    && !['capturing', 'finalizing', 'retrying'].includes(current.state)) {
    collector.selectScrim(undefined);
  }
  return { scrims };
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
      icon: appIconPath(),
      autoHideMenuBar: true,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
      },
    });
    window.removeMenu();
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
    void window.loadURL(`${dashboardOrigin}/overview`);
  }
  window.show();
}

app.whenReady().then(async () => {
  app.setAppUserModelId('gg.scrimstats.collector');
  Menu.setApplicationMenu(null);
  await collector.restore();
  const credential = await restoreCredential();
  if (credential) {
    collector.setCredential(credential);
    try {
      await refreshConfiguration(credential);
    } catch (error) {
      await log(`Could not refresh workspace configuration: ${(error as Error).message}`);
    }
  }
  collector.start();
  const trayIcon = nativeImage.createFromPath(appIconPath()).resize({ width: 20, height: 20 });
  tray = new Tray(trayIcon);
  tray.setToolTip('ScrimStats Game Capture');
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
    tray?.setToolTip(`ScrimStats Game Capture — ${status.message}`);
    window?.webContents.send('collector:status', status);
  });
  showWindow();
});

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (app.isReady()) showWindow();
  });
  app.on('activate', showWindow);
}

ipcMain.handle('collector:capabilities', (): CollectorCapabilities => ({
  bridgeVersion: 3,
  capture: true,
  secureStorage: safeStorage.isEncryptionAvailable(),
  platform: process.platform,
}));
ipcMain.handle('collector:status', () => ({ ...collector.getStatus(), scrims }));
ipcMain.handle('collector:pair', async (_, code: unknown, label: unknown) => {
  const normalizedCode = normalizePairingCode(code);
  if (!isValidPairingCode(normalizedCode)) {
    throw new Error('A valid pairing code is required.');
  }
  if (typeof label !== 'string' || label.trim().length < 2 || label.length > 100) {
    throw new Error('A device label between 2 and 100 characters is required.');
  }
  const response = await pair(normalizedCode, label.trim());
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
ipcMain.handle('collector:refresh-configuration', async () => {
  const credential = await restoreCredential();
  if (!credential) throw new Error('Connect this computer before refreshing scrim blocks.');
  return refreshConfiguration(credential);
});
ipcMain.handle('collector:select-scrim', (_, id: unknown) => {
  if (typeof id !== 'string') throw new Error('A scrim block is required.');
  const scrim = scrims.find((candidate) => candidate.id === id);
  if (!scrim) throw new Error('That scrim block is no longer available for capture.');
  collector.selectScrim(scrim);
});
ipcMain.handle('collector:set-recording-enabled', (_, enabled: unknown) => {
  if (typeof enabled !== 'boolean') throw new Error('Capture state must be enabled or disabled.');
  collector.setRecordingEnabled(enabled);
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
