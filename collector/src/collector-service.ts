import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { completeSession, heartbeat, sendEvents, startSession } from './api-client';
import { classifyCapture, dedupeEvents, deriveCaptureFacts, normalizeChampionSelect, normalizePostGame, normalizeRunes, normalizeSummonerSpells, normalizeTimelineEvents, resolveRosterTeam } from './collector-utils';
import { firstLeagueUxResponse, leagueCatalog, leagueUxRequest } from './league-client';
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
  private championSelect?: Record<string, unknown>;
  private championCatalog: Record<string, string> = {};
  private itemCatalog: Record<string, string> = {};
  private postGame?: Record<string, unknown>;
  private postGameWaitStartedAt?: number;
  private roster: RosterIdentity[] = [];
  private recordingArmed = false;
  private timer?: NodeJS.Timeout;
  private misses = 0;
  private polling = false;
  private status: CollectorStatus = { state: 'unpaired', message: 'Connect this computer to your team.', recordingArmed: false, queueDepth: 0 };

  constructor(private readonly persistence?: CollectorPersistence) {
    super();
  }

  async restore() {
    const saved = await this.persistence?.load();
    if (!saved) return;
    this.captureSessionId = saved.captureSessionId;
    this.clientSessionId = saved.clientSessionId;
    this.championSelect = saved.championSelect;
    this.championCatalog = saved.championCatalog ?? {};
    this.itemCatalog = saved.itemCatalog ?? {};
    this.lastSnapshot = saved.lastSnapshot;
    this.postGame = saved.postGame;
    this.postGameWaitStartedAt = saved.postGameWaitStartedAt;
    this.selectedScrim = saved.selectedScrim;
    this.queuedEvents = saved.queuedEvents;
    this.capturedEvents = saved.capturedEvents;
    this.recordingArmed = saved.recordingArmed ?? false;
    this.seen = new Set(saved.seenEventIds);
    this.setStatus({
      state: this.captureSessionId ? 'retrying' : 'ready',
      message: this.captureSessionId ? 'Recovered a game that is waiting to be saved. It will resume when League is available.' : 'Your previous Game Capture selection was restored.',
      recordingArmed: this.recordingArmed,
      selectedScrim: this.selectedScrim,
      queueDepth: this.queuedEvents.length,
    });
  }
  setCredential(credential: Credential) {
    this.credential = credential;
    this.setStatus({
      state: this.captureSessionId ? 'retrying' : 'ready',
      message: this.captureSessionId ? 'The previous game is ready to finish saving.' : this.readyMessage(),
      recordingArmed: this.recordingArmed,
      selectedScrim: this.selectedScrim,
      queueDepth: this.queuedEvents.length,
    });
  }
  setRoster(roster: RosterIdentity[]) { this.roster = roster; }
  selectScrim(scrim?: ScheduledScrim) {
    if (this.captureSessionId) throw new Error('The scrim block cannot be changed while a game is being captured.');
    this.selectedScrim = scrim;
    this.recordingArmed = false;
    this.championSelect = undefined;
    this.postGame = undefined;
    this.postGameWaitStartedAt = undefined;
    void this.persist();
    this.setStatus({ state: this.credential ? 'ready' : 'unpaired', message: this.readyMessage(), selectedScrim: scrim, recordingArmed: false, queueDepth: this.queuedEvents.length });
  }
  setRecordingEnabled(enabled: boolean) {
    if (enabled && !this.selectedScrim) throw new Error('Choose a scrim block before starting capture.');
    this.recordingArmed = enabled;
    if (!enabled && !this.captureSessionId) this.championSelect = undefined;
    void this.persist();
    const currentCapture = Boolean(this.captureSessionId);
    this.setStatus({
      state: currentCapture ? 'capturing' : this.credential ? 'ready' : 'unpaired',
      message: currentCapture
        ? enabled ? 'Game detected. This game and the next game in the block will be saved automatically.' : 'Game detected. This game will finish saving, then capture will stop.'
        : this.readyMessage(),
      selectedScrim: this.selectedScrim,
      recordingArmed: enabled,
      queueDepth: this.queuedEvents.length,
    });
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
      championSelect: this.championSelect,
      championCatalog: this.championCatalog,
      itemCatalog: this.itemCatalog,
      clientSessionId: this.clientSessionId,
      lastSnapshot: this.lastSnapshot,
      postGame: this.postGame,
      postGameWaitStartedAt: this.postGameWaitStartedAt,
      queuedEvents: this.queuedEvents,
      recordingArmed: this.recordingArmed,
      selectedScrim: this.selectedScrim,
      seenEventIds: [...this.seen],
    };
    if (!state.captureSessionId && !state.queuedEvents.length && !state.selectedScrim && !state.recordingArmed) {
      await this.persistence.clear();
      return;
    }
    await this.persistence.save(state);
  }
  private async poll() {
    if (!this.credential || this.polling) return;
    this.polling = true;
    try {
      try { await heartbeat(this.credential); } catch { /* capture continues while offline */ }
      await this.captureChampionSelect();
      try {
        const [game, eventData] = await Promise.all([leagueClientRequest('/liveclientdata/allgamedata'), leagueClientRequest('/liveclientdata/eventdata')]);
        this.misses = 0;
        const snapshot = game as Record<string, unknown>;
        this.lastSnapshot = snapshot;
        if (!this.captureSessionId && this.selectedScrim && this.recordingArmed) await this.begin(snapshot);
        if (this.captureSessionId) await this.flushEvents(eventData);
      } catch {
        this.misses += 1;
        // Two missed polls avoids finalizing because of a momentary game-client restart.
        if (this.captureSessionId && this.lastSnapshot && this.misses >= 2) await this.capturePostGameOrTimeout();
      }
    } finally {
      this.polling = false;
    }
  }
  private async captureChampionSelect() {
    if (!this.recordingArmed || !this.selectedScrim || this.captureSessionId) return;
    try {
      const [response, champions, items] = await Promise.all([
        leagueUxRequest('/lol-champ-select/v1/session'),
        leagueUxRequest('/lol-game-data/assets/v1/champion-summary.json').catch(() => []),
        leagueUxRequest('/lol-game-data/assets/v1/items.json').catch(() => []),
      ]);
      if (!response || typeof response !== 'object') return;
      this.championSelect = response as Record<string, unknown>;
      this.championCatalog = leagueCatalog(champions);
      this.itemCatalog = leagueCatalog(items);
      await this.persist();
      this.setStatus({ state: 'ready', message: 'Champion select detected. Waiting for the custom game to load.', selectedScrim: this.selectedScrim, recordingArmed: true, queueDepth: this.queuedEvents.length });
    } catch {
      // No active champion select is the normal ready state.
    }
  }
  private async capturePostGameOrTimeout() {
    if (!this.captureSessionId || !this.lastSnapshot) return;
    if (this.postGame) {
      await this.finish();
      return;
    }
    this.postGameWaitStartedAt ??= Date.now();
    this.setStatus({ state: 'finalizing', message: 'Game ended. Waiting for the League post-game screen before saving.', selectedScrim: this.selectedScrim, recordingArmed: this.recordingArmed, queueDepth: this.queuedEvents.length });
    const response = await firstLeagueUxResponse([
      '/lol-end-of-game/v1/eog-stats-block',
      '/lol-end-of-game/v1/gameclient-eog-stats-block',
    ]);
    if (response) {
      this.postGame = response;
      await this.persist();
      await this.finish();
      return;
    }
    if (Date.now() - this.postGameWaitStartedAt >= 120_000) await this.finish();
  }
  private async begin(snapshot: Record<string, unknown>) {
    if (!this.credential || !this.selectedScrim) return;
    const gameData = snapshot.gameData as Record<string, unknown> | undefined;
    const localGameId = String(gameData?.gameId ?? gameData?.gameStartTime ?? Date.now());
    this.clientSessionId = randomUUID();
    const session = await startSession(this.credential, this.selectedScrim.id, this.clientSessionId, localGameId);
    this.captureSessionId = session.capture_session_id;
    await this.persist();
    this.setStatus({ state: 'capturing', message: 'Custom game detected. Game Capture is running in the background.', selectedScrim: this.selectedScrim, recordingArmed: this.recordingArmed, queueDepth: 0 });
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
      this.setStatus({ state: 'retrying', message: 'The internet connection is unavailable. Your game is safe on this computer and will upload automatically.', selectedScrim: this.selectedScrim, recordingArmed: this.recordingArmed, queueDepth: this.queuedEvents.length });
    }
  }
  private async finish() {
    if (!this.credential || !this.captureSessionId || !this.lastSnapshot) return;
    try {
      if (this.queuedEvents.length) await sendEvents(this.credential, this.captureSessionId, this.queuedEvents.splice(0));
      const final = this.summarise(this.lastSnapshot);
      await completeSession(this.credential, this.captureSessionId, final);
      const fullPackage = Boolean(this.postGame);
      this.setStatus({ state: 'ready', message: fullPackage
        ? this.recordingArmed ? 'Game saved. Ready for the next custom game in this block.' : 'Game saved. Capture is off.'
        : this.recordingArmed ? 'Game saved without the League post-game statistics. Ready for the next game.' : 'Game saved without the League post-game statistics. Capture is off.', selectedScrim: this.selectedScrim, recordingArmed: this.recordingArmed, lastCaptureAt: new Date().toISOString(), queueDepth: 0 });
      this.captureSessionId = undefined; this.clientSessionId = undefined; this.lastSnapshot = undefined; this.seen.clear(); this.capturedEvents = [];
      this.championSelect = undefined; this.postGame = undefined; this.postGameWaitStartedAt = undefined;
      await this.persist();
    } catch { this.setStatus({ state: 'retrying', message: 'Your game is waiting to upload and will retry automatically.', selectedScrim: this.selectedScrim, recordingArmed: this.recordingArmed, queueDepth: this.queuedEvents.length }); }
  }
  private readyMessage() {
    if (!this.credential) return 'Connect this computer to your team.';
    if (!this.selectedScrim) return 'Connected. Choose the scrim block you are about to play.';
    return this.recordingArmed
      ? `Ready for champion select against ${this.selectedScrim.opponent_name}.`
      : `${this.selectedScrim.opponent_name} is selected. Start capture before champion select.`;
  }
  private summarise(snapshot: Record<string, unknown>): FinalSnapshot {
    const gameData = (snapshot.gameData ?? {}) as Record<string, unknown>;
    const activePlayer = snapshot.activePlayer && typeof snapshot.activePlayer === 'object'
      ? snapshot.activePlayer as Record<string, unknown>
      : undefined;
    const active = Array.isArray(snapshot.allPlayers) ? snapshot.allPlayers as Array<Record<string, unknown>> : [];
    const resolution = resolveRosterTeam(active, this.roster);
    const withMatches = resolution.matched;
    const resolvedTeam = resolution.team;
    const facts = deriveCaptureFacts(active, this.capturedEvents, resolvedTeam, activePlayer);
    const postGame = this.postGame ? normalizePostGame(this.postGame, active, this.roster, resolvedTeam, this.itemCatalog) : undefined;
    const gameTime = typeof gameData.gameTime === 'number' ? Math.round(gameData.gameTime) : undefined;
    const objectiveCount = Object.values(facts.objectives).reduce((total, rows) => total + rows.length, 0);
    const teamGold = (team: 'ORDER' | 'CHAOS') => {
      const values = active
        .filter((player) => player.team === team)
        .map((player) => player.totalGold)
        .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
      return values.length === active.filter((player) => player.team === team).length && values.length
        ? Math.round(values.reduce((total, value) => total + value, 0))
        : undefined;
    };
    const participants = postGame?.participants.length ? postGame.participants : withMatches.map(({ raw: player, riotId, roster }) => {
      const timelineScore = facts.scoreFor(player);
      const scores = (player.scores ?? {}) as Record<string, unknown>;
      return {
        riot_id: typeof player.riotIdGameName === 'string' ? player.riotIdGameName : player.summonerName,
        riot_tag_line: typeof player.riotIdTagLine === 'string' ? player.riotIdTagLine : undefined,
        summoner_name: player.summonerName,
        champion_name: player.championName,
        role: player.position,
        is_our_team: resolvedTeam ? player.team === resolvedTeam : false,
        player_id: roster?.playerId,
        identity_status: roster ? 'matched' : 'unresolved',
        captured_riot_identity: riotId,
        kills: timelineScore?.kills ?? scores.kills,
        deaths: timelineScore?.deaths ?? scores.deaths,
        assists: timelineScore?.assists ?? scores.assists,
        cs: scores.creepScore,
        level: player.level,
        gold: player.totalGold,
        vision_score: scores.wardScore,
        items: player.items,
        runes: normalizeRunes(player.runes),
        summoner_spells: normalizeSummonerSpells(player.summonerSpells, player),
        is_bot: player.botPlayer === true,
        advanced_stats: {},
      };
    });
    const durationSeconds = postGame?.durationSeconds ?? (Math.max(gameTime ?? 0, Math.round(facts.durationSeconds ?? 0)) || undefined);
    const result = postGame?.result ?? facts.result;
    return {
      local_game_id: String(gameData.gameId ?? gameData.gameStartTime ?? this.clientSessionId),
      schema_version: 5,
      identity_resolution_status: resolution.status,
      started_at: typeof gameData.gameStartTime === 'number'
        ? new Date(gameData.gameStartTime * 1000).toISOString()
        : undefined,
      ended_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
      result,
      side: resolvedTeam === 'ORDER' ? 'blue' : resolvedTeam === 'CHAOS' ? 'red' : undefined,
      our_team_kills: postGame?.ourTeamKills ?? facts.ourTeamKills,
      enemy_team_kills: postGame?.enemyTeamKills ?? facts.enemyTeamKills,
      our_team_gold: postGame?.ourTeamGold ?? (resolvedTeam ? teamGold(resolvedTeam) : undefined),
      enemy_team_gold: postGame?.enemyTeamGold ?? (resolvedTeam ? teamGold(resolvedTeam === 'ORDER' ? 'CHAOS' : 'ORDER') : undefined),
      objectives: objectiveCount ? facts.objectives : undefined,
      draft: this.championSelect ? normalizeChampionSelect(
        this.championSelect,
        resolvedTeam === 'ORDER' ? 'blue' : resolvedTeam === 'CHAOS' ? 'red' : undefined,
        this.postGame,
        this.championCatalog,
      ) : undefined,
      capture_features: {
        champion_select: Boolean(this.championSelect),
        post_game: Boolean(this.postGame),
      },
      capture_quality: classifyCapture(participants, Boolean(this.postGame), result, durationSeconds),
      game_context: {
        mode: postGame?.gameContext?.mode ?? (typeof gameData.gameMode === 'string' ? gameData.gameMode : undefined),
        map_name: postGame?.gameContext?.map_name ?? (typeof gameData.mapName === 'string' ? gameData.mapName : undefined),
        map_number: postGame?.gameContext?.map_number ?? (typeof gameData.mapNumber === 'number' ? gameData.mapNumber : undefined),
        map_terrain: typeof gameData.mapTerrain === 'string' ? gameData.mapTerrain : undefined,
        patch: typeof gameData.gameVersion === 'string' ? gameData.gameVersion : undefined,
      },
      participants,
      timeline: normalizeTimelineEvents(this.capturedEvents, active, resolvedTeam),
    };
  }
}
