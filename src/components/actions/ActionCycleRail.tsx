import { CheckCircle2, ChevronRight, ClipboardCheck } from "lucide-react";

import { DataSurface } from "@/components/workspace/DataSurface";
import { WorkspaceState } from "@/components/workspace/WorkspaceState";
import { useCoachingActions } from "@/hooks/useCoachingActions";
import { Link } from "@/lib/router";

const openStates = new Set(["assigned", "acknowledged", "in_progress", "ready_for_review"]);

export function ActionCycleRail({ scrimId, scrimGameId, compact = false }: { scrimId?: string; scrimGameId?: string; compact?: boolean }) {
  const { actions, isLoading, error } = useCoachingActions({ scrimId, scrimGameId });
  const visible = actions.filter((action) => openStates.has(action.status)).slice(0, compact ? 3 : 5);

  return <DataSurface>
    <div className="flex items-end justify-between gap-4 border-b border-[var(--workspace-rule)] px-5 py-4">
      <div><p className="workspace-eyebrow text-[var(--workspace-subtle)]">Practice focus</p><h2 className="mt-2 text-lg font-semibold">Active action cycles</h2></div>
      <Link to="/actions" className="inline-flex items-center gap-1 text-sm text-[var(--workspace-accent)] hover:underline">Open ledger <ChevronRight className="h-4 w-4" /></Link>
    </div>
    {isLoading ? <WorkspaceState icon={ClipboardCheck} title="Loading action cycles" description="Reading current practice focus." className="m-5" /> : error ? <WorkspaceState icon={ClipboardCheck} title="Action cycles unavailable" description="The coaching ledger could not be loaded." className="m-5" /> : visible.length ? <div className="divide-y divide-[var(--workspace-rule)]">{visible.map((action) => <Link key={action.id} to="/actions" className="workspace-ledger-row grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="ss-mono text-xs uppercase text-[var(--workspace-accent)]">{action.category.replaceAll("_", " ")}</span>{action.pattern_label && <span className="truncate text-xs text-[var(--workspace-subtle)]">Pattern: {action.pattern_label}</span>}</div><p className="mt-1 font-medium">{action.title}</p><p className="mt-1 text-sm text-[var(--workspace-muted)]">{action.scope_type === "unit" ? action.unit_label : action.scope_type} · {action.player_check_in ? action.player_check_in.replaceAll("_", " ") : "awaiting practice check-in"}</p></div><span className="ss-mono text-xs uppercase text-[var(--workspace-subtle)]">{action.status.replaceAll("_", " ")}</span></Link>)}</div> : <WorkspaceState icon={CheckCircle2} title="No active action cycle" description={scrimId ? "No coaching behaviour is linked to this practice block." : "The team has no open coaching follow-through."} className="m-5" />}
  </DataSurface>;
}
