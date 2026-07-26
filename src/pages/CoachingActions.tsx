import { useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck, Clock3, UserCheck } from "lucide-react";

import { CoachingActionDialog } from "@/components/actions/CoachingActionDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DataSurface } from "@/components/workspace/DataSurface";
import { MetricStrip } from "@/components/workspace/MetricStrip";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { WorkspaceState } from "@/components/workspace/WorkspaceState";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { useCoachingActions, type CoachingAction, type CoachingActionStatus } from "@/hooks/useCoachingActions";
import { usePlayersData } from "@/hooks/usePlayersData";

const openStates = new Set(["assigned", "acknowledged", "in_progress", "ready_for_review"]);

export default function CoachingActions() {
  const { user } = useAuth();
  const { isManager } = useRole();
  const { players } = usePlayersData();
  const { actions, isLoading, error, transitionAction, isSaving } = useCoachingActions();
  const [filter, setFilter] = useState("open");
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const playerNames = useMemo(() => new Map(players.map((player) => [player.id, player.summoner_name])), [players]);
  const visible = actions.filter((action) => filter === "all" || (filter === "open" ? openStates.has(action.status) : action.status === filter));
  const dueSoon = actions.filter((action) => openStates.has(action.status) && action.due_at && new Date(action.due_at).getTime() < Date.now() + 3 * 86_400_000).length;

  if (isLoading) return <WorkspaceState icon={Clock3} title="Loading coaching actions…" description="Gathering assigned work and follow-up evidence." />;
  if (error) return <WorkspaceState icon={ClipboardCheck} title="Coaching actions could not be loaded" description={error instanceof Error ? error.message : "Please try again."} />;

  async function transition(action: CoachingAction, status: CoachingActionStatus) {
    await transitionAction({ id: action.id, status, note: evidence[action.id] });
    setEvidence((current) => ({ ...current, [action.id]: "" }));
  }

  return <div className="space-y-8 pb-12">
    <WorkspacePageHeader eyebrow="Coaching follow-through" title="Actions" description="Give every review an owner, due date and visible next-practice outcome." actions={isManager ? <CoachingActionDialog /> : undefined} />
    <MetricStrip items={[
      { label: "Open actions", value: actions.filter((action) => openStates.has(action.status)).length, detail: "assigned or under review" },
      { label: "Due within 3 days", value: dueSoon, detail: "requires near-term follow-up" },
      { label: "Completed", value: actions.filter((action) => action.status === "complete").length, detail: "coach-confirmed outcomes" },
    ]} />
    <div className="flex justify-end"><Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-full sm:w-56" aria-label="Filter coaching actions"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="open">Open actions</SelectItem><SelectItem value="ready_for_review">Ready for review</SelectItem><SelectItem value="complete">Complete</SelectItem><SelectItem value="dismissed">Dismissed</SelectItem><SelectItem value="all">All actions</SelectItem></SelectContent></Select></div>
    {visible.length ? <DataSurface><div className="divide-y divide-[var(--workspace-rule)]">{visible.map((action) => {
      const mine = action.assignee_user_id === user?.id;
      return <article key={action.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-start">
        <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{action.title}</h2><span className="ss-mono text-xs uppercase text-[var(--workspace-subtle)]">{action.status.replaceAll("_", " ")}</span><span className="ss-mono text-xs uppercase text-[var(--workspace-subtle)]">{action.priority}</span></div><p className="mt-2 text-sm leading-6 text-[var(--workspace-muted)]">{action.description || "Success evidence not described."}</p><p className="mt-3 text-xs text-[var(--workspace-subtle)]">Assigned to {action.assignee_player_id ? playerNames.get(action.assignee_player_id) || "Roster player" : "Team member"} · {action.due_at ? `Due ${new Date(action.due_at).toLocaleString()}` : "No due date"}</p>{action.completion_evidence && <p className="mt-3 border-l-2 border-[var(--workspace-accent)] pl-3 text-sm">{action.completion_evidence}</p>}</div>
        <div className="flex min-w-56 flex-col gap-2">
          {mine && action.status !== "ready_for_review" && action.status !== "complete" && <>{action.status === "assigned" && <Button size="sm" variant="outline" disabled={isSaving} onClick={() => void transition(action, "acknowledged")}><UserCheck className="h-4 w-4" /> Acknowledge</Button>}{["acknowledged","in_progress"].includes(action.status) && <><Textarea aria-label="Completion evidence" value={evidence[action.id] || ""} onChange={(event) => setEvidence((current) => ({ ...current, [action.id]: event.target.value }))} placeholder="Evidence for coach review" /><Button size="sm" disabled={isSaving || !(evidence[action.id] || "").trim()} onClick={() => void transition(action, "ready_for_review")}>Submit for review</Button></>}</>}
          {isManager && action.status === "ready_for_review" && <Button size="sm" disabled={isSaving} onClick={() => void transition(action, "complete")}><CheckCircle2 className="h-4 w-4" /> Confirm complete</Button>}
          {isManager && action.status === "complete" && <Button size="sm" variant="outline" disabled={isSaving} onClick={() => void transition(action, "assigned")}>Reopen</Button>}
        </div>
      </article>;
    })}</div></DataSurface> : <WorkspaceState icon={ClipboardCheck} title="No coaching actions in this view" description={isManager ? "Assign the first follow-up from a review or directly from this workspace." : "Staff have not assigned any follow-up work here."} />}
  </div>;
}
