import type { SoloQDailySnapshot, SoloQRecentMatch } from "@/types/soloq";

const TIER_BASE: Record<string, number> = {
  IRON: 0,
  BRONZE: 400,
  SILVER: 800,
  GOLD: 1200,
  PLATINUM: 1600,
  EMERALD: 2000,
  DIAMOND: 2400,
  MASTER: 2800,
  GRANDMASTER: 2800,
  CHALLENGER: 2800,
};

const DIVISION_BASE: Record<string, number> = { IV: 0, III: 100, II: 200, I: 300 };
const APEX_TIERS = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);

export function normalizeRank(tier: string, division: string, leaguePoints: number) {
  const normalizedTier = tier.toUpperCase();
  const tierBase = TIER_BASE[normalizedTier];
  if (tierBase === undefined) return null;
  return tierBase + (APEX_TIERS.has(normalizedTier) ? 0 : (DIVISION_BASE[division.toUpperCase()] ?? 0)) + leaguePoints;
}

export function formatRank(tier: string, division: string, leaguePoints: number) {
  const label = tier.charAt(0) + tier.slice(1).toLowerCase();
  return `${label}${APEX_TIERS.has(tier.toUpperCase()) ? "" : ` ${division}`} · ${leaguePoints} LP`;
}

export function dateInTimezone(date: Date, timezone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function shiftIsoDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function rankMovement(snapshots: SoloQDailySnapshot[], today: string) {
  const ordered = [...snapshots].sort((left, right) => right.snapshot_date.localeCompare(left.snapshot_date));
  const latest = ordered[0] ?? null;
  if (!latest) return { latest: null, comparison: null, change: null, label: "Daily change", comparisonDate: null };

  const yesterday = shiftIsoDate(today, -1);
  const exact = ordered.find((snapshot) => snapshot.snapshot_date === yesterday);
  const fallback = ordered.find((snapshot) => snapshot.snapshot_date < latest.snapshot_date);
  const comparison = exact || fallback || null;
  const latestCoordinate = normalizeRank(latest.tier, latest.division, latest.league_points);
  const comparisonCoordinate = comparison
    ? normalizeRank(comparison.tier, comparison.division, comparison.league_points)
    : null;

  return {
    latest,
    comparison,
    change: latestCoordinate !== null && comparisonCoordinate !== null
      ? latestCoordinate - comparisonCoordinate
      : null,
    label: exact ? "Daily change" : comparison ? "Since last snapshot" : "Daily change",
    comparisonDate: comparison?.snapshot_date ?? null,
  };
}

export function thirtyDayNet(snapshots: SoloQDailySnapshot[]) {
  if (snapshots.length < 2) return null;
  const ordered = [...snapshots].sort((left, right) => left.snapshot_date.localeCompare(right.snapshot_date));
  const first = normalizeRank(ordered[0].tier, ordered[0].division, ordered[0].league_points);
  const last = normalizeRank(ordered.at(-1)!.tier, ordered.at(-1)!.division, ordered.at(-1)!.league_points);
  return first === null || last === null ? null : last - first;
}

export function rankChartSeries(snapshots: SoloQDailySnapshot[]) {
  return [...snapshots]
    .sort((left, right) => left.snapshot_date.localeCompare(right.snapshot_date))
    .flatMap((snapshot) => {
      const coordinate = normalizeRank(snapshot.tier, snapshot.division, snapshot.league_points);
      return coordinate === null ? [] : [{ ...snapshot, coordinate }];
    });
}

export function recentForm(matches: SoloQRecentMatch[], now = new Date()) {
  const wins = matches.filter((match) => match.win).length;
  const totalMinutes = matches.reduce((sum, match) => sum + Math.max(1, match.game_duration_seconds / 60), 0);
  const kda = matches.length
    ? matches.reduce((sum, match) => sum + ((match.kills + match.assists) / Math.max(1, match.deaths)), 0) / matches.length
    : null;
  const csPerMinute = totalMinutes
    ? matches.reduce((sum, match) => sum + match.cs, 0) / totalMinutes
    : null;
  const sevenDayBoundary = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  return {
    wins,
    losses: matches.length - wins,
    gamesLastSevenDays: matches.filter((match) => new Date(match.played_at).getTime() >= sevenDayBoundary).length,
    averageKda: kda,
    csPerMinute,
  };
}
