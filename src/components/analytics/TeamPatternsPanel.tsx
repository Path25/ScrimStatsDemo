import { DataSurface } from "@/components/workspace/DataSurface";
import { teamPatterns, type TeamAnalyticsDataset } from "@/lib/analytics/team-analytics";

function conversion(wins: number, games: number) { return games ? `${Math.round((wins / games) * 100)}%` : "Not recorded"; }

export function TeamPatternsPanel({ dataset }: { dataset: TeamAnalyticsDataset }) {
  const patterns = teamPatterns(dataset);
  return (
    <DataSurface>
      <div className="border-b border-[var(--workspace-rule)] p-5"><h2 className="font-semibold">Patterns and conversion</h2><p className="mt-1 text-sm text-[var(--workspace-muted)]">Descriptive outcomes from recorded event evidence; correlation is not treated as causation.</p></div>
      <div className="grid gap-px bg-[var(--workspace-rule)] sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-[var(--workspace-surface)] p-4"><p className="workspace-eyebrow">First blood conversion</p><p className="mt-3 ss-mono text-xl">{conversion(patterns.firstBlood.wins, patterns.firstBlood.games)}</p><p className="mt-1 text-xs text-[var(--workspace-subtle)]">{patterns.firstBlood.games} games securing first blood</p></div>
        <div className="bg-[var(--workspace-surface)] p-4"><p className="workspace-eyebrow">First tower conversion</p><p className="mt-3 ss-mono text-xl">{conversion(patterns.firstTower.wins, patterns.firstTower.games)}</p><p className="mt-1 text-xs text-[var(--workspace-subtle)]">{patterns.firstTower.games} games securing first tower</p></div>
        <div className="bg-[var(--workspace-surface)] p-4"><p className="workspace-eyebrow">Kill pressure at 10</p><p className="mt-3 ss-mono text-xl">{patterns.pressure10.value === null ? "Not recorded" : `${patterns.pressure10.value >= 0 ? "+" : ""}${patterns.pressure10.value.toFixed(1)}`}</p><p className="mt-1 text-xs text-[var(--workspace-subtle)]">Average kill differential · n={patterns.pressure10.samples}</p></div>
        <div className="bg-[var(--workspace-surface)] p-4"><p className="workspace-eyebrow">Kill pressure at 15</p><p className="mt-3 ss-mono text-xl">{patterns.pressure15.value === null ? "Not recorded" : `${patterns.pressure15.value >= 0 ? "+" : ""}${patterns.pressure15.value.toFixed(1)}`}</p><p className="mt-1 text-xs text-[var(--workspace-subtle)]">Average kill differential · n={patterns.pressure15.samples}</p></div>
      </div>
      <div className="grid gap-6 border-t border-[var(--workspace-rule)] p-5 lg:grid-cols-2">
        <div><p className="workspace-eyebrow">Duration bands</p><div className="mt-3 space-y-2">{patterns.durations.map((row) => <div key={row.label} className="flex justify-between gap-4 text-sm"><span>{row.label}</span><span className="ss-mono text-[var(--workspace-subtle)]">{row.games} games · {conversion(row.wins, row.games)} wins</span></div>)}</div></div>
        <div><p className="workspace-eyebrow">Opening objective sequences</p><div className="mt-3 space-y-3">{patterns.objectiveSequences.length ? patterns.objectiveSequences.map((row) => <div key={row.label}><p className="text-sm">{row.label}</p><p className="mt-1 ss-mono text-[11px] text-[var(--workspace-subtle)]">{row.games} games · {conversion(row.wins, row.games)} wins</p></div>) : <p className="text-sm text-[var(--workspace-muted)]">No objective sequence evidence is recorded.</p>}</div></div>
      </div>
    </DataSurface>
  );
}
