import { AnalyticsGameDrilldown } from "@/components/analytics/AnalyticsGameDrilldown";
import { DataSurface } from "@/components/workspace/DataSurface";
import { draftPatterns, type TeamAnalyticsDataset } from "@/lib/analytics/team-analytics";

export function DraftPatternPanel({ dataset }: { dataset: TeamAnalyticsDataset }) {
  const rows = draftPatterns(dataset);
  return <DataSurface><div className="border-b border-[var(--workspace-rule)] p-5"><h2 className="font-semibold">Ban patterns</h2><p className="mt-1 text-sm text-[var(--workspace-muted)]">Resolved champion names, actual action order, and blue/red ownership from completed drafts.</p></div>{rows.length ? <div className="divide-y divide-[var(--workspace-rule)]">{rows.slice(0, 12).map((row) => <div key={row.champion} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-3"><span className="font-medium">{row.champion}</span><span className="ss-mono text-xs">{row.bans} bans</span><span className="ss-mono text-xs text-[var(--workspace-subtle)]">avg order {row.averageOrder.toFixed(1)}</span><AnalyticsGameDrilldown games={dataset.games.filter((game) => row.gameIds.includes(game.id))} title={`${row.champion} bans`} /></div>)}</div> : <p className="p-5 text-sm text-[var(--workspace-muted)]">No complete ban evidence in this filter.</p>}</DataSurface>;
}
