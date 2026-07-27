import { AnalyticsGameDrilldown } from "@/components/analytics/AnalyticsGameDrilldown";
import { DataSurface } from "@/components/workspace/DataSurface";
import { playerAnalytics, type MetricValue, type TeamAnalyticsDataset } from "@/lib/analytics/team-analytics";

function metric(value: MetricValue, suffix = "") { return value.value === null ? "Not recorded" : `${value.value.toFixed(2)}${suffix}`; }

export function PlayerContributionPanel({ dataset }: { dataset: TeamAnalyticsDataset }) {
  const rows = playerAnalytics(dataset);
  if (!rows.length) return <DataSurface className="p-5"><h2 className="font-semibold">Player analytics</h2><p className="mt-2 text-sm text-[var(--workspace-muted)]">No roster participant evidence is recorded for this filter.</p></DataSurface>;
  const fields = [
    ["KDA", "kda"], ["Kill participation", "killParticipation", "%"], ["CS/min", "csPerMinute"], ["Gold/min", "goldPerMinute"],
    ["Damage/min", "damagePerMinute"], ["Damage share", "damageShare", "%"], ["Damage taken/min", "damageTakenPerMinute"],
    ["Vision/min", "visionPerMinute"], ["Wards/min", "wardsPerMinute"], ["Objective damage/min", "objectiveDamagePerMinute"],
    ["CC/min", "crowdControlPerMinute"], ["Time dead", "timeDeadPercent", "%"],
  ] as const;
  return <div className="grid gap-4 xl:grid-cols-2">{rows.map((row) => <DataSurface key={row.key} className="overflow-hidden"><div className="flex items-start justify-between gap-4 p-5"><div><h2 className="font-semibold">{row.name}</h2><p className="mt-1 text-sm text-[var(--workspace-muted)]">{row.wins} wins · {row.games} games · {row.champions.slice(0, 4).map((champion) => `${champion.champion} ${champion.games}`).join(" · ") || "Champion pool not recorded"}</p></div><AnalyticsGameDrilldown games={dataset.games.filter((game) => row.gameIds.includes(game.id))} title={`${row.name} evidence`} /></div><div className="grid grid-cols-2 gap-px bg-[var(--workspace-rule)] sm:grid-cols-3">{fields.map(([label, key, suffix]) => { const value = row[key]; return <div key={key} className="bg-[var(--workspace-surface)] p-3"><p className="ss-mono text-sm">{metric(value, suffix)}</p><p className="mt-1 text-[11px] text-[var(--workspace-muted)]">{label}</p><p className="mt-2 text-[10px] text-[var(--workspace-subtle)]">{value.samples}/{row.games} samples</p></div>; })}</div></DataSurface>)}</div>;
}
