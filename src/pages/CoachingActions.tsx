import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, CircleDot, ClipboardCheck, Clock3, History, Link2, RotateCcw, XCircle } from "lucide-react";

import { CoachingActionDialog } from "@/components/actions/CoachingActionDialog";
import { PracticeDevelopmentActionBreadcrumb } from "@/components/practice-development/PracticeDevelopmentActionBreadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DataSurface } from "@/components/workspace/DataSurface";
import { MetricStrip } from "@/components/workspace/MetricStrip";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { WorkspaceState } from "@/components/workspace/WorkspaceState";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { type CoachingAction, type CoachingActionStatus, type PlayerCheckIn, type ReviewOutcome, useCoachingActions } from "@/hooks/useCoachingActions";
import { useOptimizedScrimsData } from "@/hooks/useOptimizedScrimsData";
import { usePlayersData } from "@/hooks/usePlayersData";
import { usePracticeDevelopmentBreadcrumbs } from "@/hooks/usePracticeDevelopmentBreadcrumbs";
import { cn } from "@/lib/utils";
import { Link } from "@/lib/router";

const openStates = new Set(["assigned", "acknowledged", "in_progress", "ready_for_review"]);
const statusLabels: Record<string, string> = { assigned: "Assigned", acknowledged: "Acknowledged", in_progress: "In progress", ready_for_review: "Ready for review", complete: "Reviewed", dismissed: "Dismissed" };
const checkInLabels: Record<PlayerCheckIn, string> = { practised: "Practised", blocked: "Blocked", needs_clarification: "Needs clarification", ready_for_review: "Ready for review" };
const outcomeLabels: Record<ReviewOutcome, string> = { demonstrated: "Demonstrated", partially_demonstrated: "Partially demonstrated", not_observed: "Not observed", no_longer_relevant: "No longer relevant" };

function ActionState({ status }: { status: string }) {
  return <span className={cn("inline-flex min-h-7 items-center border px-2.5 ss-mono text-xs uppercase tracking-[0.06em]", status === "complete" && "border-emerald-400/30 bg-emerald-400/8 text-emerald-300", status === "ready_for_review" && "border-violet-300/30 bg-violet-300/8 text-violet-200", status === "in_progress" && "border-cyan-300/30 bg-cyan-300/8 text-cyan-200", status === "dismissed" && "border-[var(--workspace-rule)] text-[var(--workspace-subtle)]", ["assigned", "acknowledged"].includes(status) && "border-amber-300/25 bg-amber-300/5 text-amber-200")}><CircleDot className="mr-1.5 h-3.5 w-3.5" />{statusLabels[status] || status.replaceAll("_", " ")}</span>;
}

export default function CoachingActions() {
  const { user } = useAuth();
  const { isManager } = useRole();
  const { players } = usePlayersData();
  const scrimsQuery = useOptimizedScrimsData({ mode: "all", pageSize: 100 });
  const { actions, events, isLoading, error, transitionAction, checkInAction, reviewAction, isSaving } = useCoachingActions();
  const [filter, setFilter] = useState(isManager ? "open" : "mine");
  const [category, setCategory] = useState("all");
  const [scope, setScope] = useState("all");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [reviewOutcome, setReviewOutcome] = useState<Record<string, ReviewOutcome>>({});
  const [reviewObservation, setReviewObservation] = useState<Record<string, string>>({});
  const [reviewEvidence, setReviewEvidence] = useState<Record<string, string>>({});
  const [reviewNext, setReviewNext] = useState<Record<string, string>>({});

  const playerNames = useMemo(() => new Map(players.map((player) => [player.id, player.summoner_name])), [players]);
  const currentPlayerId = players.find((player) => player.linked_user_id === user?.id)?.id;
  const scrimNames = useMemo(() => new Map((scrimsQuery.data?.scrims || []).map((scrim) => [scrim.id, scrim.opponent_name])), [scrimsQuery.data?.scrims]);
  const eventsByAction = useMemo(() => { const grouped = new Map<string, typeof events>(); for (const event of events) grouped.set(event.action_id, [...(grouped.get(event.action_id) || []), event]); return grouped; }, [events]);
  const now = Date.now();
  const isOverdue = (action: CoachingAction) => Boolean(action.due_at && openStates.has(action.status) && new Date(action.due_at).getTime() < now);
  const isParticipant = (action: CoachingAction) => Boolean(currentPlayerId && action.participant_player_ids.includes(currentPlayerId));
  const visible = actions.filter((action) => {
    if (category !== "all" && action.category !== category) return false;
    if (scope !== "all" && action.scope_type !== scope) return false;
    if (filter === "all") return true;
    if (filter === "mine") return isParticipant(action) && openStates.has(action.status);
    if (filter === "open") return openStates.has(action.status);
    if (filter === "overdue") return isOverdue(action);
    return action.status === filter;
  });
  const dueSoon = actions.filter((action) => openStates.has(action.status) && action.due_at && new Date(action.due_at).getTime() < now + 3 * 86_400_000).length;
  const recurringPatterns = new Set(actions.map((action) => action.pattern_label).filter(Boolean)).size;
  const practiceBreadcrumbs = usePracticeDevelopmentBreadcrumbs(visible.map((action) => action.id));

  if (isLoading) return <WorkspaceState icon={Clock3} title="Loading coaching actions..." description="Gathering action cycles, checkpoints, and review evidence." />;
  if (error) return <WorkspaceState icon={ClipboardCheck} title="Coaching actions could not be loaded" description="The workspace action contract is unavailable. Try again shortly." />;

  async function transition(action: CoachingAction, status: CoachingActionStatus) { await transitionAction({ id: action.id, status, note: notes[action.id] }); setNotes((current) => ({ ...current, [action.id]: "" })); }
  async function checkIn(action: CoachingAction, value: PlayerCheckIn) { await checkInAction({ id: action.id, checkIn: value, note: notes[action.id] }); setNotes((current) => ({ ...current, [action.id]: "" })); }
  async function review(action: CoachingAction) {
    await reviewAction({ id: action.id, outcome: reviewOutcome[action.id] || "demonstrated", observation: reviewObservation[action.id] || "", evidence: reviewEvidence[action.id], nextAction: reviewNext[action.id] });
  }

  return <div className="space-y-8 pb-12">
    <WorkspacePageHeader eyebrow="Coaching follow-through" title="Action cycles" description="Turn one review finding into an observable behaviour, practise it deliberately, and record what staff actually saw." actions={isManager ? <CoachingActionDialog /> : undefined} />
    <MetricStrip items={[
      { label: "Open", value: actions.filter((action) => openStates.has(action.status)).length, detail: "active behaviours in practice" },
      { label: "Due soon", value: dueSoon, detail: "review due within three days" },
      { label: "Awaiting review", value: actions.filter((action) => action.status === "ready_for_review").length, detail: "player check-ins ready for staff" },
      { label: "Recurring patterns", value: recurringPatterns, detail: "named themes across action history" },
    ]} />

    <div className="grid gap-3 border-y border-[var(--workspace-rule)] py-4 sm:grid-cols-3">
      <Select value={filter} onValueChange={setFilter}><SelectTrigger aria-label="Filter action state"><SelectValue /></SelectTrigger><SelectContent>{!isManager && <SelectItem value="mine">My open actions</SelectItem>}<SelectItem value="open">All open actions</SelectItem><SelectItem value="overdue">Overdue</SelectItem><SelectItem value="ready_for_review">Ready for review</SelectItem><SelectItem value="complete">Reviewed history</SelectItem><SelectItem value="dismissed">Dismissed</SelectItem><SelectItem value="all">All actions</SelectItem></SelectContent></Select>
      <Select value={scope} onValueChange={setScope}><SelectTrigger aria-label="Filter action scope"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All scopes</SelectItem><SelectItem value="player">Player</SelectItem><SelectItem value="unit">Role unit</SelectItem><SelectItem value="team">Whole team</SelectItem></SelectContent></Select>
      <Select value={category} onValueChange={setCategory}><SelectTrigger aria-label="Filter action category"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{["draft","laning","pathing","vision","objectives","teamfighting","communication","macro","preparation","review_discipline"].map((value) => <SelectItem key={value} value={value}>{value.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select>
    </div>

    {visible.length ? <div className="space-y-4">{visible.map((action) => {
      const participant = isParticipant(action);
      const actionEvents = eventsByAction.get(action.id) || [];
      const checkpoints = action.checkpoint_scrim_ids;
      const overdue = isOverdue(action);
      const note = notes[action.id] || "";
      const participantNames = action.participant_player_ids.map((id) => playerNames.get(id) || "Roster player");
      return <DataSurface as="article" elevated={action.status === "ready_for_review"} key={action.id} className="overflow-hidden">
        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:p-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><ActionState status={action.status} /><span className="ss-mono text-xs uppercase tracking-[0.06em] text-[var(--workspace-subtle)]">{action.scope_type === "unit" ? action.unit_label : action.scope_type} / {action.category.replaceAll("_", " ")}</span>{overdue && <span className="ss-mono text-xs uppercase text-rose-300">Overdue</span>}</div>
            <h2 className="mt-4 text-xl font-semibold tracking-[-0.02em]">{action.title}</h2>
            <PracticeDevelopmentActionBreadcrumb breadcrumb={practiceBreadcrumbs.get(action.id)} />
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--workspace-muted)]">{action.description || "Success evidence has not been described."}</p>
            {action.pattern_label && <p className="mt-3 inline-flex border-l-2 border-violet-300/50 pl-3 text-sm text-violet-200">Recurring pattern: {action.pattern_label}</p>}
            <dl className="mt-5 grid gap-4 border-y border-[var(--workspace-rule)] py-4 text-sm sm:grid-cols-3">
              <div><dt className="workspace-eyebrow text-[var(--workspace-subtle)]">Participants</dt><dd className="mt-1.5">{participantNames.length ? participantNames.join(", ") : "Whole team"}</dd></div>
              <div><dt className="workspace-eyebrow text-[var(--workspace-subtle)]">Review by</dt><dd className={cn("mt-1.5", overdue && "text-rose-300")}>{action.due_at ? new Date(action.due_at).toLocaleString() : "No review date"}</dd></div>
              <div><dt className="workspace-eyebrow text-[var(--workspace-subtle)]">Source</dt><dd className="mt-1.5 capitalize">{action.source_type.replaceAll("_", " ")}{action.source_timestamp_seconds !== null ? ` at ${Math.floor(action.source_timestamp_seconds / 60)}:${String(action.source_timestamp_seconds % 60).padStart(2, "0")}` : ""}</dd></div>
            </dl>
            {action.source_note && <div className="mt-4 border-l-2 border-[var(--workspace-accent)] pl-4"><p className="workspace-eyebrow text-[var(--workspace-accent)]">Why this action exists</p><p className="mt-2 text-sm leading-6">{action.source_note}</p></div>}
            {checkpoints.length > 0 && <div className="mt-5"><p className="workspace-eyebrow text-[var(--workspace-subtle)]">Practice checkpoints</p><div className="mt-2 flex flex-wrap gap-2">{checkpoints.map((id) => <Link key={id} to={`/scrims/${id}`} className="inline-flex items-center gap-1.5 border border-[var(--workspace-rule)] px-2.5 py-1.5 text-sm hover:border-[var(--workspace-accent)]"><Link2 className="h-3.5 w-3.5" />{scrimNames.get(id) || "Practice block"}</Link>)}</div></div>}
            {action.player_check_in && <div className="mt-5 border border-[var(--workspace-rule)] bg-[var(--workspace-surface-raised)] p-4"><p className="workspace-eyebrow text-[var(--workspace-accent)]">Latest player check-in</p><p className="mt-2 font-medium">{checkInLabels[action.player_check_in as PlayerCheckIn]}</p>{action.player_check_in_note && <p className="mt-1 text-sm leading-6 text-[var(--workspace-muted)]">{action.player_check_in_note}</p>}</div>}
            {action.review_outcome && <div className="mt-5 border-l-2 border-emerald-300/60 pl-4"><p className="workspace-eyebrow text-emerald-300">Coach-observed outcome</p><p className="mt-2 font-medium">{outcomeLabels[action.review_outcome as ReviewOutcome]}</p><p className="mt-1 text-sm leading-6 text-[var(--workspace-muted)]">{action.review_observation}</p>{action.review_evidence && <p className="mt-2 text-sm">Evidence: {action.review_evidence}</p>}{action.review_next_action && <p className="mt-2 text-sm">Next action: {action.review_next_action}</p>}</div>}
            {actionEvents.length > 0 && <details className="mt-5 text-sm text-[var(--workspace-muted)]"><summary className="cursor-pointer list-none font-medium text-[var(--workspace-foreground)]"><span className="inline-flex items-center gap-2"><History className="h-4 w-4" />Activity history · {actionEvents.length}</span></summary><ol className="mt-3 space-y-3 border-l border-[var(--workspace-rule)] pl-4">{actionEvents.map((event) => <li key={event.id}><p className="capitalize text-[var(--workspace-foreground)]">{event.event_type.replaceAll("_", " ")}</p><p className="mt-0.5 text-xs text-[var(--workspace-subtle)]">{formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}{event.note ? ` · ${event.note}` : ""}</p></li>)}</ol></details>}
          </div>

          <div className="flex flex-col gap-3 border-t border-[var(--workspace-rule)] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            {(participant || isManager) && openStates.has(action.status) && action.status !== "ready_for_review" && <><p className="text-sm font-medium">Practice check-in</p><Textarea value={note} onChange={(event) => setNotes((current) => ({ ...current, [action.id]: event.target.value }))} placeholder="Optional: what happened in practice?" />{(["practised","blocked","needs_clarification","ready_for_review"] as PlayerCheckIn[]).map((value) => <Button key={value} size="sm" variant={value === "ready_for_review" ? "default" : "outline"} disabled={isSaving} onClick={() => void checkIn(action, value)}>{checkInLabels[value]}</Button>)}</>}
            {isManager && action.status === "ready_for_review" && <><p className="text-sm font-medium">Close the review loop</p><Select value={reviewOutcome[action.id] || "demonstrated"} onValueChange={(value) => setReviewOutcome((current) => ({ ...current, [action.id]: value as ReviewOutcome }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(outcomeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Textarea value={reviewObservation[action.id] || ""} onChange={(event) => setReviewObservation((current) => ({ ...current, [action.id]: event.target.value }))} placeholder="What did staff observe?" /><Input value={reviewEvidence[action.id] || ""} onChange={(event) => setReviewEvidence((current) => ({ ...current, [action.id]: event.target.value }))} placeholder="Evidence link or moment (optional)" /><Input value={reviewNext[action.id] || ""} onChange={(event) => setReviewNext((current) => ({ ...current, [action.id]: event.target.value }))} placeholder="Next action (optional)" /><Button size="sm" disabled={isSaving || !(reviewObservation[action.id] || "").trim()} onClick={() => void review(action)}><CheckCircle2 className="h-4 w-4" /> Record outcome</Button><Button size="sm" variant="outline" disabled={isSaving} onClick={() => void transition(action, "in_progress")}>Return to practice</Button></>}
            {isManager && openStates.has(action.status) && action.status !== "ready_for_review" && <Button size="sm" variant="ghost" className="text-[var(--workspace-subtle)]" disabled={isSaving} onClick={() => void transition(action, "dismissed")}><XCircle className="h-4 w-4" /> Dismiss</Button>}
            {isManager && ["complete", "dismissed"].includes(action.status) && <Button size="sm" variant="outline" disabled={isSaving} onClick={() => void transition(action, "assigned")}><RotateCcw className="h-4 w-4" /> Reopen action</Button>}
            {!participant && !isManager && openStates.has(action.status) && <p className="text-sm leading-6 text-[var(--workspace-muted)]">This cycle remains visible as shared coaching history, but its check-in belongs to the listed participants.</p>}
          </div>
        </div>
      </DataSurface>;
    })}</div> : <WorkspaceState icon={ClipboardCheck} title="No action cycles in this view" description={isManager ? "Assign a focused behaviour from review evidence or a team template." : "Staff have not assigned an active action to you."} action={isManager ? <CoachingActionDialog /> : undefined} />}
  </div>;
}
