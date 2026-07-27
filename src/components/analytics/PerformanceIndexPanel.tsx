import { Gauge } from "lucide-react";

import { AnalyticsGameDrilldown } from "@/components/analytics/AnalyticsGameDrilldown";
import { DataSurface } from "@/components/workspace/DataSurface";
import { measuredPerformanceIndex, type TeamAnalyticsDataset } from "@/lib/analytics/team-analytics";

const labels = { combat: "Combat", economy: "Economy", objectives: "Objectives", vision: "Vision" } as const;

export function PerformanceIndexPanel({ dataset }: { dataset: TeamAnalyticsDataset }) {
  const index = measuredPerformanceIndex(dataset);
  if (!index.available) {
    const recorded = index.baselineGames.length;
    return (
      <DataSurface className="p-5">
        <div className="flex items-start gap-3">
          <Gauge className="mt-0.5 h-5 w-5 text-[var(--workspace-accent)]" aria-hidden="true" />
          <div>
            <p className="workspace-eyebrow">Measured Performance Index</p>
            <h2 className="mt-2 font-semibold">Building a trustworthy baseline</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--workspace-muted)]">
              {index.target ? `${recorded} of ${index.required} earlier eligible standard 5v5 games are available.` : "No eligible standard 5v5 game is available yet."} Non-standard games and coach ratings never enter this calculation.
            </p>
          </div>
        </div>
      </DataSurface>
    );
  }

  return (
    <DataSurface>
      <div className="flex flex-col gap-4 border-b border-[var(--workspace-rule)] p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="workspace-eyebrow">Measured Performance Index</p>
          <h2 className="mt-2 text-3xl font-semibold">{Math.round(index.score)}<span className="text-base text-[var(--workspace-subtle)]"> / 100</span></h2>
          <p className="mt-2 text-sm text-[var(--workspace-muted)]">Latest eligible game against the previous {index.baselineGames.length} eligible games, capped at 30.</p>
        </div>
        <AnalyticsGameDrilldown games={[index.target, ...index.baselineGames]} title="Performance Index evidence" label="Contributing games" />
      </div>
      <div className="grid gap-px bg-[var(--workspace-rule)] md:grid-cols-2 xl:grid-cols-4">
        {index.components.map((component) => (
          <div key={component.key} className="bg-[var(--workspace-surface)] p-5">
            <p className="workspace-eyebrow">{labels[component.key]}</p>
            <p className="mt-3 ss-mono text-2xl">{Math.round(component.score ?? 0)}</p>
            <div className="mt-4 space-y-3">
              {component.metrics.map((metric) => (
                <div key={metric.label}>
                  <p className="text-xs text-[var(--workspace-muted)]">{metric.label}</p>
                  <p className="mt-1 ss-mono text-[11px] text-[var(--workspace-subtle)]">Raw {metric.value.toFixed(2)} · percentile {Math.round(metric.score)} · n={metric.samples}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="border-t border-[var(--workspace-rule)] px-5 py-3 text-xs text-[var(--workspace-subtle)]">Coach overall, early, mid, and late ratings remain independent review judgements and are not blended into this index.</p>
    </DataSurface>
  );
}
