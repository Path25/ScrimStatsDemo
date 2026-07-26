import { useMemo } from "react";

import type { Scrim } from "@/hooks/useOptimizedScrimsData";

export interface PlayerAnalytics {
  name: string;
  games: number;
  wins: number;
  winRate: number;
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  totalCS: number;
  totalVisionScore: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgCS: number;
  avgVisionScore: number;
  avgGD15: number;
  avgDmgPct: number;
  avgGoldPct: number;
  avgKP: number;
  kda: number;
  roles: string[];
  champions: string[];
  performanceScore: number;
}

export interface TeamAnalytics {
  totalGames: number;
  wins: number;
  winRate: number;
  avgGameDuration: number;
  avgKills: number;
  avgGold: number;
  avgGD15: number;
  killsTrend: number;
  goldTrend: number;
  durationTrend: number;
  recentForm: Array<"W" | "L">;
  sideSelection: {
    blue: { games: number; wins: number; winRate: number };
    red: { games: number; wins: number; winRate: number };
  };
  objectives: {
    dragonRate: number;
    baronRate: number;
    heraldRate: number;
    firstBloodRate: number;
    firstTowerRate: number;
  };
}

export interface GameAnalytics {
  date: string;
  opponent: string;
  games: number;
  wins: number;
  winRate: number;
  avgKills: number;
  avgDuration: number;
  avgGold: number;
}

export interface ScrimAnalytics {
  team: TeamAnalytics;
  players: PlayerAnalytics[];
  timeline: GameAnalytics[];
  performanceData: Array<{
    date: string;
    performance: number;
    kda: number;
    winRate: number;
    games: number;
  }>;
}

const unavailableObjectives = {
  dragonRate: 0,
  baronRate: 0,
  heraldRate: 0,
  firstBloodRate: 0,
  firstTowerRate: 0,
};

/**
 * Compatibility summary for legacy components.
 *
 * Only completed games with explicit win/loss results contribute. Unsupported
 * player, objective, gold, and "performance score" values remain unavailable
 * rather than being generated from assumptions.
 */
export function useScrimAnalytics(
  scrims: Scrim[],
  timeRange: "week" | "month" | "season" = "month",
): ScrimAnalytics {
  return useMemo(() => {
    const days = timeRange === "week" ? 7 : timeRange === "season" ? 90 : 30;
    const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
    const filtered = scrims.filter((scrim) => scrim.match_date >= cutoff);
    const games = filtered
      .flatMap((scrim) =>
        (scrim.scrim_games || []).map((game) => ({
          ...game,
          date: scrim.match_date,
          opponent: scrim.opponent_name,
        })),
      )
      .filter((game) => game.status === "completed" && ["win", "loss"].includes(game.result || ""));
    const wins = games.filter((game) => game.result === "win").length;
    const durationSamples = games.filter((game) => typeof game.duration_seconds === "number");
    const timeline = Array.from(new Set(games.map((game) => `${game.date}|${game.opponent}`))).map(
      (key) => {
        const [date, opponent] = key.split("|");
        const sample = games.filter((game) => game.date === date && game.opponent === opponent);
        const sampleWins = sample.filter((game) => game.result === "win").length;
        const durations = sample.filter((game) => typeof game.duration_seconds === "number");
        return {
          date,
          opponent,
          games: sample.length,
          wins: sampleWins,
          winRate: sample.length ? Math.round((sampleWins / sample.length) * 100) : 0,
          avgKills: 0,
          avgDuration: durations.length
            ? durations.reduce((sum, game) => sum + (game.duration_seconds || 0), 0) / durations.length
            : 0,
          avgGold: 0,
        };
      },
    );

    return {
      team: {
        totalGames: games.length,
        wins,
        winRate: games.length ? Math.round((wins / games.length) * 100) : 0,
        avgGameDuration: durationSamples.length
          ? durationSamples.reduce((sum, game) => sum + (game.duration_seconds || 0), 0) /
            durationSamples.length
          : 0,
        avgKills: 0,
        avgGold: 0,
        avgGD15: 0,
        killsTrend: 0,
        goldTrend: 0,
        durationTrend: 0,
        recentForm: games.slice(-5).map((game) => (game.result === "win" ? "W" : "L")),
        sideSelection: {
          blue: { games: 0, wins: 0, winRate: 0 },
          red: { games: 0, wins: 0, winRate: 0 },
        },
        objectives: unavailableObjectives,
      },
      players: [],
      timeline,
      performanceData: [],
    };
  }, [scrims, timeRange]);
}
