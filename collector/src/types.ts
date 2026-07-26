export type CollectorState = 'unpaired' | 'ready' | 'capturing' | 'retrying' | 'error';

export interface Credential { deviceId: string; credential: string; tenantId: string; label: string; }
export interface ScheduledScrim { id: string; opponent_name: string; scheduled_time: string; format?: string | null; status: string; }
export interface RosterIdentity { playerId: string; riotId: string; tagLine: string; region?: string | null; }
export interface CollectorCapabilities { bridgeVersion: 1; capture: true; secureStorage: boolean; platform: string; }
export interface CollectorStatus { state: CollectorState; message: string; selectedScrim?: ScheduledScrim; lastCaptureAt?: string; queueDepth: number; }
export interface LocalEvent { event_id: string; sequence: number; occurred_at?: string; event_type?: string; [key: string]: unknown; }
export interface FinalSnapshot { local_game_id: string; schema_version: number; started_at?: string; ended_at?: string; duration_seconds?: number; result?: 'win' | 'loss' | 'draw'; side?: 'blue' | 'red'; identity_resolution_status: 'matched' | 'ambiguous' | 'unmatched'; our_team_kills?: number; enemy_team_kills?: number; our_team_gold?: number; enemy_team_gold?: number; objectives?: unknown; draft?: unknown; participants: Array<Record<string, unknown>>; timeline: LocalEvent[]; }

export interface PersistedCaptureState {
  captureSessionId?: string;
  capturedEvents: LocalEvent[];
  clientSessionId?: string;
  lastSnapshot?: Record<string, unknown>;
  queuedEvents: LocalEvent[];
  selectedScrim?: ScheduledScrim;
  seenEventIds: string[];
}

export interface CollectorPersistence {
  clear(): Promise<void>;
  load(): Promise<PersistedCaptureState | undefined>;
  save(state: PersistedCaptureState): Promise<void>;
}

export interface ScrimStatsCollectorBridge {
  getCapabilities(): Promise<CollectorCapabilities>;
  getStatus(): Promise<CollectorStatus & { scrims: ScheduledScrim[] }>;
  pair(code: string, label: string): Promise<{ scrims: ScheduledScrim[] }>;
  selectScrim(scrimId: string): Promise<void>;
  exportDiagnostics(): Promise<void>;
  onStatus(callback: (status: CollectorStatus) => void): () => void;
}
