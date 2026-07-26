import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatRank, rankChartSeries } from "@/lib/soloq";
import type { SoloQDailySnapshot } from "@/types/soloq";

interface SoloQRankChartProps {
  snapshots: SoloQDailySnapshot[];
}

function RankTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ReturnType<typeof rankChartSeries>[number] }> }) {
  const snapshot = payload?.[0]?.payload;
  if (!active || !snapshot) return null;
  return (
    <div className="border border-[var(--workspace-rule-strong)] bg-[var(--workspace-surface)] px-3 py-2 shadow-xl">
      <p className="text-xs text-[var(--workspace-subtle)]">{new Date(`${snapshot.snapshot_date}T12:00:00Z`).toLocaleDateString()}</p>
      <p className="mt-1 text-sm font-semibold">{formatRank(snapshot.tier, snapshot.division, snapshot.league_points)}</p>
    </div>
  );
}

export function SoloQRankChart({ snapshots }: SoloQRankChartProps) {
  const series = rankChartSeries(snapshots);
  if (!series.length) {
    return <p className="flex h-64 items-center justify-center px-5 text-center text-sm text-[var(--workspace-muted)]">Progression appears after the first successful daily snapshot.</p>;
  }

  return (
    <div className="h-64 w-full px-2 pb-2 pt-5" aria-label="30-day ranked progression chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--workspace-rule)" vertical={false} />
          <XAxis
            dataKey="snapshot_date"
            tickFormatter={(value: string) => new Date(`${value}T12:00:00Z`).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
            tick={{ fill: "var(--workspace-subtle)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis hide domain={["dataMin - 40", "dataMax + 40"]} />
          <Tooltip content={<RankTooltip />} cursor={{ stroke: "var(--workspace-rule-strong)" }} />
          <Line
            type="linear"
            dataKey="coordinate"
            stroke="var(--workspace-accent, #24c8b1)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--workspace-surface)", strokeWidth: 2 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
