import type { LocalEvent, RosterIdentity } from './types';

type ClientTeam = 'ORDER' | 'CHAOS';

export interface TimelineScore {
  kills: number;
  deaths: number;
  assists: number;
}

export interface DerivedCaptureFacts {
  durationSeconds?: number;
  result?: 'win' | 'loss';
  ourTeamKills?: number;
  enemyTeamKills?: number;
  objectives: {
    dragons: Array<{ timestamp: number; team: 'our' | 'enemy'; type?: string }>;
    barons: Array<{ timestamp: number; team: 'our' | 'enemy'; type?: string }>;
    towers: Array<{ timestamp: number; team: 'our' | 'enemy'; position?: string }>;
    inhibitors: Array<{ timestamp: number; team: 'our' | 'enemy'; position?: string }>;
  };
  scoreFor(player: Record<string, unknown>): TimelineScore | undefined;
}

export interface NormalizedPostGame {
  participants: Array<Record<string, unknown>>;
  durationSeconds?: number;
  result?: 'win' | 'loss';
  ourTeamKills?: number;
  enemyTeamKills?: number;
  ourTeamGold?: number;
  enemyTeamGold?: number;
  gameContext?: { mode?: string; map_name?: string; map_number?: number };
}

export type CaptureClassification = 'standard_5v5' | 'nonstandard_custom' | 'incomplete_capture';

export function dedupeEvents(events: LocalEvent[], seen = new Set<string>()) {
  return events.filter((event) => event.event_id && !seen.has(event.event_id));
}

export function riotIdMatches(candidate: string | undefined, rosterId: string | undefined) {
  if (!candidate || !rosterId) return false;
  return candidate.trim().toLocaleLowerCase() === rosterId.trim().toLocaleLowerCase();
}

export function toRiotId(player: Record<string, unknown>) {
  const name = typeof player.riotIdGameName === 'string' ? player.riotIdGameName : player.summonerName;
  const tag = typeof player.riotIdTagLine === 'string' ? player.riotIdTagLine : undefined;
  return typeof name === 'string' ? `${name}${tag ? `#${tag}` : ''}` : undefined;
}

function normalized(value: unknown) {
  return typeof value === 'string' ? value.trim().toLocaleLowerCase() : undefined;
}

function playerAliases(player: Record<string, unknown>) {
  return [player.summonerName, player.riotId, player.riotIdGameName, toRiotId(player)]
    .map(normalized)
    .filter((value): value is string => Boolean(value));
}

function clientTeam(value: unknown): ClientTeam | undefined {
  return value === 'ORDER' || value === 'CHAOS' ? value : undefined;
}

function eventNumber(event: LocalEvent, key: string) {
  const value = event[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function opposingTeam(team: ClientTeam): ClientTeam {
  return team === 'ORDER' ? 'CHAOS' : 'ORDER';
}

/**
 * Derives only facts that the Riot Live Client payload can support without
 * estimating missing values. A completed event timeline supersedes the last
 * polled player score because allgamedata can disappear before GameEnd arrives.
 */
export function deriveCaptureFacts(
  players: Array<Record<string, unknown>>,
  events: LocalEvent[],
  resolvedTeam?: ClientTeam,
  activePlayer?: Record<string, unknown>,
): DerivedCaptureFacts {
  const teamByAlias = new Map<string, ClientTeam>();
  const playerByAlias = new Map<string, Record<string, unknown>>();
  for (const player of players) {
    const team = clientTeam(player.team);
    for (const alias of playerAliases(player)) {
      playerByAlias.set(alias, player);
      if (team) teamByAlias.set(alias, team);
    }
  }

  const scores = new Map<Record<string, unknown>, TimelineScore>();
  const score = (player: Record<string, unknown>) => {
    const existing = scores.get(player) ?? { kills: 0, deaths: 0, assists: 0 };
    scores.set(player, existing);
    return existing;
  };
  const championKills = events.filter((event) => event.event_type === 'ChampionKill' || event.EventName === 'ChampionKill');
  let mappedChampionKills = 0;
  const killsByTeam: Record<ClientTeam, number> = { ORDER: 0, CHAOS: 0 };
  for (const event of championKills) {
    const killer = playerByAlias.get(normalized(event.KillerName) ?? '');
    const victim = playerByAlias.get(normalized(event.VictimName) ?? '');
    if (killer) score(killer).kills += 1;
    if (victim) score(victim).deaths += 1;
    if (Array.isArray(event.Assisters)) {
      for (const assisterName of event.Assisters) {
        const assister = playerByAlias.get(normalized(assisterName) ?? '');
        if (assister) score(assister).assists += 1;
      }
    }
    const killerTeam = teamByAlias.get(normalized(event.KillerName) ?? '');
    if (killerTeam) {
      killsByTeam[killerTeam] += 1;
      mappedChampionKills += 1;
    }
  }

  const gameEnd = [...events].reverse().find((event) => event.event_type === 'GameEnd' || event.EventName === 'GameEnd');
  const activeTeam = activePlayer
    ? playerAliases(activePlayer).flatMap((alias) => teamByAlias.get(alias) ?? [])[0]
    : undefined;
  const rawResult = typeof gameEnd?.Result === 'string' ? gameEnd.Result.trim().toLocaleLowerCase() : undefined;
  let result: 'win' | 'loss' | undefined;
  if (resolvedTeam && activeTeam && (rawResult === 'win' || rawResult === 'lose' || rawResult === 'loss')) {
    const activeWon = rawResult === 'win';
    result = activeTeam === resolvedTeam
      ? activeWon ? 'win' : 'loss'
      : activeWon ? 'loss' : 'win';
  }

  const objectives: DerivedCaptureFacts['objectives'] = { dragons: [], barons: [], towers: [], inhibitors: [] };
  const objectiveEvents = events.filter((event) => ['DragonKill', 'BaronKill', 'HeraldKill', 'TurretKilled', 'InhibKilled'].includes(String(event.event_type ?? event.EventName)));
  for (const event of objectiveEvents) {
    const eventType = String(event.event_type ?? event.EventName);
    let killerTeam = teamByAlias.get(normalized(event.KillerName) ?? '');
    if (!killerTeam && (eventType === 'TurretKilled' || eventType === 'InhibKilled')) {
      const target = String(event[eventType] ?? '');
      if (target.includes('TOrder')) killerTeam = 'CHAOS';
      if (target.includes('TChaos')) killerTeam = 'ORDER';
    }
    const timestamp = eventNumber(event, 'EventTime');
    if (!resolvedTeam || !killerTeam || timestamp === undefined) continue;
    const team = killerTeam === resolvedTeam ? 'our' : 'enemy';
    if (eventType === 'DragonKill') objectives.dragons.push({ timestamp, team, type: typeof event.DragonType === 'string' ? event.DragonType : undefined });
    if (eventType === 'BaronKill' || eventType === 'HeraldKill') objectives.barons.push({ timestamp, team, type: eventType === 'HeraldKill' ? 'Herald' : 'Baron' });
    if (eventType === 'TurretKilled') objectives.towers.push({ timestamp, team, position: typeof event.TurretKilled === 'string' ? event.TurretKilled : undefined });
    if (eventType === 'InhibKilled') objectives.inhibitors.push({ timestamp, team, position: typeof event.InhibKilled === 'string' ? event.InhibKilled : undefined });
  }

  const durationSeconds = events.reduce<number | undefined>((largest, event) => {
    const value = eventNumber(event, 'EventTime');
    return value === undefined ? largest : Math.max(largest ?? 0, value);
  }, undefined);
  const canUseTeamKills = Boolean(resolvedTeam && gameEnd && championKills.length && mappedChampionKills === championKills.length);

  return {
    durationSeconds,
    result,
    ourTeamKills: canUseTeamKills && resolvedTeam ? killsByTeam[resolvedTeam] : undefined,
    enemyTeamKills: canUseTeamKills && resolvedTeam ? killsByTeam[opposingTeam(resolvedTeam)] : undefined,
    objectives,
    scoreFor(player) {
      return gameEnd ? scores.get(player) : undefined;
    },
  };
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function finiteNumber(source: Record<string, unknown>, ...keys: string[]) {
  const stats = record(source.stats);
  for (const key of keys) {
    const value = source[key] ?? stats?.[key];
    if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value);
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Math.round(Number(value));
  }
  return undefined;
}

function postGameRows(payload: Record<string, unknown>) {
  const rows: Array<Record<string, unknown>> = [];
  if (Array.isArray(payload.participants)) {
    for (const value of payload.participants) {
      const participant = record(value);
      if (participant) rows.push(participant);
    }
  }
  if (Array.isArray(payload.teams)) {
    for (const teamValue of payload.teams) {
      const team = record(teamValue);
      if (!team) continue;
      const players = Array.isArray(team.participants) ? team.participants : Array.isArray(team.players) ? team.players : [];
      for (const playerValue of players) {
        const player = record(playerValue);
        if (player) rows.push({ ...player, teamId: player.teamId ?? team.teamId, teamWon: team.isWinningTeam ?? team.win });
      }
    }
  }
  const localPlayer = record(payload.localPlayer);
  if (localPlayer) rows.push({ ...localPlayer, isLocalPlayer: true });
  if (!rows.length && record(payload.stats) && (payload.championName || payload.summonerName || payload.riotIdGameName)) {
    rows.push({ ...payload, isLocalPlayer: true });
  }
  const unique = new Map<string, Record<string, unknown>>();
  rows.forEach((row, index) => {
    const key = String(row.puuid ?? row.participantId ?? row.riotId ?? row.riotIdGameName ?? row.summonerName ?? `row-${index}`).toLocaleLowerCase();
    const previous = unique.get(key);
    unique.set(key, previous ? { ...previous, ...row, stats: row.stats ?? previous.stats } : row);
  });
  return [...unique.values()];
}

function postGameItems(player: Record<string, unknown>): Array<{ id: number; slot: number; name?: string; [key: string]: unknown }> {
  if (Array.isArray(player.items)) return player.items.flatMap((value, slot) => {
    const item = record(value);
    if (item) {
      const id = finiteNumber(item, 'id', 'itemID');
      return id && id > 0 ? [{ ...item, id, slot: finiteNumber(item, 'slot') ?? slot }] : [];
    }
    const id = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : undefined;
    return id && id > 0 ? [{ id, slot }] : [];
  });
  const stats = record(player.stats);
  return Array.from({ length: 7 }, (_, slot) => finiteNumber(player, `item${slot}`, `ITEM${slot}`) ?? finiteNumber(stats ?? {}, `ITEM${slot}`))
    .flatMap((id, slot) => id && id > 0 ? [{ id, name: `Item ${id}`, slot }] : []);
}

function postGameIdentity(player: Record<string, unknown>) {
  const gameName = player.riotIdGameName ?? player.summonerName ?? player.playerName;
  const tagLine = player.riotIdTagLine;
  return typeof gameName === 'string'
    ? { gameName, tagLine: typeof tagLine === 'string' ? tagLine : undefined, full: `${gameName}${typeof tagLine === 'string' ? `#${tagLine}` : ''}` }
    : undefined;
}

export function normalizeRunes(value: unknown) {
  const source = record(value);
  if (!source) return { primary_tree: '', secondary_tree: '', runes: [] as number[], stat_mods: [] as number[] };
  const id = (entry: unknown) => {
    const row = record(entry);
    const candidate = row?.id ?? row?.perk ?? entry;
    const parsed = Number(candidate);
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : undefined;
  };
  const name = (entry: unknown) => {
    const row = record(entry);
    const label = row?.displayName ?? row?.name ?? row?.id ?? entry;
    return typeof label === 'string' || typeof label === 'number' ? String(label) : '';
  };
  if ('primary_tree' in source || 'secondary_tree' in source) return {
    primary_tree: name(source.primary_tree),
    secondary_tree: name(source.secondary_tree),
    runes: (Array.isArray(source.runes) ? source.runes : []).map(id).filter((rune): rune is number => rune !== undefined),
    stat_mods: (Array.isArray(source.stat_mods) ? source.stat_mods : []).map(id).filter((rune): rune is number => rune !== undefined),
  };
  const perks = record(source.perks) ?? source;
  const styles = Array.isArray(perks.styles) ? perks.styles.flatMap(record).filter((style): style is Record<string, unknown> => Boolean(style)) : [];
  const selectedPerks = styles.flatMap((style) => Array.isArray(style.selections) ? style.selections : []).map(id).filter((rune): rune is number => rune !== undefined);
  const statPerks = record(perks.statPerks);
  return {
    primary_tree: name(source.primaryRuneTree ?? styles[0]?.style),
    secondary_tree: name(source.secondaryRuneTree ?? styles[1]?.style),
    runes: selectedPerks.length ? selectedPerks : (Array.isArray(source.generalRunes) ? source.generalRunes : []).map(id).filter((rune): rune is number => rune !== undefined),
    stat_mods: statPerks ? ['offense', 'flex', 'defense'].map((key) => id(statPerks[key])).filter((rune): rune is number => rune !== undefined)
      : (Array.isArray(source.statRunes) ? source.statRunes : []).map(id).filter((rune): rune is number => rune !== undefined),
  };
}

export function normalizeSummonerSpells(value: unknown, player: Record<string, unknown> = {}) {
  const candidates = Array.isArray(value) ? value : (() => {
    const source = record(value) ?? {};
    const named = [source.summonerSpellOne, source.summonerSpellTwo].filter(Boolean);
    return named.length ? named : [player.summoner1Id ?? player.spell1Id, player.summoner2Id ?? player.spell2Id].filter(Boolean);
  })();
  return candidates.slice(0, 2).flatMap((entry, index) => {
    const row = record(entry);
    const id = Number(row?.id ?? entry);
    if (!Number.isFinite(id) || id <= 0) return [];
    const name = row?.displayName ?? row?.name;
    return [{ id: Math.round(id), name: typeof name === 'string' ? name : `Summoner spell ${Math.round(id)}`, slot: index + 1 }];
  });
}

export function normalizePostGame(
  payload: Record<string, unknown>,
  livePlayers: Array<Record<string, unknown>>,
  roster: RosterIdentity[],
  resolvedTeam?: ClientTeam,
  itemNames: Record<string, string> = {},
): NormalizedPostGame {
  const rows = postGameRows(payload);
  const liveByIdentity = new Map<string, Record<string, unknown>>();
  livePlayers.forEach((player) => playerAliases(player).forEach((alias) => liveByIdentity.set(alias, player)));
  const rosterByIdentity = new Map(roster.map((player) => [`${player.riotId}#${player.tagLine}`.trim().toLocaleLowerCase(), player]));
  const resolvedTeamId = resolvedTeam === 'ORDER' ? 100 : resolvedTeam === 'CHAOS' ? 200 : undefined;
  const localRow = rows.find((row) => row.isLocalPlayer === true) ?? record(payload.localPlayer);
  const localTeamId = localRow ? finiteNumber(localRow, 'teamId', 'TEAM_ID') : undefined;
  const ourTeamId = resolvedTeamId ?? localTeamId;
  const participants = rows.map((player) => {
    const identity = postGameIdentity(player);
    const live = identity
      ? liveByIdentity.get(identity.full.toLocaleLowerCase()) ?? liveByIdentity.get(identity.gameName.toLocaleLowerCase())
      : undefined;
    const liveRiotId = live ? toRiotId(live) : undefined;
    const rosterIdentity = identity?.tagLine ? identity.full : liveRiotId ?? identity?.full;
    const rosterPlayer = rosterByIdentity.get((rosterIdentity ?? '').toLocaleLowerCase());
    const teamId = finiteNumber(player, 'teamId', 'TEAM_ID');
    const minions = finiteNumber(player, 'totalMinionsKilled', 'MINIONS_KILLED', 'minionsKilled');
    const neutral = finiteNumber(player, 'neutralMinionsKilled', 'NEUTRAL_MINIONS_KILLED');
    const cs = minions === undefined && neutral === undefined ? undefined : (minions ?? 0) + (neutral ?? 0);
    const championId = finiteNumber(player, 'championId', 'SKIN_ID');
    const championName = player.championName ?? live?.championName ?? (championId ? `Champion ${championId}` : undefined);
    const roleValue = player.detectedTeamPosition ?? player.teamPosition ?? player.individualPosition
      ?? player.selectedPosition ?? player.assignedPosition ?? player.position ?? live?.position;
    const isOurTeam = ourTeamId !== undefined && teamId !== undefined
      ? teamId === ourTeamId
      : rows.length === 1 || player.isLocalPlayer === true;
    return {
      riot_id: identity?.gameName ?? live?.riotIdGameName ?? live?.summonerName,
      riot_tag_line: identity?.tagLine ?? live?.riotIdTagLine,
      summoner_name: identity?.gameName ?? live?.summonerName ?? 'Local Player',
      champion_name: typeof championName === 'string' ? championName : undefined,
      champion_id: championId,
      role: typeof roleValue === 'string' && !['NONE', 'INVALID'].includes(roleValue.toUpperCase()) ? roleValue : undefined,
      is_our_team: isOurTeam,
      player_id: rosterPlayer?.playerId,
      identity_status: rosterPlayer ? 'matched' : 'unresolved',
      kills: finiteNumber(player, 'kills', 'CHAMPIONS_KILLED'),
      deaths: finiteNumber(player, 'deaths', 'NUM_DEATHS'),
      assists: finiteNumber(player, 'assists', 'ASSISTS'),
      cs,
      gold: finiteNumber(player, 'goldEarned', 'GOLD_EARNED'),
      level: finiteNumber(player, 'champLevel', 'CHAMPION_LEVEL', 'LEVEL'),
      damage_dealt: finiteNumber(player, 'totalDamageDealtToChampions', 'TOTAL_DAMAGE_DEALT_TO_CHAMPIONS'),
      damage_taken: finiteNumber(player, 'totalDamageTaken', 'TOTAL_DAMAGE_TAKEN'),
      vision_score: finiteNumber(player, 'visionScore', 'VISION_SCORE'),
      items: postGameItems(player).map((item) => ({
        ...item,
        name: typeof item.name === 'string' ? item.name : itemNames[String(item.id)] ?? `Item ${item.id}`,
      })),
      runes: normalizeRunes(player.runes ?? player.perks ?? live?.runes),
      summoner_spells: normalizeSummonerSpells(player.summonerSpells ?? live?.summonerSpells, player),
      team_id: teamId,
      won: player.win ?? player.teamWon,
      is_bot: player.botPlayer === true,
      advanced_stats: {
        wards_placed: finiteNumber(player, 'wardsPlaced', 'WARD_PLACED'),
        wards_killed: finiteNumber(player, 'wardsKilled', 'WARD_KILLED'),
        control_wards_purchased: finiteNumber(player, 'visionWardsBoughtInGame', 'VISION_WARDS_BOUGHT_IN_GAME'),
        damage_to_objectives: finiteNumber(player, 'damageDealtToObjectives', 'TOTAL_DAMAGE_DEALT_TO_OBJECTIVES'),
        damage_to_turrets: finiteNumber(player, 'damageDealtToTurrets', 'TOTAL_DAMAGE_DEALT_TO_TURRETS'),
        healing: finiteNumber(player, 'totalHeal', 'TOTAL_HEAL'),
        healing_to_teammates: finiteNumber(player, 'totalHealsOnTeammates', 'TOTAL_HEAL_ON_TEAMMATES'),
        shielding_to_teammates: finiteNumber(player, 'totalDamageShieldedOnTeammates', 'TOTAL_DAMAGE_SHIELDED_ON_TEAMMATES'),
        damage_mitigated: finiteNumber(player, 'damageSelfMitigated', 'TOTAL_DAMAGE_SELF_MITIGATED'),
        crowd_control_seconds: finiteNumber(player, 'timeCCingOthers', 'TIME_CCING_OTHERS'),
        time_dead_seconds: finiteNumber(player, 'totalTimeSpentDead', 'TOTAL_TIME_SPENT_DEAD'),
        neutral_cs: neutral,
        ally_jungle_cs: finiteNumber(player, 'neutralMinionsKilledYourJungle', 'NEUTRAL_MINIONS_KILLED_YOUR_JUNGLE'),
        enemy_jungle_cs: finiteNumber(player, 'neutralMinionsKilledEnemyJungle', 'NEUTRAL_MINIONS_KILLED_ENEMY_JUNGLE'),
        largest_multi_kill: finiteNumber(player, 'largestMultiKill', 'LARGEST_MULTI_KILL'),
        largest_killing_spree: finiteNumber(player, 'largestKillingSpree', 'LARGEST_KILLING_SPREE'),
      },
    };
  });
  const teamRows = (ours: boolean) => participants.filter((participant) => participant.is_our_team === ours);
  const total = (team: Array<Record<string, unknown>>, key: string) => {
    const values = team.map((participant) => participant[key]).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    return values.length === team.length && values.length ? values.reduce((sum, value) => sum + value, 0) : undefined;
  };
  const localParticipant = participants.find((participant) => participant.is_our_team && participant.won !== undefined)
    ?? participants.find((participant) => participant.won !== undefined);
  const won = localParticipant?.won;
  const result = won === true || won === 'Win' || won === 'WIN'
    ? 'win'
    : won === false || won === 'Fail' || won === 'Lose' || won === 'LOSS'
      ? 'loss'
      : undefined;
  return {
    participants,
    durationSeconds: finiteNumber(payload, 'gameLength', 'gameDuration', 'GAME_TIME'),
    result,
    ourTeamKills: total(teamRows(true), 'kills'),
    enemyTeamKills: total(teamRows(false), 'kills'),
    ourTeamGold: total(teamRows(true), 'gold'),
    enemyTeamGold: total(teamRows(false), 'gold'),
    gameContext: {
      mode: typeof payload.gameMode === 'string' ? payload.gameMode : undefined,
      map_name: typeof payload.mapName === 'string' ? payload.mapName : undefined,
      map_number: finiteNumber(payload, 'mapId', 'mapNumber'),
    },
  };
}

export function normalizeChampionSelect(
  payload: Record<string, unknown>,
  ourSide: 'blue' | 'red' | undefined,
  postGame?: Record<string, unknown>,
  catalog: Record<string, string> = {},
) {
  const championNames = new Map<number, string>();
  if (postGame) {
    postGameRows(postGame).forEach((player) => {
      const id = finiteNumber(player, 'championId', 'SKIN_ID');
      if (id && typeof player.championName === 'string') championNames.set(id, player.championName);
    });
  }
  Object.entries(catalog).forEach(([id, name]) => championNames.set(Number(id), name));
  const myCells = new Set((Array.isArray(payload.myTeam) ? payload.myTeam : []).flatMap((value) => {
    const player = record(value);
    const cell = player ? finiteNumber(player, 'cellId') : undefined;
    return cell === undefined ? [] : [cell];
  }));
  const theirCells = new Set((Array.isArray(payload.theirTeam) ? payload.theirTeam : []).flatMap((value) => {
    const player = record(value);
    const cell = player ? finiteNumber(player, 'cellId') : undefined;
    return cell === undefined ? [] : [cell];
  }));
  const actions: Array<Record<string, unknown>> = [];
  for (const round of Array.isArray(payload.actions) ? payload.actions : []) {
    if (!Array.isArray(round)) continue;
    for (const value of round) {
      const action = record(value);
      if (action?.completed === true && (action.type === 'pick' || action.type === 'ban')) actions.push(action);
    }
  }
  const opposite = ourSide === 'blue' ? 'red' : ourSide === 'red' ? 'blue' : undefined;
  const sideFor = (action: Record<string, unknown>) => {
    if (action.isAllyAction === true) return ourSide;
    if (action.isAllyAction === false) return opposite;
    const actor = finiteNumber(action, 'actorCellId');
    if (actor !== undefined && myCells.has(actor)) return ourSide;
    if (actor !== undefined && theirCells.has(actor)) return opposite;
    return undefined;
  };
  const normalized = actions.flatMap((action, index) => {
    const championId = finiteNumber(action, 'championId');
    const team = sideFor(action);
    if (!championId || !team) return [];
    return [{
      action_type: action.type,
      order: (() => {
        const value = finiteNumber(action, 'pickTurn');
        return value && value > 0 ? value : index + 1;
      })(),
      team,
      champion: championNames.get(championId) ?? `Unknown champion (${championId})`,
      champion_id: championId,
    }];
  });
  return {
    picks: normalized.filter((action) => action.action_type === 'pick').map((action) => ({ order: action.order, team: action.team, champion: action.champion, champion_id: action.champion_id })),
    bans: normalized.filter((action) => action.action_type === 'ban').map((action) => ({ order: action.order, team: action.team, champion: action.champion, champion_id: action.champion_id })),
    phase: 'completed',
    completed: normalized.length > 0,
  };
}

export function classifyCapture(
  participants: Array<Record<string, unknown>>,
  postGameCaptured: boolean,
  result?: string,
  durationSeconds?: number,
) {
  const ours = participants.filter((participant) => participant.is_our_team === true);
  const enemy = participants.filter((participant) => participant.is_our_team !== true);
  const botsPresent = participants.some((participant) => participant.is_bot === true);
  const rosterCoverage = ours.filter((participant) => typeof participant.player_id === 'string').length;
  const flags = [
    !postGameCaptured ? 'missing_post_game' : null,
    ours.length !== 5 || enemy.length !== 5 ? 'non_5v5' : null,
    botsPresent ? 'bots_present' : null,
    rosterCoverage < ours.length ? 'incomplete_roster_match' : null,
    !result ? 'missing_result' : null,
    !durationSeconds ? 'missing_duration' : null,
  ].filter((value): value is string => Boolean(value));
  let classification: CaptureClassification = 'standard_5v5';
  if (!postGameCaptured || !ours.length || !enemy.length || !result || !durationSeconds) classification = 'incomplete_capture';
  else if (ours.length !== 5 || enemy.length !== 5 || botsPresent) classification = 'nonstandard_custom';
  return {
    classification,
    flags,
    roster_coverage: rosterCoverage,
    our_participants: ours.length,
    enemy_participants: enemy.length,
    bots_present: botsPresent,
  };
}

export function normalizeTimelineEvents(
  events: LocalEvent[],
  players: Array<Record<string, unknown>>,
  resolvedTeam?: ClientTeam,
) {
  const teamByAlias = new Map<string, ClientTeam>();
  players.forEach((player) => {
    const team = clientTeam(player.team);
    if (team) playerAliases(player).forEach((alias) => teamByAlias.set(alias, team));
  });
  return events.map((event) => {
    const eventType = String(event.event_type ?? event.EventName ?? 'Unknown');
    const actor = typeof event.KillerName === 'string' ? event.KillerName
      : typeof event.Recipient === 'string' ? event.Recipient
        : typeof event.Acer === 'string' ? event.Acer : undefined;
    let eventTeam = actor ? teamByAlias.get(normalized(actor) ?? '') : undefined;
    const mapObject = typeof event.TurretKilled === 'string' ? event.TurretKilled
      : typeof event.InhibKilled === 'string' ? event.InhibKilled : undefined;
    if (!eventTeam && mapObject) {
      if (mapObject.includes('TOrder')) eventTeam = 'CHAOS';
      if (mapObject.includes('TChaos')) eventTeam = 'ORDER';
    }
    return {
      event_id: event.event_id,
      sequence: event.sequence,
      occurred_at: event.occurred_at,
      event_type: eventType,
      occurred_seconds: eventNumber(event, 'EventTime'),
      team: resolvedTeam && eventTeam ? eventTeam === resolvedTeam ? 'our' : 'enemy' : 'neutral',
      actor_name: actor,
      victim_name: typeof event.VictimName === 'string' ? event.VictimName : undefined,
      objective_type: typeof event.DragonType === 'string' ? event.DragonType
        : eventType === 'HeraldKill' ? 'Herald' : eventType === 'BaronKill' ? 'Baron' : undefined,
      map_object: mapObject,
    } satisfies LocalEvent;
  });
}

export function resolveRosterTeam(
  players: Array<Record<string, unknown>>,
  roster: RosterIdentity[],
) {
  const rosterByIdentity = new Map(
    roster.map((player) => [
      `${player.riotId}#${player.tagLine}`.trim().toLocaleLowerCase(),
      player,
    ]),
  );
  const matched = players.map((player) => {
    const riotId = toRiotId(player);
    return {
      raw: player,
      riotId,
      roster: riotId ? rosterByIdentity.get(riotId.trim().toLocaleLowerCase()) : undefined,
    };
  });
  const orderMatches = matched.filter((player) => player.roster && player.raw.team === 'ORDER').length;
  const chaosMatches = matched.filter((player) => player.roster && player.raw.team === 'CHAOS').length;
  const team = orderMatches > 0 && chaosMatches === 0
    ? 'ORDER'
    : chaosMatches > 0 && orderMatches === 0
      ? 'CHAOS'
      : undefined;
  return {
    matched,
    team,
    status: team ? 'matched' : orderMatches || chaosMatches ? 'ambiguous' : 'unmatched',
  } as const;
}
