import type { Credential, FinalSnapshot, LocalEvent, RosterIdentity, ScheduledScrim } from './types';

const API = process.env.SCRIMSTATS_API_URL ?? 'https://tvcgjehreaayfazlhvps.supabase.co/functions/v1';
const request = async (path: string, init: RequestInit) => {
  const response = await fetch(`${API}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? `Server request failed (${response.status}).`);
  return body;
};
const appVersion = '0.6.0';

export const pair = (pairingCode: string, deviceLabel: string) => request('/collector-pair', { method: 'POST', body: JSON.stringify({ pairing_code: pairingCode, device_label: deviceLabel, app_version: appVersion }) }) as Promise<{ device_id: string; credential: string; tenant_id: string; scrims: ScheduledScrim[]; roster: RosterIdentity[] }>;
const auth = (credential: Credential) => ({ Authorization: `Bearer ${credential.credential}`, 'X-Collector-Device-ID': credential.deviceId });
export const heartbeat = (credential: Credential) => request('/collector-ingest', { method: 'POST', headers: auth(credential), body: JSON.stringify({ action: 'heartbeat', app_version: appVersion }) });
export const loadConfiguration = (credential: Credential) => request('/collector-ingest', { method: 'POST', headers: auth(credential), body: JSON.stringify({ action: 'configuration', app_version: appVersion }) }) as Promise<{ scrims: ScheduledScrim[]; roster: RosterIdentity[] }>;
export const startSession = (credential: Credential, scrimId: string, clientSessionId: string, localGameId: string) => request('/collector-ingest', { method: 'POST', headers: auth(credential), body: JSON.stringify({ action: 'start', scrim_id: scrimId, client_session_id: clientSessionId, local_game_id: localGameId, schema_version: 5 }) });
export const sendEvents = (credential: Credential, captureSessionId: string, events: LocalEvent[]) => request('/collector-ingest', { method: 'POST', headers: auth(credential), body: JSON.stringify({ action: 'events', capture_session_id: captureSessionId, events }) });
export const completeSession = (credential: Credential, captureSessionId: string, snapshot: FinalSnapshot) => request('/collector-ingest', { method: 'POST', headers: auth(credential), body: JSON.stringify({ action: 'complete', capture_session_id: captureSessionId, snapshot }) });
