export type CaptureProfile = "desktop_manual" | "grid_manual";
export type EvidenceProvider = "manual" | "desktop_collector" | "grid";
export type EvidenceCapability =
  | "result"
  | "draft"
  | "participant_stats"
  | "timeline"
  | "objectives"
  | "position_samples"
  | "movement_detail"
  | "champion_select"
  | "post_game_stats"
  | "coach_review";

export interface TeamAnalyticsGame {
  id: string;
  scrim_id: string;
  game_number: number;
  played_at: string;
  opponent_team_id: string | null;
  opponent_name: string;
  format: string | null;
  result: "win" | "loss" | "draw" | null;
  side: "blue" | "red" | null;
  duration_seconds: number | null;
  our_team_kills: number | null;
  enemy_team_kills: number | null;
  our_team_gold: number | null;
  enemy_team_gold: number | null;
  performance_rating: number | null;
  early_game_rating: number | null;
  mid_game_rating: number | null;
  late_game_rating: number | null;
  provider: EvidenceProvider;
  capabilities: EvidenceCapability[];
  payload_version: string | null;
  captured_at: string | null;
  patch: string | null;
  game_mode?: string | null;
  map_name?: string | null;
  map_number?: number | null;
  game_classification: "standard_5v5" | "nonstandard_custom" | "incomplete_capture" | null;
  quality_flags: string[];
  roster_coverage: number;
  score_eligible: boolean;
}

export interface ParticipantAdvancedStats {
  wards_placed?: number;
  wards_killed?: number;
  control_wards_purchased?: number;
  damage_to_objectives?: number;
  damage_to_turrets?: number;
  healing?: number;
  healing_to_teammates?: number;
  shielding_to_teammates?: number;
  damage_mitigated?: number;
  crowd_control_seconds?: number;
  time_dead_seconds?: number;
  neutral_cs?: number;
  ally_jungle_cs?: number;
  enemy_jungle_cs?: number;
  largest_multi_kill?: number;
  largest_killing_spree?: number;
}

export interface TeamAnalyticsParticipant {
  scrim_game_id: string;
  player_id: string | null;
  summoner_name: string;
  champion_name: string | null;
  role: string | null;
  is_our_team: boolean;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  cs: number | null;
  gold: number | null;
  damage_dealt: number | null;
  damage_taken: number | null;
  vision_score: number | null;
  level?: number | null;
  is_bot?: boolean;
  items?: unknown[];
  runes?: unknown;
  summoner_spells?: unknown;
  advanced_stats?: ParticipantAdvancedStats;
}

export interface TeamAnalyticsEvent {
  scrim_game_id: string;
  event_id: string;
  sequence: number;
  occurred_seconds: number | null;
  event_type: string;
  team: "our" | "enemy" | "neutral";
  actor_name: string | null;
  victim_name: string | null;
  objective_type: string | null;
  map_object: string | null;
}

export interface TeamAnalyticsDraft {
  scrim_game_id: string;
  our_team_side: "blue" | "red" | null;
  picks: Array<{ champion: string; champion_id?: number; order: number; team: "blue" | "red" }>;
  bans: Array<{ champion: string; champion_id?: number; order: number; team: "blue" | "red" }>;
  completed: boolean;
}

export interface TeamAnalyticsDataset {
  contract_version: "team-analytics-v2" | "team-analytics-v3";
  date_from: string;
  date_to: string;
  capture_profile: CaptureProfile;
  games: TeamAnalyticsGame[];
  participants: TeamAnalyticsParticipant[];
  events: TeamAnalyticsEvent[];
  drafts: TeamAnalyticsDraft[];
  filter_options: {
    opponents: Array<{ key: string; name: string }>;
    formats: string[];
    patches: string[];
    game_modes?: string[];
    maps?: Array<{ map_number: number | null; map_name: string }>;
    classifications?: Array<"standard_5v5" | "nonstandard_custom" | "incomplete_capture">;
  };
}

export interface TeamAnalyticsFilters {
  opponentKey?: string;
  side?: "blue" | "red";
  format?: string;
  result?: "win" | "loss" | "draw";
  patch?: string;
  gameMode?: string;
  provider?: EvidenceProvider;
  completeness?: "core" | "advanced";
  playerId?: string;
  classification?: "standard_5v5" | "nonstandard_custom" | "incomplete_capture";
}

export interface MetricValue {
  value: number | null;
  samples: number;
  gameIds: string[];
}

export interface PlayerAnalyticsRow {
  key: string;
  playerId: string | null;
  name: string;
  games: number;
  wins: number;
  champions: Array<{ champion: string; games: number }>;
  kda: MetricValue;
  csPerMinute: MetricValue;
  goldPerMinute: MetricValue;
  damageShare: MetricValue;
  visionPerMinute: MetricValue;
  killParticipation: MetricValue;
  damagePerMinute: MetricValue;
  damageTakenPerMinute: MetricValue;
  wardsPerMinute: MetricValue;
  objectiveDamagePerMinute: MetricValue;
  crowdControlPerMinute: MetricValue;
  timeDeadPercent: MetricValue;
  gameIds: string[];
}

export interface DraftAnalyticsRow {
  key: string;
  label: string;
  detail: string;
  games: number;
  wins: number;
  gameIds: string[];
}

const coreCapabilities: EvidenceCapability[] = ["result", "participant_stats"];
const advancedCapabilities: EvidenceCapability[] = [
  "timeline",
  "objectives",
  "champion_select",
  "post_game_stats",
  "position_samples",
  "movement_detail",
];

function opponentKey(game: TeamAnalyticsGame) {
  return game.opponent_team_id || `name:${game.opponent_name.toLowerCase()}`;
}

function hasAll(game: TeamAnalyticsGame, capabilities: EvidenceCapability[]) {
  return capabilities.every((capability) => game.capabilities.includes(capability));
}

export function filterTeamAnalytics(
  dataset: TeamAnalyticsDataset,
  filters: TeamAnalyticsFilters,
) {
  const playerGames = filters.playerId
    ? new Set(
        dataset.participants
          .filter((row) => row.is_our_team && (row.player_id || row.summoner_name) === filters.playerId)
          .map((row) => row.scrim_game_id),
      )
    : null;
  const games = dataset.games.filter((game) => {
    if (filters.opponentKey && opponentKey(game) !== filters.opponentKey) return false;
    if (filters.side && game.side !== filters.side) return false;
    if (filters.format && game.format !== filters.format) return false;
    if (filters.result && game.result !== filters.result) return false;
    if (filters.patch && game.patch !== filters.patch) return false;
    if (filters.gameMode && game.game_mode !== filters.gameMode) return false;
    if (filters.provider && game.provider !== filters.provider) return false;
    if (filters.classification && game.game_classification !== filters.classification) return false;
    if (filters.completeness === "core" && !hasAll(game, coreCapabilities)) return false;
    if (filters.completeness === "advanced" && !advancedCapabilities.some((item) => game.capabilities.includes(item))) return false;
    if (playerGames && !playerGames.has(game.id)) return false;
    return true;
  });
  const gameIds = new Set(games.map((game) => game.id));
  return {
    ...dataset,
    games,
    participants: dataset.participants.filter((row) => gameIds.has(row.scrim_game_id)),
    events: (dataset.events ?? []).filter((row) => gameIds.has(row.scrim_game_id)),
    drafts: (dataset.drafts ?? []).filter((row) => gameIds.has(row.scrim_game_id)),
  };
}

function metric(
  games: TeamAnalyticsGame[],
  read: (game: TeamAnalyticsGame) => number | null | undefined,
): MetricValue {
  const rows = games.flatMap((game) => {
    const value = read(game);
    return typeof value === "number" && Number.isFinite(value) ? [{ game, value }] : [];
  });
  return {
    value: rows.length ? rows.reduce((total, row) => total + row.value, 0) / rows.length : null,
    samples: rows.length,
    gameIds: rows.map((row) => row.game.id),
  };
}

export function summarizeTeamAnalytics(dataset: TeamAnalyticsDataset) {
  const games = [...dataset.games].sort((a, b) => b.played_at.localeCompare(a.played_at));
  const resultGames = games.filter((game) => game.result === "win" || game.result === "loss");
  const coreComplete = games.filter(
    (game) => hasAll(game, coreCapabilities) && game.side && game.duration_seconds !== null,
  );
  const blocks = new Set(games.map((game) => game.scrim_id));
  const reviewGames = games.filter((game) => game.capabilities.includes("coach_review"));
  const averageDuration = metric(games, (game) =>
    game.duration_seconds === null ? null : game.duration_seconds / 60,
  );
  const averageKillDifferential = metric(games, (game) =>
    game.our_team_kills === null || game.enemy_team_kills === null
      ? null
      : game.our_team_kills - game.enemy_team_kills,
  );
  const averageGoldDifferential = metric(games, (game) =>
    game.our_team_gold === null || game.enemy_team_gold === null
      ? null
      : game.our_team_gold - game.enemy_team_gold,
  );
  const providerCounts = (["grid", "desktop_collector", "manual"] as const).map((provider) => ({
    provider,
    games: games.filter((game) => game.provider === provider).length,
  }));
  const capabilityCounts = ([...coreCapabilities, ...advancedCapabilities, "coach_review"] as EvidenceCapability[])
    .map((capability) => ({ capability, games: games.filter((game) => game.capabilities.includes(capability)).length }));

  return {
    games,
    blocks: blocks.size,
    wins: resultGames.filter((game) => game.result === "win").length,
    losses: resultGames.filter((game) => game.result === "loss").length,
    resultGames,
    recentForm: resultGames.slice(0, 5),
    coreComplete: coreComplete.length,
    reviewComplete: reviewGames.length,
    averageDuration,
    averageKillDifferential,
    averageGoldDifferential,
    performance: metric(games, (game) => game.performance_rating),
    earlyGame: metric(games, (game) => game.early_game_rating),
    midGame: metric(games, (game) => game.mid_game_rating),
    lateGame: metric(games, (game) => game.late_game_rating),
    providerCounts,
    capabilityCounts,
    blue: resultGames.filter((game) => game.side === "blue"),
    red: resultGames.filter((game) => game.side === "red"),
  };
}

type ComparisonMetric = {
  id: string;
  label: string;
  recent: MetricValue;
  previous: MetricValue;
  inverse?: boolean;
  suffix?: string;
};

export function improvementComparison(dataset: TeamAnalyticsDataset) {
  const comparable = dataset.games
    .filter((game) => game.result === "win" || game.result === "loss")
    .sort((a, b) => b.played_at.localeCompare(a.played_at));
  if (comparable.length < 20) {
    return { available: false as const, recordedGames: comparable.length, requiredGames: 20, metrics: [] as ComparisonMetric[] };
  }
  const recent = comparable.slice(0, 10);
  const previous = comparable.slice(10, 20);
  const winRate = (games: TeamAnalyticsGame[]): MetricValue => ({
    value: games.filter((game) => game.result === "win").length * 10,
    samples: games.length,
    gameIds: games.map((game) => game.id),
  });
  const metrics: ComparisonMetric[] = [
    { id: "win-rate", label: "Win rate", recent: winRate(recent), previous: winRate(previous), suffix: "%" },
    {
      id: "kill-differential",
      label: "Kill differential",
      recent: metric(recent, (game) => game.our_team_kills === null || game.enemy_team_kills === null ? null : game.our_team_kills - game.enemy_team_kills),
      previous: metric(previous, (game) => game.our_team_kills === null || game.enemy_team_kills === null ? null : game.our_team_kills - game.enemy_team_kills),
    },
    {
      id: "gold-differential",
      label: "Final gold differential",
      recent: metric(recent, (game) => game.our_team_gold === null || game.enemy_team_gold === null ? null : game.our_team_gold - game.enemy_team_gold),
      previous: metric(previous, (game) => game.our_team_gold === null || game.enemy_team_gold === null ? null : game.our_team_gold - game.enemy_team_gold),
    },
    {
      id: "duration",
      label: "Game duration",
      recent: metric(recent, (game) => game.duration_seconds === null ? null : game.duration_seconds / 60),
      previous: metric(previous, (game) => game.duration_seconds === null ? null : game.duration_seconds / 60),
      inverse: true,
      suffix: " min",
    },
    {
      id: "coach-rating",
      label: "Coach performance rating",
      recent: metric(recent, (game) => game.performance_rating),
      previous: metric(previous, (game) => game.performance_rating),
      suffix: "/5",
    },
  ];
  return { available: true as const, recordedGames: comparable.length, requiredGames: 20, recent, previous, metrics };
}

export function playerAnalytics(dataset: TeamAnalyticsDataset): PlayerAnalyticsRow[] {
  const gameMap = new Map(dataset.games.map((game) => [game.id, game]));
  const teamRowsByGame = new Map<string, TeamAnalyticsParticipant[]>();
  for (const row of dataset.participants.filter((participant) => participant.is_our_team)) {
    const rows = teamRowsByGame.get(row.scrim_game_id) || [];
    rows.push(row);
    teamRowsByGame.set(row.scrim_game_id, rows);
  }
  const groups = new Map<string, TeamAnalyticsParticipant[]>();
  for (const row of dataset.participants.filter((participant) => participant.is_our_team)) {
    const key = row.player_id || row.summoner_name;
    const rows = groups.get(key) || [];
    rows.push(row);
    groups.set(key, rows);
  }

  return [...groups.entries()].map(([key, rows]) => {
    const games = rows.flatMap((row) => gameMap.get(row.scrim_game_id) || []);
    const champions = new Map<string, number>();
    rows.forEach((row) => {
      if (row.champion_name) champions.set(row.champion_name, (champions.get(row.champion_name) || 0) + 1);
    });
    const rowMetric = (read: (row: TeamAnalyticsParticipant, game: TeamAnalyticsGame) => number | null) => {
      const values = rows.flatMap((row) => {
        const game = gameMap.get(row.scrim_game_id);
        if (!game) return [];
        const value = read(row, game);
        return typeof value === "number" && Number.isFinite(value) ? [{ value, gameId: game.id }] : [];
      });
      return {
        value: values.length ? values.reduce((total, item) => total + item.value, 0) / values.length : null,
        samples: values.length,
        gameIds: values.map((item) => item.gameId),
      };
    };
    return {
      key,
      playerId: rows[0].player_id,
      name: rows[0].summoner_name,
      games: games.length,
      wins: games.filter((game) => game.result === "win").length,
      champions: [...champions.entries()].map(([champion, count]) => ({ champion, games: count })).sort((a, b) => b.games - a.games),
      kda: rowMetric((row) => row.kills === null || row.deaths === null || row.assists === null ? null : (row.kills + row.assists) / Math.max(1, row.deaths)),
      csPerMinute: rowMetric((row, game) => row.cs === null || !game.duration_seconds ? null : row.cs / (game.duration_seconds / 60)),
      goldPerMinute: rowMetric((row, game) => row.gold === null || !game.duration_seconds ? null : row.gold / (game.duration_seconds / 60)),
      damageShare: rowMetric((row) => {
        if (row.damage_dealt === null) return null;
        const total = (teamRowsByGame.get(row.scrim_game_id) || []).reduce((sum, item) => sum + (item.damage_dealt || 0), 0);
        return total ? (row.damage_dealt / total) * 100 : null;
      }),
      visionPerMinute: rowMetric((row, game) => row.vision_score === null || !game.duration_seconds ? null : row.vision_score / (game.duration_seconds / 60)),
      killParticipation: rowMetric((row, game) => {
        if (row.kills === null || row.assists === null || !game.our_team_kills) return null;
        return ((row.kills + row.assists) / game.our_team_kills) * 100;
      }),
      damagePerMinute: rowMetric((row, game) => row.damage_dealt === null || !game.duration_seconds ? null : row.damage_dealt / (game.duration_seconds / 60)),
      damageTakenPerMinute: rowMetric((row, game) => row.damage_taken === null || !game.duration_seconds ? null : row.damage_taken / (game.duration_seconds / 60)),
      wardsPerMinute: rowMetric((row, game) => {
        const wards = row.advanced_stats?.wards_placed;
        return typeof wards !== "number" || !game.duration_seconds ? null : wards / (game.duration_seconds / 60);
      }),
      objectiveDamagePerMinute: rowMetric((row, game) => {
        const damage = row.advanced_stats?.damage_to_objectives;
        return typeof damage !== "number" || !game.duration_seconds ? null : damage / (game.duration_seconds / 60);
      }),
      crowdControlPerMinute: rowMetric((row, game) => {
        const seconds = row.advanced_stats?.crowd_control_seconds;
        return typeof seconds !== "number" || !game.duration_seconds ? null : seconds / (game.duration_seconds / 60);
      }),
      timeDeadPercent: rowMetric((row, game) => {
        const seconds = row.advanced_stats?.time_dead_seconds;
        return typeof seconds !== "number" || !game.duration_seconds ? null : (seconds / game.duration_seconds) * 100;
      }),
      gameIds: games.map((game) => game.id),
    };
  }).sort((a, b) => b.games - a.games || a.name.localeCompare(b.name));
}

function resultFor(dataset: TeamAnalyticsDataset, gameId: string) {
  return dataset.games.find((game) => game.id === gameId)?.result;
}

export function teamPatterns(dataset: TeamAnalyticsDataset) {
  const eventsByGame = new Map<string, TeamAnalyticsEvent[]>();
  (dataset.events ?? []).forEach((event) => eventsByGame.set(event.scrim_game_id, [...(eventsByGame.get(event.scrim_game_id) ?? []), event]));
  const conversion = (types: string[]) => {
    const games = dataset.games.flatMap((game) => {
      const first = (eventsByGame.get(game.id) ?? [])
        .filter((event) => types.includes(event.event_type) && event.team !== "neutral")
        .sort((a, b) => (a.occurred_seconds ?? Infinity) - (b.occurred_seconds ?? Infinity))[0];
      return first?.team === "our" ? [game] : [];
    });
    return { games: games.length, wins: games.filter((game) => game.result === "win").length, gameIds: games.map((game) => game.id) };
  };
  const pressureAt = (minutes: number) => {
    const values = dataset.games.flatMap((game) => {
      const events = (eventsByGame.get(game.id) ?? []).filter((event) => event.event_type === "ChampionKill" && (event.occurred_seconds ?? Infinity) <= minutes * 60);
      if (!events.length) return [];
      return [{ gameId: game.id, value: events.filter((event) => event.team === "our").length - events.filter((event) => event.team === "enemy").length }];
    });
    return { value: values.length ? values.reduce((sum, row) => sum + row.value, 0) / values.length : null, samples: values.length, gameIds: values.map((row) => row.gameId) };
  };
  const durations = [
    { label: "Under 25 min", min: 0, max: 1500 },
    { label: "25–30 min", min: 1500, max: 1800 },
    { label: "30–35 min", min: 1800, max: 2100 },
    { label: "35+ min", min: 2100, max: Infinity },
  ].map((bucket) => {
    const games = dataset.games.filter((game) => game.duration_seconds !== null && game.duration_seconds >= bucket.min && game.duration_seconds < bucket.max);
    return { label: bucket.label, games: games.length, wins: games.filter((game) => game.result === "win").length, gameIds: games.map((game) => game.id) };
  });
  const objectiveLabel = (event: TeamAnalyticsEvent) => {
    if (event.event_type === "TurretKilled") {
      const match = event.map_object?.match(/Turret_T(?:Chaos|Order)_L([123])_P([123])/i);
      if (!match) return "Turret";
      const lane = ({ "1": "Top", "2": "Mid", "3": "Bottom" } as const)[match[1] as "1" | "2" | "3"];
      const tier = ({ "1": "inhibitor", "2": "inner", "3": "outer" } as const)[match[2] as "1" | "2" | "3"];
      return `${lane} ${tier} turret`;
    }
    if (event.event_type === "InhibKilled") {
      const match = event.map_object?.match(/(?:Inhib|Barracks)_T(?:Chaos|Order)_L([123])/i);
      const lane = match ? ({ "1": "Top", "2": "Mid", "3": "Bottom" } as const)[match[1] as "1" | "2" | "3"] : null;
      return lane ? `${lane} inhibitor` : "Inhibitor";
    }
    if (event.event_type === "DragonKill") return `${event.objective_type || "Dragon"}${event.objective_type?.toLowerCase().includes("dragon") ? "" : " Dragon"}`;
    if (event.event_type === "HeraldKill") return "Herald";
    if (event.event_type === "BaronKill") return "Baron";
    return event.objective_type || event.event_type.replace("Kill", "");
  };
  const objectiveRows = dataset.games.flatMap((game) => {
    const sequence = (eventsByGame.get(game.id) ?? [])
      .filter((event) => ["DragonKill", "HeraldKill", "BaronKill", "TurretKilled", "InhibKilled"].includes(event.event_type))
      .sort((a, b) => (a.occurred_seconds ?? Infinity) - (b.occurred_seconds ?? Infinity))
      .slice(0, 4)
      .map((event) => `${event.team === "our" ? "Our" : event.team === "enemy" ? "Enemy" : "Neutral"} ${objectiveLabel(event)}`);
    return sequence.length ? [{ game, label: sequence.join(" → ") }] : [];
  });
  const sequenceGroups = new Map<string, typeof objectiveRows>();
  objectiveRows.forEach((row) => sequenceGroups.set(row.label, [...(sequenceGroups.get(row.label) ?? []), row]));
  const objectiveSequences = [...sequenceGroups.entries()].map(([label, rows]) => ({
    label,
    games: rows.length,
    wins: rows.filter((row) => row.game.result === "win").length,
    gameIds: rows.map((row) => row.game.id),
  })).sort((a, b) => b.games - a.games).slice(0, 5);
  return { firstBlood: conversion(["FirstBlood"]), firstTower: conversion(["FirstBrick", "TurretKilled"]), pressure10: pressureAt(10), pressure15: pressureAt(15), durations, objectiveSequences };
}

export function draftPatterns(dataset: TeamAnalyticsDataset) {
  const rows = (dataset.drafts ?? []).flatMap((draft) => draft.bans.map((ban) => ({ ...ban, gameId: draft.scrim_game_id })));
  const grouped = new Map<string, typeof rows>();
  rows.forEach((row) => grouped.set(row.champion, [...(grouped.get(row.champion) ?? []), row]));
  return [...grouped.entries()].map(([champion, bans]) => ({
    champion,
    bans: bans.length,
    wins: bans.filter((ban) => resultFor(dataset, ban.gameId) === "win").length,
    averageOrder: bans.reduce((sum, ban) => sum + (ban.order || 0), 0) / bans.length,
    gameIds: [...new Set(bans.map((ban) => ban.gameId))],
  })).sort((a, b) => b.bans - a.bans || a.champion.localeCompare(b.champion));
}

type ScoreMetric = { value: number; higherIsBetter: boolean };

function gameScoreMetrics(dataset: TeamAnalyticsDataset, game: TeamAnalyticsGame) {
  if (!game.duration_seconds) return null;
  const minutes = game.duration_seconds / 60;
  const rows = dataset.participants.filter((row) => row.scrim_game_id === game.id);
  const ours = rows.filter((row) => row.is_our_team);
  const enemy = rows.filter((row) => !row.is_our_team);
  if (!ours.length || !enemy.length) return null;
  const total = (team: TeamAnalyticsParticipant[], read: (row: TeamAnalyticsParticipant) => number | null | undefined) => {
    const values = team.map(read);
    return values.every((value) => typeof value === "number") ? (values as number[]).reduce((sum, value) => sum + value, 0) : null;
  };
  const diff = (read: (row: TeamAnalyticsParticipant) => number | null | undefined) => {
    const ourValue = total(ours, read); const enemyValue = total(enemy, read);
    return ourValue === null || enemyValue === null ? null : ourValue - enemyValue;
  };
  const events = (dataset.events ?? []).filter((event) => event.scrim_game_id === game.id);
  const objectiveWeight = (event: TeamAnalyticsEvent) => event.event_type === "BaronKill" ? 2
    : event.event_type === "InhibKilled" ? 1.5 : event.event_type === "TurretKilled" ? 0.5
      : ["DragonKill", "HeraldKill"].includes(event.event_type) ? 1 : 0;
  const ourObjectives = events.filter((event) => event.team === "our").reduce((sum, event) => sum + objectiveWeight(event), 0);
  const enemyObjectives = events.filter((event) => event.team === "enemy").reduce((sum, event) => sum + objectiveWeight(event), 0);
  const firstObjective = (team: "our" | "enemy") => events
    .filter((event) => event.team === team && objectiveWeight(event) > 0 && event.occurred_seconds !== null)
    .sort((a, b) => (a.occurred_seconds ?? Infinity) - (b.occurred_seconds ?? Infinity))[0]?.occurred_seconds;
  const ourFirstObjective = firstObjective("our");
  const enemyFirstObjective = firstObjective("enemy");
  const metrics = {
    combat: [
      game.our_team_kills === null || game.enemy_team_kills === null ? null : { value: (game.our_team_kills - game.enemy_team_kills) / minutes, higherIsBetter: true },
      diff((row) => row.damage_dealt) === null ? null : { value: (diff((row) => row.damage_dealt) as number) / minutes, higherIsBetter: true },
      diff((row) => row.advanced_stats?.time_dead_seconds) === null ? null : { value: (diff((row) => row.advanced_stats?.time_dead_seconds) as number) / minutes, higherIsBetter: false },
    ],
    economy: [
      game.our_team_gold === null || game.enemy_team_gold === null ? null : { value: (game.our_team_gold - game.enemy_team_gold) / minutes, higherIsBetter: true },
      diff((row) => row.cs) === null ? null : { value: (diff((row) => row.cs) as number) / minutes, higherIsBetter: true },
      game.our_team_gold === null ? null : { value: game.our_team_gold / minutes, higherIsBetter: true },
    ],
    objectives: [
      { value: (ourObjectives - enemyObjectives) / minutes, higherIsBetter: true },
      ourFirstObjective === undefined || enemyFirstObjective === undefined ? null : { value: (enemyFirstObjective - ourFirstObjective) / 60, higherIsBetter: true },
    ],
    vision: [
      diff((row) => row.vision_score) === null ? null : { value: (diff((row) => row.vision_score) as number) / minutes, higherIsBetter: true },
      diff((row) => row.advanced_stats?.wards_placed) === null ? null : { value: (diff((row) => row.advanced_stats?.wards_placed) as number) / minutes, higherIsBetter: true },
      diff((row) => row.advanced_stats?.wards_killed) === null ? null : { value: (diff((row) => row.advanced_stats?.wards_killed) as number) / minutes, higherIsBetter: true },
      diff((row) => row.advanced_stats?.control_wards_purchased) === null ? null : { value: (diff((row) => row.advanced_stats?.control_wards_purchased) as number) / minutes, higherIsBetter: true },
    ],
  };
  return Object.fromEntries(Object.entries(metrics).map(([key, values]) => [key, values.filter((value): value is ScoreMetric => Boolean(value))])) as Record<"combat" | "economy" | "objectives" | "vision", ScoreMetric[]>;
}

function percentile(value: ScoreMetric, baseline: ScoreMetric[]) {
  if (!baseline.length) return null;
  const comparable = baseline.map((row) => row.higherIsBetter ? row.value : -row.value);
  const target = value.higherIsBetter ? value.value : -value.value;
  const below = comparable.filter((row) => row < target).length;
  const equal = comparable.filter((row) => row === target).length;
  return ((below + equal * 0.5) / comparable.length) * 100;
}

export function measuredPerformanceIndex(dataset: TeamAnalyticsDataset) {
  const eligible = dataset.games.filter((game) => game.score_eligible && game.game_classification === "standard_5v5")
    .sort((a, b) => a.played_at.localeCompare(b.played_at));
  const target = eligible.at(-1);
  const baselineGames = target ? eligible.slice(Math.max(0, eligible.length - 31), -1) : [];
  if (!target || baselineGames.length < 10) return { available: false as const, target, baselineGames, required: 10 };
  const targetMetrics = gameScoreMetrics(dataset, target);
  const baselines = baselineGames.map((game) => gameScoreMetrics(dataset, game)).filter((value): value is NonNullable<ReturnType<typeof gameScoreMetrics>> => Boolean(value));
  if (!targetMetrics || baselines.length < 10) return { available: false as const, target, baselineGames, required: 10 };
  const metricLabels = {
    combat: ["Kill differential/min", "Champion damage differential/min", "Time-dead differential/min"],
    economy: ["Gold differential/min", "CS differential/min", "Team gold/min"],
    objectives: ["Weighted objective differential/min", "First objective timing advantage"],
    vision: ["Vision score differential/min", "Wards placed differential/min", "Wards killed differential/min", "Control wards differential/min"],
  } as const;
  const components = (["combat", "economy", "objectives", "vision"] as const).map((key) => {
    const metricRows = targetMetrics[key].flatMap((value, index) => {
      const baseline = baselines.flatMap((row) => row[key][index] ?? []);
      const score = percentile(value, baseline);
      return score === null ? [] : [{ label: metricLabels[key][index], value: value.value, score, samples: baseline.length }];
    });
    return { key, score: metricRows.length === targetMetrics[key].length && metricRows.length ? metricRows.reduce((sum, value) => sum + value.score, 0) / metricRows.length : null, metrics: metricRows };
  });
  if (components.some((component) => component.score === null)) return { available: false as const, target, baselineGames, required: 10 };
  return {
    available: true as const,
    target,
    baselineGames,
    components,
    score: components.reduce((sum, component) => sum + (component.score ?? 0), 0) / components.length,
  };
}

function evidenceRow(label: string, detail: string, games: TeamAnalyticsGame[]): DraftAnalyticsRow {
  return {
    key: `${label}:${detail}`.toLowerCase(),
    label,
    detail,
    games: games.length,
    wins: games.filter((game) => game.result === "win").length,
    gameIds: games.map((game) => game.id),
  };
}

export function draftAnalytics(dataset: TeamAnalyticsDataset) {
  const gameMap = new Map(dataset.games.map((game) => [game.id, game]));
  const participantsByGame = new Map<string, TeamAnalyticsParticipant[]>();
  dataset.participants.forEach((participant) => {
    const rows = participantsByGame.get(participant.scrim_game_id) || [];
    rows.push(participant);
    participantsByGame.set(participant.scrim_game_id, rows);
  });
  const champions = new Map<string, TeamAnalyticsGame[]>();
  const matchups = new Map<string, TeamAnalyticsGame[]>();
  const duos = new Map<string, TeamAnalyticsGame[]>();

  for (const [gameId, rows] of participantsByGame) {
    const game = gameMap.get(gameId);
    if (!game || (game.result !== "win" && game.result !== "loss")) continue;
    const ours = rows.filter((row) => row.is_our_team && row.champion_name && row.role);
    const theirs = rows.filter((row) => !row.is_our_team && row.champion_name && row.role);
    ours.forEach((row) => {
      const key = `${row.role}:${row.champion_name}`;
      champions.set(key, [...(champions.get(key) || []), game]);
      const opponent = theirs.find((candidate) => candidate.role === row.role);
      if (opponent) {
        const matchupKey = `${row.role}:${row.champion_name}:${opponent.champion_name}`;
        matchups.set(matchupKey, [...(matchups.get(matchupKey) || []), game]);
      }
    });
    for (let first = 0; first < ours.length; first += 1) {
      for (let second = first + 1; second < ours.length; second += 1) {
        const pair = [ours[first], ours[second]].sort((a, b) => (a.role || "").localeCompare(b.role || ""));
        const key = `${pair[0].role}:${pair[0].champion_name}+${pair[1].role}:${pair[1].champion_name}`;
        duos.set(key, [...(duos.get(key) || []), game]);
      }
    }
  }

  return {
    champions: [...champions.entries()].map(([key, games]) => {
      const [role, champion] = key.split(":");
      return evidenceRow(champion, role, games);
    }).sort((a, b) => b.games - a.games),
    matchups: [...matchups.entries()].map(([key, games]) => {
      const [role, champion, opponent] = key.split(":");
      return evidenceRow(`${champion} into ${opponent}`, role, games);
    }).sort((a, b) => b.games - a.games),
    duos: [...duos.entries()].map(([key, games]) => evidenceRow(key.split("+").join(" + "), "Champion pairing", games)).sort((a, b) => b.games - a.games),
  };
}
