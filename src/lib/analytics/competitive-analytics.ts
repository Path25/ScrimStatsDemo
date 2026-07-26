export type EvidenceTier = "manual" | "legacy_collector" | "collector_v2";
export type TeamSide = "blue" | "red";
export type GameResult = "win" | "loss";
export type LeagueRole = "top" | "jungle" | "mid" | "adc" | "support";
export type CompositionIdentity =
  | "engage"
  | "dive"
  | "pick"
  | "poke_siege"
  | "split_pressure"
  | "front_to_back"
  | "scaling"
  | "early_pressure"
  | "protect_carry";

export interface AnalyticsParticipant {
  playerId?: string;
  champion: string;
  role: LeagueRole;
  isOurTeam: boolean;
  kills?: number;
  deaths?: number;
  assists?: number;
  cs?: number;
  gold?: number;
  damage?: number;
  visionScore?: number;
  wardsPlaced?: number;
  wardsCleared?: number;
}

export interface ObjectiveEvent {
  type: "dragon" | "herald" | "baron" | "tower" | "inhibitor";
  isOurTeam: boolean;
  atSeconds: number;
}

export interface GameStateSnapshot {
  atMinute: 10 | 15 | 20;
  goldDifference?: number;
  killDifference?: number;
  towerDifference?: number;
}

export interface CompetitiveGameEvidence {
  id: string;
  playedAt: string;
  patch?: string;
  opponentId?: string;
  side?: TeamSide;
  result?: GameResult;
  durationSeconds?: number;
  source: EvidenceTier;
  captureVersion?: string;
  taxonomyVersion?: string;
  participants: AnalyticsParticipant[];
  bans?: string[];
  objectives?: ObjectiveEvent[];
  snapshots?: GameStateSnapshot[];
}

export type ChampionTraitTaxonomy = Record<string, CompositionIdentity[]>;

export interface SampleMeta {
  games: number;
  excluded: number;
  smallSample: boolean;
  dateFrom: string | null;
  dateTo: string | null;
  sources: Record<EvidenceTier, number>;
  captureVersions: string[];
  taxonomyVersions: string[];
}

export interface CountMetric extends SampleMeta {
  wins: number;
  losses: number;
}

export interface ChampionMetric extends CountMetric {
  champion: string;
  role: LeagueRole;
}

export interface MatchupMetric extends CountMetric {
  role: LeagueRole;
  champion: string;
  opponentChampion: string;
}

export interface DuoMetric extends CountMetric {
  firstChampion: string;
  firstRole: LeagueRole;
  secondChampion: string;
  secondRole: LeagueRole;
}

export interface CompositionMetric extends CountMetric {
  identity: CompositionIdentity;
  traitContributions: Array<{ champion: string; traits: CompositionIdentity[] }>;
}

const evidenceTiers: EvidenceTier[] = ["manual", "legacy_collector", "collector_v2"];

function sampleMeta(games: CompetitiveGameEvidence[], excluded = 0): SampleMeta {
  const dates = games.map((game) => game.playedAt).sort();
  return {
    games: games.length,
    excluded,
    smallSample: games.length < 3,
    dateFrom: dates[0] || null,
    dateTo: dates.at(-1) || null,
    sources: Object.fromEntries(
      evidenceTiers.map((tier) => [tier, games.filter((game) => game.source === tier).length]),
    ) as Record<EvidenceTier, number>,
    captureVersions: [...new Set(games.flatMap((game) => game.captureVersion || []))].sort(),
    taxonomyVersions: [...new Set(games.flatMap((game) => game.taxonomyVersion || []))].sort(),
  };
}

function countMetric(games: CompetitiveGameEvidence[], excluded = 0): CountMetric {
  return {
    ...sampleMeta(games, excluded),
    wins: games.filter((game) => game.result === "win").length,
    losses: games.filter((game) => game.result === "loss").length,
  };
}

function groupGames<T>(
  games: CompetitiveGameEvidence[],
  entries: (game: CompetitiveGameEvidence) => Array<{ key: string; value: T }>,
) {
  const groups = new Map<string, { value: T; games: CompetitiveGameEvidence[] }>();
  for (const game of games) {
    for (const entry of entries(game)) {
      const group = groups.get(entry.key) || { value: entry.value, games: [] };
      group.games.push(game);
      groups.set(entry.key, group);
    }
  }
  return groups;
}

function qualifyingGames(games: CompetitiveGameEvidence[]) {
  const included = games.filter(
    (game) =>
      (game.result === "win" || game.result === "loss") &&
      game.participants.some((participant) => participant.isOurTeam),
  );
  return { included, excluded: games.length - included.length };
}

export function championMetrics(games: CompetitiveGameEvidence[]): ChampionMetric[] {
  const { included, excluded } = qualifyingGames(games);
  return [...groupGames(included, (game) =>
    game.participants
      .filter((participant) => participant.isOurTeam)
      .map((participant) => ({
        key: `${participant.role}:${participant.champion.toLowerCase()}`,
        value: { champion: participant.champion, role: participant.role },
      })),
  ).values()]
    .map((group) => ({
      ...group.value,
      ...countMetric(group.games, excluded),
    }))
    .sort((a, b) => b.games - a.games || a.champion.localeCompare(b.champion));
}

export function matchupMetrics(games: CompetitiveGameEvidence[]): MatchupMetric[] {
  const { included, excluded } = qualifyingGames(games);
  return [...groupGames(included, (game) => {
    const ours = game.participants.filter((participant) => participant.isOurTeam);
    const theirs = game.participants.filter((participant) => !participant.isOurTeam);
    return ours.flatMap((participant) => {
      const opponent = theirs.find((candidate) => candidate.role === participant.role);
      if (!opponent) return [];
      return [{
        key: `${participant.role}:${participant.champion.toLowerCase()}:${opponent.champion.toLowerCase()}`,
        value: {
          role: participant.role,
          champion: participant.champion,
          opponentChampion: opponent.champion,
        },
      }];
    });
  }).values()]
    .map((group) => ({ ...group.value, ...countMetric(group.games, excluded) }))
    .sort((a, b) => b.games - a.games);
}

export function duoMetrics(games: CompetitiveGameEvidence[]): DuoMetric[] {
  const { included, excluded } = qualifyingGames(games);
  return [...groupGames(included, (game) => {
    const ours = game.participants
      .filter((participant) => participant.isOurTeam)
      .sort((a, b) => a.role.localeCompare(b.role));
    const pairs: Array<{ key: string; value: Omit<DuoMetric, keyof CountMetric> }> = [];
    for (let first = 0; first < ours.length; first += 1) {
      for (let second = first + 1; second < ours.length; second += 1) {
        const one = ours[first];
        const two = ours[second];
        pairs.push({
          key: `${one.role}:${one.champion.toLowerCase()}|${two.role}:${two.champion.toLowerCase()}`,
          value: {
            firstChampion: one.champion,
            firstRole: one.role,
            secondChampion: two.champion,
            secondRole: two.role,
          },
        });
      }
    }
    return pairs;
  }).values()]
    .map((group) => ({ ...group.value, ...countMetric(group.games, excluded) }))
    .sort((a, b) => b.games - a.games);
}

export function compositionMetrics(
  games: CompetitiveGameEvidence[],
  taxonomy: ChampionTraitTaxonomy,
): CompositionMetric[] {
  const { included, excluded } = qualifyingGames(games);
  return [...groupGames(included, (game) => {
    const contributions = game.participants
      .filter((participant) => participant.isOurTeam)
      .map((participant) => ({
        champion: participant.champion,
        traits: taxonomy[participant.champion.toLowerCase()] || [],
      }));
    const counts = new Map<CompositionIdentity, number>();
    for (const contribution of contributions) {
      for (const trait of contribution.traits) counts.set(trait, (counts.get(trait) || 0) + 1);
    }
    return [...counts.entries()]
      .filter(([, count]) => count >= 2)
      .map(([identity]) => ({
        key: identity,
        value: { identity, traitContributions: contributions.filter((item) => item.traits.includes(identity)) },
      }));
  }).values()]
    .map((group) => ({ ...group.value, ...countMetric(group.games, excluded) }))
    .sort((a, b) => b.games - a.games);
}

export function improvementWindows(games: CompetitiveGameEvidence[]) {
  const comparable = qualifyingGames(games).included
    .sort((a, b) => b.playedAt.localeCompare(a.playedAt));
  if (comparable.length < 20) {
    return {
      available: false as const,
      requiredGames: 20,
      recordedGames: comparable.length,
      recent: null,
      previous: null,
    };
  }
  const recentGames = comparable.slice(0, 10);
  const previousGames = comparable.slice(10, 20);
  return {
    available: true as const,
    requiredGames: 20,
    recordedGames: comparable.length,
    recent: countMetric(recentGames),
    previous: countMetric(previousGames),
  };
}
