import { BarChart3, ShieldAlert } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataSurface } from "@/components/workspace/DataSurface";
import { type FunnelPeriod, useFounderFunnelScorecard } from "@/hooks/usePilotOperations";

const labels: Record<string, string> = {
  account_registered: "Registrations",
  workspace_created: "Workspaces created",
  first_scheduled_block: "First scheduled block",
  first_recorded_game: "First completed recorded game",
  workspace_activated: "Activated workspaces",
  first_paid_upgrade: "First paid upgrade",
};

const date = (value: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value));

export function FounderFunnelScorecard({ period, onPeriodChange }: { period: FunnelPeriod; onPeriodChange: (period: FunnelPeriod) => void }) {
  const scorecard = useFounderFunnelScorecard(period);
  const total = scorecard.data?.milestones.reduce((sum, milestone) => sum + milestone.count, 0) || 0;

  return <DataSurface className="p-5 sm:p-6">
    <div className="flex flex-col gap-4 border-b border-[var(--workspace-rule)] pb-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2 text-[var(--workspace-accent)]"><BarChart3 className="h-4 w-4" /><p className="workspace-eyebrow">Private operator reporting</p></div><h2 className="mt-2 text-xl font-semibold">Founder funnel</h2><p className="mt-2 text-sm text-[var(--workspace-muted)]">Aggregate operational milestones only. Instrumented from 28 Jul 2026.</p></div><Select value={period} onValueChange={(value) => onPeriodChange(value as FunnelPeriod)}><SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="last_30_days">Last 30 days</SelectItem><SelectItem value="last_90_days">Last 90 days</SelectItem></SelectContent></Select></div>
    {scorecard.isLoading ? <p className="py-8 text-sm text-[var(--workspace-muted)]">Loading measured funnel milestones…</p> : scorecard.error || !scorecard.data ? <div className="flex gap-3 py-8 text-sm text-[var(--workspace-muted)]"><ShieldAlert className="h-5 w-5 shrink-0 text-amber-300" /><p>Funnel reporting is unavailable. Operator access is required and no estimate is shown.</p></div> : total === 0 ? <p className="py-8 text-sm text-[var(--workspace-muted)]">No events recorded since instrumentation began</p> : <><p className="py-4 text-xs text-[var(--workspace-subtle)]">Reporting period: {date(scorecard.data.period.starts_at)} – {date(scorecard.data.period.ends_at)} UTC</p><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{scorecard.data.milestones.map((milestone) => <div key={milestone.key} className="border border-[var(--workspace-rule)] p-4"><p className="text-2xl font-semibold">{milestone.count}</p><p className="mt-1 text-sm text-[var(--workspace-muted)]">{labels[milestone.key]}</p></div>)}</div></>}
  </DataSurface>;
}
