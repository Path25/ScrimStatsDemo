import { useEffect, useId, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Link2,
  Pencil,
  RotateCcw,
  ShieldCheck,
  Target,
} from "lucide-react";

import { CoachingActionDialog } from "@/components/actions/CoachingActionDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataSurface } from "@/components/workspace/DataSurface";
import { WorkspaceState } from "@/components/workspace/WorkspaceState";
import { useRole } from "@/contexts/RoleContext";
import { useTenant } from "@/contexts/TenantContext";
import { usePracticeDevelopment } from "@/hooks/usePracticeDevelopment";
import { cn } from "@/lib/utils";
import { practiceDevelopmentStatusLabel, practicePlanningUnavailableLabel } from "@/lib/practice-development";
import { Link } from "@/lib/router";
import type {
  PracticeDevelopmentEvidence,
  PracticeDevelopmentObjective,
  PracticeDevelopmentObjectiveStatus,
} from "@/types/practiceDevelopment";

export interface PracticeDevelopmentGameOption {
  gameNumber: number;
  id: string;
  status: string;
}

interface PracticeDevelopmentPanelProps {
  games: PracticeDevelopmentGameOption[];
  reviewStatus: string;
  scrimId: string;
  scrimStartsAt: string;
}

const emptyEvidence: PracticeDevelopmentEvidence[] = [];

function ObjectiveState({ archived = false, availability, status }: { archived?: boolean; availability: "available" | "unavailable"; status: PracticeDevelopmentObjectiveStatus }) {
  if (archived) {
    return <span className="inline-flex min-h-7 items-center border border-[var(--workspace-rule)] px-2.5 ss-mono text-xs uppercase tracking-[0.06em] text-[var(--workspace-subtle)]">Archived</span>;
  }
  if (availability === "unavailable") {
    return <span className="inline-flex min-h-7 items-center border border-amber-300/30 bg-amber-300/[0.06] px-2.5 ss-mono text-xs uppercase tracking-[0.06em] text-amber-200">Unavailable</span>;
  }
  return (
    <span className={cn(
      "inline-flex min-h-7 items-center border px-2.5 ss-mono text-xs uppercase tracking-[0.06em]",
      status === "planned" && "border-cyan-300/25 bg-cyan-300/[0.06] text-cyan-200",
      status === "evidenced" && "border-violet-300/30 bg-violet-300/[0.08] text-violet-200",
      status === "completed" && "border-emerald-300/30 bg-emerald-300/[0.08] text-emerald-200",
      status === "blocked" && "border-amber-300/30 bg-amber-300/[0.08] text-amber-200",
    )}>
      {practiceDevelopmentStatusLabel(status)}
    </span>
  );
}

interface ObjectiveEditorProps {
  disabled: boolean;
  objective?: PracticeDevelopmentObjective;
  onSave: (input: { evidenceStandard: string; staffNote?: string; title: string }) => Promise<unknown>;
}

function ObjectiveEditor({ disabled, objective, onSave }: ObjectiveEditorProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(objective?.title || "");
  const [evidenceStandard, setEvidenceStandard] = useState(objective?.evidenceStandard || "");
  const [staffNote, setStaffNote] = useState(objective?.staffNote || "");

  useEffect(() => {
    if (!open) return;
    setTitle(objective?.title || "");
    setEvidenceStandard(objective?.evidenceStandard || "");
    setStaffNote(objective?.staffNote || "");
  }, [objective, open]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await onSave({ evidenceStandard, staffNote, title });
      setOpen(false);
    } catch {
      // The mutation hook presents the server-safe error and keeps the form recoverable.
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={objective ? "outline" : "default"} disabled={disabled}>
          {objective ? <Pencil className="h-4 w-4" /> : <Target className="h-4 w-4" />}
          {objective ? "Edit objective" : "Plan objective"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{objective ? "Edit the block objective" : "Plan the block objective"}</DialogTitle>
          <DialogDescription>
            Record one observable focus before practice. A linked result will never be treated as proof by itself.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-5" onSubmit={(event) => void submit(event)}>
          <div className="grid gap-2">
            <Label htmlFor="practice-objective-title">Team-facing objective</Label>
            <Input id="practice-objective-title" required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Reset vision before contesting the second objective" />
            <p className="text-xs leading-5 text-[var(--workspace-subtle)]">Visible to every authorised member of this workspace.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="practice-objective-evidence">Observable evidence standard</Label>
            <Textarea id="practice-objective-evidence" required maxLength={1000} value={evidenceStandard} onChange={(event) => setEvidenceStandard(event.target.value)} placeholder="What should staff be able to observe in the saved game or completed block review?" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="practice-objective-staff-note">Staff-only rationale <span className="font-normal text-[var(--workspace-subtle)]">(optional)</span></Label>
            <Textarea id="practice-objective-staff-note" maxLength={2000} value={staffNote} onChange={(event) => setStaffNote(event.target.value)} placeholder="Internal context for staff review" />
            <p className="text-xs leading-5 text-[var(--workspace-subtle)]">Never returned in the Member or Viewer projection.</p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={disabled || !title.trim() || !evidenceStandard.trim()}>
              {objective ? "Save planning changes" : "Plan objective"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface NarrativeDialogProps {
  confirmLabel: string;
  description: string;
  disabled?: boolean;
  onConfirm: (teamSummary: string, staffNote?: string) => Promise<unknown>;
  title: string;
  trigger: React.ReactNode;
  variant?: "default" | "destructive";
}

function NarrativeDialog({ confirmLabel, description, disabled, onConfirm, title, trigger, variant = "default" }: NarrativeDialogProps) {
  const fieldId = useId();
  const [open, setOpen] = useState(false);
  const [teamSummary, setTeamSummary] = useState("");
  const [staffNote, setStaffNote] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await onConfirm(teamSummary, staffNote || undefined);
      setOpen(false);
      setTeamSummary("");
      setStaffNote("");
    } catch {
      // The hook owns the mutation error message.
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
        <form className="grid gap-5" onSubmit={(event) => void submit(event)}>
          <div className="grid gap-2">
            <Label htmlFor={`${fieldId}-team-summary`}>Team-facing summary</Label>
            <Textarea id={`${fieldId}-team-summary`} required maxLength={1000} value={teamSummary} onChange={(event) => setTeamSummary(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${fieldId}-staff-note`}>Staff-only note <span className="font-normal text-[var(--workspace-subtle)]">(optional)</span></Label>
            <Textarea id={`${fieldId}-staff-note`} maxLength={2000} value={staffNote} onChange={(event) => setStaffNote(event.target.value)} />
          </div>
          <DialogFooter><Button type="submit" variant={variant} disabled={disabled || !teamSummary.trim()}>{confirmLabel}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EvidenceReviewDialog({ disabled, evidence, objective, onReview }: {
  disabled: boolean;
  evidence: PracticeDevelopmentEvidence;
  objective: PracticeDevelopmentObjective;
  onReview: (evidenceId: string, version: number, teamSummary: string, staffNote?: string) => Promise<unknown>;
}) {
  return (
    <NarrativeDialog
      confirmLabel="Mark evidence reviewed"
      description="Describe only what staff observed in this saved source. This does not claim that the team improved."
      disabled={disabled}
      title={`Review ${evidence.sourceLabel}`}
      trigger={<Button size="sm" variant="outline">Review source</Button>}
      onConfirm={(teamSummary, staffNote) => onReview(evidence.id, objective.version, teamSummary, staffNote)}
    />
  );
}

function evidenceLabel(evidence: PracticeDevelopmentEvidence) {
  if (evidence.state === "reviewed") return "Reviewed";
  if (evidence.state === "unavailable" || evidence.availability === "unavailable") return "Unavailable";
  return "Linked for review";
}

export function PracticeDevelopmentPanel({ games, reviewStatus, scrimId, scrimStartsAt }: PracticeDevelopmentPanelProps) {
  const { canManagePracticeDevelopment, canViewPracticeDevelopment } = useRole();
  const { tenant } = useTenant();
  const {
    archiveObjective,
    attachAction,
    createObjective,
    isLoading,
    isModuleAvailable,
    isSaving,
    linkEvidence,
    loop,
    queryError,
    recordUnavailable,
    retry,
    restoreObjective,
    reviewEvidence,
    transitionObjective,
    updateObjective,
  } = usePracticeDevelopment(scrimId);
  const [pendingAction, setPendingAction] = useState<{ id: string; title: string } | null>(null);

  const objective = loop?.objective || null;
  const pendingActionStorageKey = tenant?.id && objective
    ? `scrimstats:practice-development:pending-action:${tenant.id}:${objective.id}`
    : null;
  const evidence = loop?.evidence || emptyEvidence;
  const isStaffProjection = loop?.projection === "staff-v1";
  const canManage = Boolean(canManagePracticeDevelopment && isStaffProjection);
  const canView = Boolean(canViewPracticeDevelopment && loop);
  const planningOpen = new Date(scrimStartsAt).getTime() > Date.now();
  const canMutateObjective = Boolean(objective && !objective.isArchived && objective.availability === "available" && canManage);
  const canRestoreObjective = Boolean(objective?.isArchived && objective.availability === "available" && canManage);
  const canEditPlanning = Boolean(canMutateObjective && objective?.status === "planned" && planningOpen && evidence.length === 0);
  const reviewedEvidence = evidence.some((item) => item.state === "reviewed" && item.availability === "available");
  const canAssignFollowUp = Boolean(canMutateObjective && objective?.status === "evidenced" && reviewedEvidence);
  const completeAction = loop?.action?.availability === "available" && loop.action.status === "complete";
  const canComplete = reviewedEvidence && completeAction;
  const linkedSourceKeys = useMemo(
    () => new Set(evidence.flatMap((item) => {
      if (item.sourceMatchKey === "block_review") return ["block_review"];
      if (item.sourceType === "scrim_game" && item.sourceId) return [`scrim_game:${item.sourceId}`];
      return [];
    })),
    [evidence],
  );

  useEffect(() => {
    if (!pendingActionStorageKey) {
      setPendingAction(null);
      return;
    }
    if (loop?.action) {
      sessionStorage.removeItem(pendingActionStorageKey);
      setPendingAction(null);
      return;
    }
    try {
      const stored = sessionStorage.getItem(pendingActionStorageKey);
      if (!stored) {
        setPendingAction(null);
        return;
      }
      const parsed = JSON.parse(stored) as Record<string, unknown>;
      if (typeof parsed.id === "string" && typeof parsed.title === "string") {
        setPendingAction({ id: parsed.id, title: parsed.title });
      } else {
        sessionStorage.removeItem(pendingActionStorageKey);
        setPendingAction(null);
      }
    } catch {
      sessionStorage.removeItem(pendingActionStorageKey);
      setPendingAction(null);
    }
  }, [loop?.action, pendingActionStorageKey]);

  if (!isModuleAvailable) return null;

  if (isLoading) {
    return <DataSurface><WorkspaceState icon={Target} title="Loading practice objective" description="Reading the authorised development loop for this block." className="m-5" /></DataSurface>;
  }

  if (queryError || !loop) {
    return (
      <DataSurface>
        <WorkspaceState
          icon={AlertTriangle}
          title="Practice development is unavailable"
          description="The authorised objective view could not be loaded. No cached objective or controls are shown."
          className="m-5"
          action={<Button size="sm" variant="outline" onClick={() => void retry()}>Try again</Button>}
        />
      </DataSurface>
    );
  }

  if (!canView) return null;

  if (!objective) {
    return (
      <DataSurface>
        <div className="grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div>
            <p className="workspace-eyebrow text-[var(--workspace-accent)]">Elite practice development</p>
            <h2 className="mt-2 text-lg font-semibold">Plan one observable block objective</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--workspace-muted)]">
              Connect the intended focus to factual game or block-review evidence, then close the loop through an accountable action.
            </p>
            {!loop.planning.canCreate && (
              <p className="mt-3 inline-flex items-start gap-2 text-sm text-amber-200">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
                {practicePlanningUnavailableLabel(loop.planning.unavailableReason)}
              </p>
            )}
          </div>
          {canManage && loop.planning.canCreate && (
            <ObjectiveEditor disabled={isSaving} onSave={(input) => createObjective(input)} />
          )}
        </div>
      </DataSurface>
    );
  }

  async function attachCreatedAction(action: { id: string; title: string }) {
    if (!objective || !canMutateObjective) return;
    try {
      await attachAction({ actionId: action.id, expectedVersion: objective.version, objectiveId: objective.id });
      setPendingAction(null);
      if (pendingActionStorageKey) sessionStorage.removeItem(pendingActionStorageKey);
    } catch {
      // The action remains valid. Preserve its identifier for an explicit safe retry.
      setPendingAction(action);
      if (pendingActionStorageKey) sessionStorage.setItem(pendingActionStorageKey, JSON.stringify(action));
    }
  }

  const reopenedStatus: PracticeDevelopmentObjectiveStatus = reviewedEvidence ? "evidenced" : "planned";

  return (
    <DataSurface elevated={objective.status === "evidenced"} className="overflow-hidden">
      <div className="grid gap-5 border-b border-[var(--workspace-rule)] px-5 py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="workspace-eyebrow text-[var(--workspace-accent)]">Elite practice development</p>
            <ObjectiveState archived={objective.isArchived} availability={objective.availability} status={objective.status} />
            {!canManage && <span className="ss-mono text-xs uppercase text-[var(--workspace-subtle)]">Read only</span>}
          </div>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em]">{objective.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--workspace-muted)]">{objective.evidenceStandard}</p>
          {objective.teamStatusSummary && <p className="mt-4 border-l-2 border-[var(--workspace-accent)] pl-4 text-sm leading-6">{objective.teamStatusSummary}</p>}
          {objective.availability === "unavailable" && !objective.teamStatusSummary && (
            <p className="mt-4 border-l-2 border-amber-300/60 pl-4 text-sm leading-6 text-amber-100">
              A required block, evidence source, or linked follow-up cannot currently be resolved. The retained record is not presented as proof.
            </p>
          )}
          {canManage && objective.staffNote && (
            <div className="mt-4 border border-[var(--workspace-rule)] bg-[var(--workspace-surface-raised)] px-4 py-3">
              <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Staff-only context</p>
              <p className="mt-2 text-sm leading-6 text-[var(--workspace-muted)]">{objective.staffNote}</p>
            </div>
          )}
          {objective.isArchived && (
            <p className="mt-4 inline-flex items-start gap-2 text-sm text-[var(--workspace-muted)]">
              <Archive className="mt-0.5 h-4 w-4 shrink-0" />
              This retained objective is read-only. Staff can restore it without rewriting its evidence or audit history.
            </p>
          )}
        </div>
        {canManage && canEditPlanning && (
          <ObjectiveEditor
            disabled={isSaving}
            objective={objective}
            onSave={(input) => updateObjective({ ...input, expectedVersion: objective.version, objectiveId: objective.id })}
          />
        )}
      </div>

      <div className="grid lg:grid-cols-2">
        <section className="border-b border-[var(--workspace-rule)] p-5 lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="workspace-eyebrow text-[var(--workspace-subtle)]">Permitted evidence</p><h3 className="mt-2 font-semibold">Saved practice sources</h3></div>
            <span className="ss-mono text-xs uppercase text-[var(--workspace-subtle)]">{evidence.length} linked</span>
          </div>

          {evidence.length ? (
            <div className="mt-4 divide-y divide-[var(--workspace-rule)] border-y border-[var(--workspace-rule)]">
              {evidence.map((item) => (
                <div key={item.id} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.sourceLabel}</p>
                      <span className={cn("ss-mono text-xs uppercase", item.state === "reviewed" ? "text-emerald-300" : item.state === "unavailable" ? "text-amber-200" : "text-[var(--workspace-subtle)]")}>{evidenceLabel(item)}</span>
                    </div>
                    {item.teamSummary ? <p className="mt-1 text-sm leading-6 text-[var(--workspace-muted)]">{item.teamSummary}</p> : <p className="mt-1 text-sm text-[var(--workspace-subtle)]">A linked source is not reviewed evidence yet.</p>}
                    {canManage && item.staffNote && <p className="mt-2 text-xs leading-5 text-[var(--workspace-subtle)]">Staff only: {item.staffNote}</p>}
                  </div>
                  {canMutateObjective && item.state === "linked" && item.availability === "available" && (
                    <EvidenceReviewDialog
                      disabled={isSaving}
                      evidence={item}
                      objective={objective}
                      onReview={(evidenceId, version, teamSummary, staffNote) => reviewEvidence({ evidenceId, expectedVersion: version, staffNote, teamSummary })}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 border border-dashed border-[var(--workspace-rule)] p-4 text-sm leading-6 text-[var(--workspace-muted)]">
              Evidence is missing. A result or recorded game will not be treated as proof until staff explicitly link and review it.
            </p>
          )}

          {canMutateObjective && !planningOpen && ["planned", "evidenced"].includes(objective.status) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {games.filter((game) => game.status === "completed" && !linkedSourceKeys.has(`scrim_game:${game.id}`)).map((game) => (
                <Button key={game.id} size="sm" variant="outline" disabled={isSaving} onClick={() => void linkEvidence({ expectedVersion: objective.version, objectiveId: objective.id, sourceId: game.id, sourceType: "scrim_game" })}>
                  <Link2 className="h-4 w-4" /> Link game {game.gameNumber}
                </Button>
              ))}
              {reviewStatus === "complete" && !linkedSourceKeys.has("block_review") && (
                <Button size="sm" variant="outline" disabled={isSaving} onClick={() => void linkEvidence({ expectedVersion: objective.version, objectiveId: objective.id, sourceId: scrimId, sourceType: "block_review" })}>
                  <ClipboardCheck className="h-4 w-4" /> Link block review
                </Button>
              )}
              {!evidence.some((item) => item.sourceType === "declared_unavailable") && (
                <NarrativeDialog
                  confirmLabel="Record unavailable"
                  description="Record why qualifying evidence is unavailable. This never moves the objective to evidenced."
                  disabled={isSaving}
                  title="Record unavailable evidence"
                  trigger={<Button size="sm" variant="ghost"><AlertTriangle className="h-4 w-4" /> Evidence unavailable</Button>}
                  onConfirm={(teamSummary, staffNote) => recordUnavailable({ expectedVersion: objective.version, objectiveId: objective.id, staffNote, teamSummary })}
                />
              )}
            </div>
          )}
        </section>

        <section className="p-5">
          <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Accountable follow-up</p>
          {loop.action ? (
            <div className="mt-3 border border-[var(--workspace-rule)] bg-[var(--workspace-surface-raised)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{loop.action.title || "Follow-up unavailable"}</p><span className="ss-mono text-xs uppercase text-[var(--workspace-accent)]">{loop.action.status.replaceAll("_", " ")}</span></div>
              <p className="mt-2 text-sm text-[var(--workspace-muted)]">{loop.action.scopeLabel || (loop.action.availability === "available" ? "Team action" : "Follow-up details unavailable")}{loop.action.category ? ` / ${loop.action.category.replaceAll("_", " ")}` : ""}</p>
              {loop.action.availability === "unavailable" && (
                <p className="mt-2 text-sm leading-6 text-amber-100">The linked follow-up cannot currently be resolved. Its absence is not treated as completion.</p>
              )}
              <dl className="mt-3 grid gap-3 border-t border-[var(--workspace-rule)] pt-3 text-sm sm:grid-cols-2">
                <div><dt className="workspace-eyebrow text-[var(--workspace-subtle)]">Accountable owner</dt><dd className="mt-1">{loop.action.ownerLabel || "Unavailable"}</dd></div>
                <div><dt className="workspace-eyebrow text-[var(--workspace-subtle)]">Review by</dt><dd className="mt-1">{loop.action.dueAt ? new Date(loop.action.dueAt).toLocaleString() : "Unavailable"}</dd></div>
              </dl>
            </div>
          ) : (
            <div className="mt-3 border border-dashed border-[var(--workspace-rule)] p-4">
              <p className="text-sm leading-6 text-[var(--workspace-muted)]">No action is linked. Staff must explicitly assign one through the existing coaching-action workflow.</p>
              {canAssignFollowUp && !pendingAction && (
                <div className="mt-3">
                  <CoachingActionDialog
                    scrimId={scrimId}
                    requireDueAt
                    prefill={{
                      description: objective.evidenceStandard,
                      patternLabel: "Practice development",
                      title: `Follow up: ${objective.title}`.slice(0, 160),
                    }}
                    trigger={<Button size="sm"><ShieldCheck className="h-4 w-4" /> Assign follow-up</Button>}
                    onCreated={attachCreatedAction}
                  />
                </div>
              )}
              {canMutateObjective && !canAssignFollowUp && (
                <p className="mt-3 text-xs leading-5 text-[var(--workspace-subtle)]">Review at least one available evidence source and move the objective to evidenced before assigning the accountable follow-up.</p>
              )}
            </div>
          )}

          {pendingAction && canMutateObjective && !loop.action && (
            <div className="mt-3 border border-amber-300/25 bg-amber-300/[0.05] p-3 text-sm">
              <p className="font-medium text-amber-100">Action created; objective link still pending</p>
              <p className="mt-1 text-[var(--workspace-muted)]">{pendingAction.title} remains a valid action. Retry the link without creating another.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={isSaving} onClick={() => void attachCreatedAction(pendingAction)}>Retry link</Button>
                <Button size="sm" variant="ghost" asChild><Link to="/actions">Open existing action</Link></Button>
              </div>
            </div>
          )}

          <div className="mt-5 border-t border-[var(--workspace-rule)] pt-4">
            <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Next-session follow-up</p>
            <div className="mt-2 flex items-start gap-3">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--workspace-accent)]" />
              <div><p className="text-sm font-medium capitalize">{loop.nextSession?.status || "pending"}</p><p className="mt-1 text-sm leading-6 text-[var(--workspace-muted)]">{loop.nextSession?.label || "No next practice checkpoint is currently recorded."}</p></div>
            </div>
          </div>
        </section>
      </div>

      {(canMutateObjective || canRestoreObjective) && (
        <div className="flex flex-col gap-3 border-t border-[var(--workspace-rule)] px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="max-w-2xl text-xs leading-5 text-[var(--workspace-subtle)]">
            {objective.isArchived
              ? "Restoring reopens this retained record without rewriting its evidence, action link, or audit history."
              : "Completing this loop records an operational staff review. It does not prove lasting team or player improvement."}
          </p>
          <div className="flex flex-wrap gap-2">
            {objective.isArchived ? (
              <NarrativeDialog
                confirmLabel="Restore objective"
                description="Record why this objective is being restored. The prior lifecycle and linked evidence remain auditable."
                disabled={isSaving}
                title="Restore practice objective"
                trigger={<Button size="sm"><RotateCcw className="h-4 w-4" /> Restore</Button>}
                onConfirm={(teamStatusSummary, staffNote) => restoreObjective({ expectedVersion: objective.version, objectiveId: objective.id, staffNote, teamStatusSummary })}
              />
            ) : (
              <>
                {objective.status === "evidenced" && (
                  <NarrativeDialog
                    confirmLabel="Complete objective"
                    description={canComplete ? "Record the factual team-facing completion summary." : "Completion requires reviewed, available evidence and a completed linked action."}
                    disabled={isSaving || !canComplete}
                    title="Complete the practice loop"
                    trigger={<Button size="sm" disabled={!canComplete}><CheckCircle2 className="h-4 w-4" /> Complete</Button>}
                    onConfirm={(teamStatusSummary, staffNote) => transitionObjective({ expectedVersion: objective.version, nextStatus: "completed", objectiveId: objective.id, staffNote, teamStatusSummary })}
                  />
                )}
                {["planned", "evidenced"].includes(objective.status) && (
                  <NarrativeDialog
                    confirmLabel="Mark blocked"
                    description="Explain the operational blocker without turning missing evidence into a performance conclusion."
                    disabled={isSaving}
                    title="Block this objective"
                    trigger={<Button size="sm" variant="outline"><AlertTriangle className="h-4 w-4" /> Mark blocked</Button>}
                    onConfirm={(teamStatusSummary, staffNote) => transitionObjective({ expectedVersion: objective.version, nextStatus: "blocked", objectiveId: objective.id, staffNote, teamStatusSummary })}
                  />
                )}
                {["blocked", "completed"].includes(objective.status) && (
                  <NarrativeDialog
                    confirmLabel="Reopen objective"
                    description="Record why the loop needs another staff review. Existing evidence history is retained."
                    disabled={isSaving}
                    title="Reopen this objective"
                    trigger={<Button size="sm" variant="outline"><RotateCcw className="h-4 w-4" /> Reopen</Button>}
                    onConfirm={(teamStatusSummary, staffNote) => transitionObjective({ expectedVersion: objective.version, nextStatus: reopenedStatus, objectiveId: objective.id, staffNote, teamStatusSummary })}
                  />
                )}
                <NarrativeDialog
                  confirmLabel="Archive objective"
                  description="Archive this objective without deleting its evidence, action link, or audit history."
                  disabled={isSaving}
                  title="Archive practice objective"
                  trigger={<Button size="sm" variant="ghost" className="text-[var(--workspace-subtle)]"><Archive className="h-4 w-4" /> Archive</Button>}
                  variant="destructive"
                  onConfirm={(teamStatusSummary, staffNote) => archiveObjective({ expectedVersion: objective.version, objectiveId: objective.id, staffNote, teamStatusSummary })}
                />
              </>
            )}
          </div>
        </div>
      )}
    </DataSurface>
  );
}
