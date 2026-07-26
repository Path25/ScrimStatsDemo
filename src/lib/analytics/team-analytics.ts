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
}

export interface TeamAnalyticsDataset {
  contract_version: "team-analytics-v2";
  date_from: string;
  date_to: string;
  capture_profile: CaptureProfile;
  games: TeamAnalyticsGame[];
  participants: TeamAnalyticsParticipant[];
  filter_options: {
    opponents: Array<{ key: string; name: string }>;
    formats: string[];
    patches: string[];
  };
}

export interface TeamAnalyticsFilters {
  opponentKey?: string;
  side?: "blue" | "red";
  format?: string;
  result?: "win" | "loss" | "draw";
  patch?: string;
  provider?: EvidenceProvider;
  completeness?: "core" | "advanced";
  playerId?: string;
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
    if (filters.provider && game.provider !== filters.provider) return false;
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
      gameIds: games.map((game) => game.id),
    };
  }).sort((a, b) => b.games - a.games || a.name.localeCompare(b.name));
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
