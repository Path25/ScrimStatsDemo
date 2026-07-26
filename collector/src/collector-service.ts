import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { completeSession, heartbeat, sendEvents, startSession } from './api-client';
import { dedupeEvents, resolveRosterTeam } from './collector-utils';
import { leagueClientRequest } from './local-client';
import type { CollectorPersistence, CollectorStatus, Credential, FinalSnapshot, LocalEvent, PersistedCaptureState, RosterIdentity, ScheduledScrim } from './types';

export class CollectorService extends EventEmitter {
  private credential?: Credential;
  private selectedScrim?: ScheduledScrim;
  private captureSessionId?: string;
  private clientSessionId?: string;
  private lastSnapshot?: Record<string, unknown>;
  private seen = new Set<string>();
  private queuedEvents: LocalEvent[] = [];
  private capturedEvents: LocalEvent[] = [];
  private roster: RosterIdentity[] = [];
  private timer?: NodeJS.Timeout;
  private misses = 0;
  private status: CollectorStatus = { state: 'unpaired', message: 'Pair this computer to an invited team.', queueDepth: 0 };

  constructor(private readonly persistence?: CollectorPersistence) {
    super();
  }

  async restore() {
    const saved = await this.persistence?.load();
    if (!saved) return;
    this.captureSessionId = saved.captureSessionId;
    this.clientSessionId = saved.clientSessionId;
    this.lastSnapshot = saved.lastSnapshot;
    this.selectedScrim = saved.selectedScrim;
    this.queuedEvents = saved.queuedEvents;
    this.capturedEvents = saved.capturedEvents;
    this.seen = new Set(saved.seenEventIds);
    this.setStatus({
      state: this.captureSessionId ? 'retrying' : 'ready',
      message: this.captureSessionId ? 'Recovered a pending capture. It will resume when League is available.' : 'Recovered queued capture data.',
      selectedScrim: this.selectedScrim,
      queueDepth: this.queuedEvents.length,
    });
  }
  setCredential(credential: Credential) {
    this.credential = credential;
    this.setStatus({
      state: this.captureSessionId ? 'retrying' : 'ready',
      message: this.captureSessionId ? 'Recovered capture is ready to resume.' : 'Paired. Choose the scheduled scrim to capture.',
      selectedScrim: this.selectedScrim,
      queueDepth: this.queuedEvents.length,
    });
  }
  setRoster(roster: RosterIdentity[]) { this.roster = roster; }
  selectScrim(scrim?: ScheduledScrim) {
    this.selectedScrim = scrim;
    void this.persist();
    this.setStatus({ state: this.credential ? 'ready' : 'unpaired', message: scrim ? `Ready for ${scrim.opponent_name}.` : 'Choose a scheduled scrim.', selectedScrim: scrim, queueDepth: this.queuedEvents.length });
  }
  getStatus() { return this.status; }
  start() { if (!this.timer) this.timer = setInterval(() => void this.poll(), 2_000); void this.poll(); }
  stop() { if (this.timer) clearInterval(this.timer); this.timer = undefined; }
  private setStatus(next: CollectorStatus) { this.status = next; this.emit('status', next); }
  private async persist() {
    if (!this.persistence) return;
    const state: PersistedCaptureState = {
      captureSessionId: this.captureSessionId,
      capturedEvents: this.capturedEvents,
      clientSessionId: this.clientSessionId,
      lastSnapshot: this.lastSnapshot,
      queuedEvents: this.queuedEvents,
      selectedScrim: this.selectedScrim,
      seenEventIds: [...this.seen],
    };
    if (!state.captureSessionId && !state.queuedEvents.length && !state.selectedScrim) {
      await this.persistence.clear();
      return;
    }
    await this.persistence.save(state);
  }
  private async poll() {
    if (!this.credential) return;
    try { await heartbeat(this.credential); } catch { /* capture continues while offline */ }
    try {
      const [game, eventData] = await Promise.all([leagueClientRequest('/liveclientdata/allgamedata'), leagueClientRequest('/liveclientdata/eventdata')]);
      this.misses = 0;
      const snapshot = game as Record<string, unknown>;
      this.lastSnapshot = snapshot;
      if (!this.captureSessionId && this.selectedScrim) await this.begin(snapshot);
      if (this.captureSessionId) await this.flushEvents(eventData);
    } catch {
      this.misses += 1;
      // Two missed polls avoids completing because of a momentary client restart.
      if (this.captureSessionId && this.lastSnapshot && this.misses >= 2) await this.finish();
    }
  }
  private async begin(snapshot: Record<string, unknown>) {
    if (!this.credential || !this.selectedScrim) return;
    const gameData = snapshot.gameData as Record<string, unknown> | undefined;
    const localGameId = String(gameData?.gameId ?? gameData?.gameStartTime ?? Date.now());
    this.clientSessionId = randomUUID();
    const session = await startSession(this.credential, this.selectedScrim.id, this.clientSessionId, localGameId);
    this.captureSessionId = session.capture_session_id;
    await this.persist();
    this.setStatus({ state: 'capturing', message: 'League game detected. Capturing in the background.', selectedScrim: this.selectedScrim, queueDepth: 0 });
  }
  private async flushEvents(payload: unknown) {
    if (!this.credential || !this.captureSessionId) return;
    const raw = (payload as { Events?: Array<Record<string, unknown>> }).Events ?? [];
    const candidates = raw.map((event, index) => ({ ...event, event_id: String(event.EventID ?? event.EventName ?? `${event.EventTime}-${index}`), sequence: Number(event.EventID ?? index), occurred_at: typeof event.EventTime === 'number' ? new Date(event.EventTime * 1000).toISOString() : undefined, event_type: String(event.EventName ?? 'unknown') }));
    const fresh = dedupeEvents(candidates, this.seen);
    fresh.forEach((event) => this.seen.add(event.event_id));
    this.queuedEvents.push(...fresh);
    this.capturedEvents.push(...fresh);
    await this.persist();
    if (!this.queuedEvents.length) return;
    const batch = this.queuedEvents.splice(0, 250);
    try {
      await sendEvents(this.credential, this.captureSessionId, batch);
      await this.persist();
    }
    catch {
      this.queuedEvents.unshift(...batch);
      this.setStatus({ state: 'retrying', message: 'Network unavailable. Capture is queued locally.', selectedScrim: this.selectedScrim, queueDepth: this.queuedEvents.length });
    }
  }
  private async finish() {
    if (!this.credential || !this.captureSessionId || !this.lastSnapshot) return;
    try {
      if (this.queuedEvents.length) await sendEvents(this.credential, this.captureSessionId, this.queuedEvents.splice(0));
      const final = this.summarise(this.lastSnapshot);
      await completeSession(this.credential, this.captureSessionId, final);
      this.setStatus({ state: 'ready', message: 'Post-game package uploaded.', selectedScrim: this.selectedScrim, lastCaptureAt: new Date().toISOString(), queueDepth: 0 });
      this.captureSessionId = undefined; this.clientSessionId = undefined; this.lastSnapshot = undefined; this.seen.clear(); this.capturedEvents = [];
      await this.persist();
    } catch (error) { this.setStatus({ state: 'retrying', message: `Upload queued: ${(error as Error).message}`, selectedScrim: this.selectedScrim, queueDepth: this.queuedEvents.length }); }
  }
  private summarise(snapshot: Record<string, unknown>): FinalSnapshot {
    const gameData = (snapshot.gameData ?? {}) as Record<string, unknown>;
    const active = Array.isArray(snapshot.allPlayers) ? snapshot.allPlayers as Array<Record<string, unknown>> : [];
    const resolution = resolveRosterTeam(active, this.roster);
    const withMatches = resolution.matched;
    const resolvedTeam = resolution.team;
    return {
      local_game_id: String(gameData.gameId ?? gameData.gameStartTime ?? this.clientSessionId),
      schema_version: 2,
      identity_resolution_status: resolution.status,
      started_at: typeof gameData.gameStartTime === 'number'
        ? new Date(gameData.gameStartTime * 1000).toISOString()
        : undefined,
      ended_at: new Date().toISOString(),
      duration_seconds: typeof gameData.gameTime === 'number' ? Math.round(gameData.gameTime) : undefined,
      side: resolvedTeam === 'ORDER' ? 'blue' : resolvedTeam === 'CHAOS' ? 'red' : undefined,
      participants: withMatches.map(({ raw: player, riotId, roster }) => ({
        riot_id: typeof player.riotIdGameName === 'string' ? player.riotIdGameName : player.summonerName,
        riot_tag_line: typeof player.riotIdTagLine === 'string' ? player.riotIdTagLine : undefined,
        summoner_name: player.summonerName,
        champion_name: player.championName,
        role: player.position,
        is_our_team: resolvedTeam ? player.team === resolvedTeam : false,
        player_id: roster?.playerId,
        identity_status: roster ? 'matched' : 'unresolved',
        captured_riot_identity: riotId,
        kills: (player.scores as Record<string, unknown>)?.kills,
        deaths: (player.scores as Record<string, unknown>)?.deaths,
        assists: (player.scores as Record<string, unknown>)?.assists,
        cs: (player.scores as Record<string, unknown>)?.creepScore,
        level: player.level,
        gold: player.totalGold ?? player.currentGold,
        items: player.items,
        runes: player.runes,
        summoner_spells: player.summonerSpells,
      })),
      timeline: this.capturedEvents,
    };
  }
}
