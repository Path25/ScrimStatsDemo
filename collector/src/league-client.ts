import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export type LeagueClientPath =
  | '/lol-champ-select/v1/session'
  | '/lol-game-data/assets/v1/champion-summary.json'
  | '/lol-game-data/assets/v1/items.json'
  | '/lol-end-of-game/v1/eog-stats-block'
  | '/lol-end-of-game/v1/gameclient-eog-stats-block';

export interface LeagueClientConnection {
  port: number;
  password: string;
  protocol: 'http' | 'https';
}

export function parseLeagueLockfile(value: string): LeagueClientConnection | undefined {
  const match = value.trim().match(/^[^:]+:\d+:(\d+):([^:]+):(https?)$/i);
  if (!match) return undefined;
  const port = Number(match[1]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return undefined;
  return {
    port,
    password: match[2],
    protocol: match[3].toLocaleLowerCase() as 'http' | 'https',
  };
}

async function runningLeagueDirectory() {
  if (process.platform !== 'win32') return undefined;
  try {
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', "(Get-Process -Name 'LeagueClientUx' -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Path)"],
      { timeout: 3_000, windowsHide: true },
    );
    const executable = stdout.trim();
    return executable ? path.dirname(executable) : undefined;
  } catch {
    return undefined;
  }
}

export async function discoverLeagueLockfile() {
  const processDirectory = await runningLeagueDirectory();
  const candidates = [
    process.env.SCRIMSTATS_LEAGUE_LOCKFILE,
    processDirectory ? path.join(processDirectory, 'lockfile') : undefined,
    'C:\\Riot Games\\League of Legends\\lockfile',
    'C:\\Program Files\\Riot Games\\League of Legends\\lockfile',
  ].filter((candidate): candidate is string => Boolean(candidate));
  for (const candidate of [...new Set(candidates)]) {
    try {
      const value = await fs.readFile(candidate, 'utf8');
      const connection = parseLeagueLockfile(value);
      if (connection) return connection;
    } catch {
      // The League Client is either closed or installed somewhere else.
    }
  }
  return undefined;
}

export async function leagueUxRequest(requestPath: LeagueClientPath): Promise<unknown> {
  const connection = await discoverLeagueLockfile();
  if (!connection) throw new Error('League Client is not available.');
  const authorization = Buffer.from(`riot:${connection.password}`).toString('base64');
  return new Promise((resolve, reject) => {
    const requestClient = connection.protocol === 'https' ? https : http;
    const request = requestClient.request({
      hostname: '127.0.0.1',
      port: connection.port,
      path: requestPath,
      method: 'GET',
      ...(connection.protocol === 'https' ? { rejectUnauthorized: false } : {}),
      timeout: 4_000,
      headers: { Authorization: `Basic ${authorization}`, Accept: 'application/json' },
    }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        if (response.statusCode !== 200) {
          reject(new Error(`League Client returned ${response.statusCode ?? 'an unknown status'}.`));
          return;
        }
        try { resolve(JSON.parse(body)); }
        catch { reject(new Error('League Client returned invalid JSON.')); }
      });
    });
    request.on('timeout', () => request.destroy(new Error('League Client timed out.')));
    request.on('error', reject);
    request.end();
  });
}

export async function firstLeagueUxResponse(paths: LeagueClientPath[]) {
  for (const requestPath of paths) {
    try {
      const response = await leagueUxRequest(requestPath);
      if (response && typeof response === 'object') return response as Record<string, unknown>;
    } catch {
      // These endpoints are intentionally transient. Try the next compatible path.
    }
  }
  return undefined;
}

export function leagueCatalog(payload: unknown) {
  if (!Array.isArray(payload)) return {} as Record<string, string>;
  return Object.fromEntries(payload.flatMap((value) => {
    if (!value || typeof value !== 'object') return [];
    const row = value as Record<string, unknown>;
    const id = Number(row.id);
    const name = row.name;
    return Number.isFinite(id) && typeof name === 'string' && name.trim()
      ? [[String(id), name.trim()]]
      : [];
  }));
}
