import { useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  ClipboardCheck,
  FileWarning,
  Link2,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Unlink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DataSurface } from "@/components/workspace/DataSurface";
import { WorkspaceState } from "@/components/workspace/WorkspaceState";
import { useOpponentPreparation } from "@/hooks/useOpponentPreparation";
import { cn } from "@/lib/utils";
import type {
  OpponentPreparationDraftInput,
  OpponentPreparationEvidence,
  OpponentPreparationRevision,
  OpponentPreparationSourceType,
} from "@/types/opponentPreparation";
import type { WorkspaceModuleAccess } from "@/types/workspaceModules";

type DialogKind = "create" | "edit" | "evidence" | "action" | "review" | "remove-review" | "archive" | "restore" | null;

const initialDraft: OpponentPreparationDraftInput & { playbookTitle: string } = {
  contextLabel: "",
  fixtureScrimId: "",
  patchLabel: "",
  playbookTitle: "",
  staffJudgement: "",
  title: "",
};

function displayDate(value?: string) {
  if (!value) return "Date not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date not recorded" : date.toLocaleString();
}

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

function StatusMark({ value }: { value: string }) {
  const positive = value === "approved" || value === "available" || value === "complete";
  const warning = value === "draft" || value === "superseded" || value === "insufficient" || value === "unavailable";
  return (
    <span className={cn(
      "inline-flex min-h-6 items-center border px-2 ss-mono text-[10px] uppercase tracking-[0.08em]",
      positive && "border-emerald-400/30 bg-emerald-400/[0.06] text-emerald-300",
      warning && "border-amber-300/25 bg-amber-300/[0.05] text-amber-200",
      !positive && !warning && "border-[var(--workspace-rule)] text-[var(--workspace-subtle)]",
    )}>
      {humanize(value)}
    </span>
  );
}

function EvidenceRecord({ evidence }: { evidence: OpponentPreparationEvidence }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusMark value={evidence.availability} />
        <span className="ss-mono text-[10px] uppercase text-[var(--workspace-subtle)]">{humanize(evidence.sourceType)}</span>
      </div>
      <div>
        <p className="text-sm font-medium">{evidence.sourceLabel}</p>
        <p className="mt-1 text-xs text-[var(--workspace-subtle)]">
          {displayDate(evidence.sourceRecordedAt)} · {evidence.sourcePatchLabel ? `Patch ${evidence.sourcePatchLabel}` : "Patch not recorded"}
        </p>
      </div>
      {evidence.sourceSummary && <p className="text-sm leading-6 text-[var(--workspace-muted)]">{evidence.sourceSummary}</p>}
      {evidence.sourceContext && <p className="text-xs leading-5 text-[var(--workspace-subtle)]">Recorded context: {evidence.sourceContext}</p>}
      {evidence.staffRelevanceNote && <p className="border-l-2 border-violet-300/50 pl-3 text-sm text-violet-100">Staff relevance: {evidence.staffRelevanceNote}</p>}
      {evidence.insufficientReason && <p className="border-l-2 border-amber-300/50 pl-3 text-sm text-amber-100">Why evidence is insufficient: {evidence.insufficientReason}</p>}
    </div>
  );
}

function RevisionSummary({ revision }: { revision: OpponentPreparationRevision }) {
  return (
    <div className="grid gap-3 border-y border-[var(--workspace-rule)] py-4 text-sm sm:grid-cols-3">
      <div>
        <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Fixture</p>
        <p className="mt-1.5">{revision.fixtureLabel || "Fixture not recorded"}</p>
        {revision.fixtureAvailability === "unavailable" && <p className="mt-1 text-xs text-amber-200">Linked fixture is unavailable.</p>}
      </div>
      <div>
        <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Context</p>
        <p className="mt-1.5">{revision.contextLabel || "Context not recorded"}</p>
      </div>
      <div>
        <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Patch</p>
        <p className="mt-1.5">{revision.patchLabel || "Patch not recorded"}</p>
      </div>
    </div>
  );
}

function approvalBlockers(revision: OpponentPreparationRevision) {
  const blockers: string[] = [];
  if (!revision.staffJudgement.trim()) blockers.push("Record explicit staff judgement.");
  if (!revision.evidence.some((item) => ["scouting_evidence", "preparation_brief", "declared_insufficient"].includes(item.sourceType) && ["available", "insufficient"].includes(item.availability))) {
    blockers.push("Link qualifying opponent evidence or record why evidence is insufficient.");
  }
  if (revision.evidence.some((item) => item.availability === "unavailable" || item.availability === "superseded")) {
    blockers.push("Remove or replace unavailable or superseded evidence.");
  }
  if (!revision.actions.some((item) => item.availability === "available")) blockers.push("Link at least one active Coaching Action.");
  return blockers;
}

export function OpponentPreparationPanel({ module, opponentId }: { module: WorkspaceModuleAccess; opponentId: string }) {
  const preparation = useOpponentPreparation(opponentId, module);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [draft, setDraft] = useState(initialDraft);
  const [selectedEvidence, setSelectedEvidence] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedReview, setSelectedReview] = useState("");
  const [relevanceNote, setRelevanceNote] = useState("");
  const [insufficientReason, setInsufficientReason] = useState("");
  const [outcomeSummary, setOutcomeSummary] = useState("");
  const [reason, setReason] = useState("");
  const [activeRevisionId, setActiveRevisionId] = useState("");

  const playbook = preparation.projection?.playbook;
  const revisions = playbook?.revisions || [];
  const draftRevision = revisions.find((item) => item.status === "draft");
  const approvedRevisions = revisions.filter((item) => item.status === "approved");
  const evidenceChoices = preparation.options?.evidence || [];
  const actionChoices = preparation.options?.actions || [];
  const scrimChoices = preparation.options?.scrims || [];
  const completedReviewChoices = scrimChoices.filter((item) => item.reviewStatus === "complete");
  const selectedRevision = revisions.find((item) => item.id === activeRevisionId);
  const blockers = draftRevision ? approvalBlockers(draftRevision) : [];

  const linkedEvidenceKeys = useMemo(
    () => new Set((draftRevision?.evidence || []).map((item) => `${item.sourceType}:${item.sourceId || "insufficient"}`)),
    [draftRevision?.evidence],
  );
  const linkedActionIds = useMemo(
    () => new Set((draftRevision?.actions || []).map((item) => item.id).filter(Boolean)),
    [draftRevision?.actions],
  );

  if (!preparation.isModuleAvailable) return null;

  function closeDialog() {
    setDialog(null);
    setDraft(initialDraft);
    setSelectedEvidence("");
    setSelectedAction("");
    setSelectedReview("");
    setRelevanceNote("");
    setInsufficientReason("");
    setOutcomeSummary("");
    setReason("");
    setActiveRevisionId("");
  }

  function openEdit(revision: OpponentPreparationRevision) {
    setDraft({
      contextLabel: revision.contextLabel || "",
      fixtureScrimId: revision.fixtureScrimId || "",
      patchLabel: revision.patchLabel || "",
      playbookTitle: playbook?.title || "",
      staffJudgement: revision.staffJudgement,
      title: revision.title,
    });
    setActiveRevisionId(revision.id);
    setDialog("edit");
  }

  function openReview(revision: OpponentPreparationRevision, kind: "review" | "remove-review") {
    setActiveRevisionId(revision.id);
    setDialog(kind);
  }

  async function submitDraft() {
    if (dialog === "create") {
      await preparation.createPlaybook(draft);
    } else if (dialog === "edit" && selectedRevision) {
      await preparation.updateDraft(selectedRevision.id, selectedRevision.version, draft);
    }
    closeDialog();
  }

  async function submitEvidence() {
    if (!draftRevision) return;
    if (selectedEvidence === "declared_insufficient") {
      await preparation.linkEvidence({
        expectedVersion: draftRevision.version,
        insufficientReason,
        kind: "link-evidence",
        revisionId: draftRevision.id,
        sourceType: "declared_insufficient",
      });
    } else {
      const [type, id] = selectedEvidence.split(":") as [OpponentPreparationSourceType, string];
      await preparation.linkEvidence({
        expectedVersion: draftRevision.version,
        kind: "link-evidence",
        relevanceNote,
        revisionId: draftRevision.id,
        sourceId: id,
        sourceType: type,
      });
    }
    closeDialog();
  }

  async function submitAction() {
    if (!draftRevision || !selectedAction) return;
    await preparation.linkAction(draftRevision.id, draftRevision.version, selectedAction);
    closeDialog();
  }

  async function submitReview() {
    if (!selectedRevision) return;
    if (dialog === "review") await preparation.linkReview(selectedRevision.id, selectedReview, outcomeSummary);
    if (dialog === "remove-review" && selectedRevision.review) await preparation.unlinkReview(selectedRevision.review.linkId, reason);
    closeDialog();
  }

  async function submitArchive() {
    if (!playbook) return;
    if (dialog === "archive") await preparation.archivePlaybook(playbook.id, playbook.version, reason);
    if (dialog === "restore") await preparation.restorePlaybook(playbook.id, playbook.version, reason);
    closeDialog();
  }

  if (preparation.isLoading) {
    return <WorkspaceState icon={ShieldCheck} title="Loading opponent preparation…" description="Reading the private staff preparation record and its linked evidence." />;
  }

  if (preparation.queryError || !preparation.projection) {
    return (
      <WorkspaceState
        icon={FileWarning}
        title="Opponent preparation could not be loaded"
        description="The private preparation record is temporarily unavailable. Existing Scouting data remains unchanged."
        action={<Button variant="outline" onClick={() => void preparation.retry()}>Try again</Button>}
      />
    );
  }

  if (!playbook) {
    return (
      <>
        <DataSurface elevated className="border-[var(--workspace-accent)]/25 p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl">
              <p className="workspace-eyebrow text-[var(--workspace-accent)]">Elite staff workspace</p>
              <h2 className="mt-2 text-xl font-semibold">Opponent preparation</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--workspace-muted)]">Build a season-long preparation record from this workspace’s existing evidence, staff judgement and canonical Coaching Actions. Missing evidence stays explicit.</p>
            </div>
            <Button onClick={() => setDialog("create")}><Plus className="h-4 w-4" /> Start preparation</Button>
          </div>
        </DataSurface>
        <PreparationDialog
          dialog={dialog}
          draft={draft}
          isSaving={preparation.isSaving}
          onClose={closeDialog}
          onDraftChange={setDraft}
          onSubmitDraft={submitDraft}
          scrims={scrimChoices}
        />
      </>
    );
  }

  return (
    <>
      <DataSurface elevated className="overflow-hidden border-[var(--workspace-accent)]/25">
        <div className="border-b border-[var(--workspace-rule)] p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="workspace-eyebrow text-[var(--workspace-accent)]">Opponent preparation</p>
                {playbook.isArchived && <StatusMark value="archived" />}
              </div>
              <h2 className="mt-2 text-xl font-semibold">{playbook.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--workspace-muted)]">Staff judgement remains distinct from dated tenant-owned evidence. Approved revisions are immutable.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!playbook.isArchived && draftRevision && <Button variant="outline" onClick={() => openEdit(draftRevision)}><Pencil className="h-4 w-4" /> Edit draft</Button>}
              {!playbook.isArchived && !draftRevision && approvedRevisions.length > 0 && <Button onClick={() => void preparation.createRevision(playbook.id, playbook.version)} disabled={preparation.isSaving}><Plus className="h-4 w-4" /> New revision</Button>}
              {!playbook.isArchived ? (
                <Button variant="ghost" onClick={() => setDialog("archive")}><Archive className="h-4 w-4" /> Archive</Button>
              ) : (
                <Button variant="outline" onClick={() => setDialog("restore")}><RotateCcw className="h-4 w-4" /> Restore</Button>
              )}
            </div>
          </div>
        </div>

        {draftRevision && !playbook.isArchived && (
          <section className="border-b border-[var(--workspace-rule)] p-5 sm:p-6" aria-labelledby="opponent-preparation-draft">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2"><StatusMark value="draft" /><span className="ss-mono text-xs text-[var(--workspace-subtle)]">Revision {draftRevision.revisionNumber}</span></div>
                <h3 id="opponent-preparation-draft" className="mt-3 text-lg font-semibold">{draftRevision.title}</h3>
              </div>
              <Button disabled={preparation.isSaving || blockers.length > 0} onClick={() => void preparation.approveRevision(draftRevision.id, draftRevision.version)}>
                <CheckCircle2 className="h-4 w-4" /> Approve revision
              </Button>
            </div>
            <RevisionSummary revision={draftRevision} />
            <div className="mt-5 border-l-2 border-violet-300/60 pl-4">
              <p className="workspace-eyebrow text-violet-200">Staff judgement</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{draftRevision.staffJudgement || "Staff judgement not recorded"}</p>
            </div>
            {blockers.length > 0 && (
              <div className="mt-5 border border-amber-300/20 bg-amber-300/[0.04] p-4">
                <p className="text-sm font-medium text-amber-100">Approval needs attention</p>
                <ul className="mt-2 space-y-1 text-sm text-amber-100/80">{blockers.map((blocker) => <li key={blocker}>• {blocker}</li>)}</ul>
              </div>
            )}
            {preparation.optionsError && (
              <div className="mt-5 flex flex-col gap-3 border border-amber-300/20 bg-amber-300/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-100">Linked-record choices could not be loaded</p>
                  <p className="mt-1 text-sm text-amber-100/80">The preparation record is unchanged. Retry before linking evidence, actions or a review.</p>
                </div>
                <Button variant="outline" onClick={() => void preparation.refresh()}>Try again</Button>
              </div>
            )}
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <div>
                <div className="flex items-center justify-between gap-3"><h4 className="font-medium">Evidence reviewed</h4><Button size="sm" variant="outline" onClick={() => setDialog("evidence")}><Link2 className="h-4 w-4" /> Link</Button></div>
                {draftRevision.evidence.length ? <div className="mt-3 divide-y divide-[var(--workspace-rule)] border border-[var(--workspace-rule)]">{draftRevision.evidence.map((item) => <div key={item.id} className="p-4"><EvidenceRecord evidence={item} /><Button className="mt-3" size="sm" variant="ghost" disabled={preparation.isSaving} onClick={() => void preparation.unlinkEvidence(item.id, draftRevision.version)}><Unlink className="h-3.5 w-3.5" /> Remove from draft</Button></div>)}</div> : <p className="mt-3 text-sm text-[var(--workspace-subtle)]">No evidence linked. Record insufficiency rather than filling this gap with an assumption.</p>}
              </div>
              <div>
                <div className="flex items-center justify-between gap-3"><h4 className="font-medium">Preparation actions</h4><Button size="sm" variant="outline" onClick={() => setDialog("action")}><Link2 className="h-4 w-4" /> Link</Button></div>
                {draftRevision.actions.length ? <div className="mt-3 divide-y divide-[var(--workspace-rule)] border border-[var(--workspace-rule)]">{draftRevision.actions.map((action) => <div key={action.linkId} className="p-4"><div className="flex flex-wrap items-center gap-2"><StatusMark value={action.availability === "unavailable" ? "unavailable" : action.status} /><span className="ss-mono text-[10px] uppercase text-[var(--workspace-subtle)]">{action.category || "category not recorded"}</span></div><p className="mt-2 text-sm font-medium">{action.title}</p><p className="mt-1 text-xs text-[var(--workspace-subtle)]">{action.ownerLabel || "Owner unavailable"} · {action.dueAt ? displayDate(action.dueAt) : "No review date"}</p><Button className="mt-3" size="sm" variant="ghost" disabled={preparation.isSaving} onClick={() => void preparation.unlinkAction(action.linkId, draftRevision.version)}><Unlink className="h-3.5 w-3.5" /> Remove from draft</Button></div>)}</div> : <p className="mt-3 text-sm text-[var(--workspace-subtle)]">No canonical Coaching Action is linked.</p>}
              </div>
            </div>
          </section>
        )}

        <section className="p-5 sm:p-6" aria-labelledby="opponent-preparation-history">
          <div className="flex items-center justify-between gap-4"><div><h3 id="opponent-preparation-history" className="font-semibold">Approved history</h3><p className="mt-1 text-sm text-[var(--workspace-muted)]">Exact preparation revisions retained for later review.</p></div><span className="ss-mono text-xs text-[var(--workspace-subtle)]">{approvedRevisions.length} approved</span></div>
          {approvedRevisions.length ? <div className="mt-4 space-y-4">{approvedRevisions.map((revision) => <article key={revision.id} className="border border-[var(--workspace-rule)] p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><StatusMark value="approved" /><span className="ss-mono text-xs text-[var(--workspace-subtle)]">Revision {revision.revisionNumber}</span></div><h4 className="mt-2 font-semibold">{revision.title}</h4><p className="mt-1 text-xs text-[var(--workspace-subtle)]">Approved {displayDate(revision.approvedAt)}</p></div>{!playbook.isArchived && (!revision.review ? <Button size="sm" variant="outline" onClick={() => openReview(revision, "review")}><Link2 className="h-4 w-4" /> Link completed review</Button> : <Button size="sm" variant="ghost" onClick={() => openReview(revision, "remove-review")}><Unlink className="h-4 w-4" /> Remove review link</Button>)}</div><RevisionSummary revision={revision} /><div className="mt-4 border-l-2 border-violet-300/60 pl-4"><p className="workspace-eyebrow text-violet-200">Staff judgement</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{revision.staffJudgement}</p></div><details className="mt-5"><summary className="cursor-pointer text-sm font-medium">Linked evidence and actions</summary><div className="mt-4 grid gap-5 xl:grid-cols-2"><div className="space-y-4">{revision.evidence.map((item) => <EvidenceRecord key={item.id} evidence={item} />)}</div><div className="space-y-3">{revision.actions.map((action) => <div key={action.linkId}><div className="flex flex-wrap items-center gap-2"><StatusMark value={action.availability === "unavailable" ? "unavailable" : action.status} /><span className="text-sm font-medium">{action.title}</span></div><p className="mt-1 text-xs text-[var(--workspace-subtle)]">{action.ownerLabel || "Owner unavailable"}</p></div>)}</div></div></details><div className="mt-5 border-t border-[var(--workspace-rule)] pt-4"><p className="workspace-eyebrow text-[var(--workspace-subtle)]">Review outcome</p>{revision.review ? <div className="mt-2"><div className="flex flex-wrap items-center gap-2"><StatusMark value={revision.review.availability} /><span className="text-sm font-medium">{revision.review.label}</span></div><p className="mt-2 text-sm leading-6 text-[var(--workspace-muted)]">{revision.review.staffOutcomeSummary}</p></div> : <p className="mt-2 text-sm text-[var(--workspace-subtle)]">Review not recorded</p>}</div></article>)}</div> : <WorkspaceState icon={ClipboardCheck} title="No approved revisions" description="Complete the current draft’s evidence, action and staff judgement before approval." className="mt-4" />}
        </section>
      </DataSurface>

      <PreparationDialog dialog={dialog} draft={draft} isSaving={preparation.isSaving} onClose={closeDialog} onDraftChange={setDraft} onSubmitDraft={submitDraft} scrims={scrimChoices} />

      <Dialog open={dialog === "evidence"} onOpenChange={(open) => !open && closeDialog()}><DialogContent><DialogHeader><DialogTitle>Link preparation evidence</DialogTitle><DialogDescription>Choose an existing tenant-owned record, or state why qualifying evidence is insufficient.</DialogDescription></DialogHeader><div className="grid gap-5"><div className="grid gap-2"><Label>Evidence source</Label><Select value={selectedEvidence} onValueChange={setSelectedEvidence}><SelectTrigger><SelectValue placeholder="Choose evidence" /></SelectTrigger><SelectContent><SelectItem value="declared_insufficient">Evidence is insufficient</SelectItem>{evidenceChoices.filter((item) => !linkedEvidenceKeys.has(`${item.sourceType}:${item.id}`)).map((item) => <SelectItem key={`${item.sourceType}:${item.id}`} value={`${item.sourceType}:${item.id}`}>{item.label} · {humanize(item.sourceType)} · {new Date(item.recordedAt).toLocaleDateString()}</SelectItem>)}</SelectContent></Select></div>{selectedEvidence === "declared_insufficient" ? <div className="grid gap-2"><Label htmlFor="opponent-preparation-insufficient">Why is evidence insufficient?</Label><Textarea id="opponent-preparation-insufficient" maxLength={1000} value={insufficientReason} onChange={(event) => setInsufficientReason(event.target.value)} /></div> : <div className="grid gap-2"><Label htmlFor="opponent-preparation-relevance">Staff relevance note (optional)</Label><Textarea id="opponent-preparation-relevance" maxLength={1000} value={relevanceNote} onChange={(event) => setRelevanceNote(event.target.value)} /></div>}</div><DialogFooter><Button variant="outline" onClick={closeDialog}>Cancel</Button><Button disabled={preparation.isSaving || !selectedEvidence || (selectedEvidence === "declared_insufficient" && !insufficientReason.trim())} onClick={() => void submitEvidence()}>{preparation.isSaving ? "Linking…" : "Link evidence"}</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={dialog === "action"} onOpenChange={(open) => !open && closeDialog()}><DialogContent><DialogHeader><DialogTitle>Link a preparation action</DialogTitle><DialogDescription>Link an existing canonical Coaching Action. Its owner and lifecycle remain managed in Action Cycles.</DialogDescription></DialogHeader><div className="grid gap-2"><Label>Coaching Action</Label><Select value={selectedAction} onValueChange={setSelectedAction}><SelectTrigger><SelectValue placeholder="Choose an action" /></SelectTrigger><SelectContent>{actionChoices.filter((item) => !linkedActionIds.has(item.id)).map((item) => <SelectItem key={item.id} value={item.id}>{item.label} · {humanize(item.status)}</SelectItem>)}</SelectContent></Select></div><DialogFooter><Button variant="outline" onClick={closeDialog}>Cancel</Button><Button disabled={preparation.isSaving || !selectedAction} onClick={() => void submitAction()}>Link action</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={dialog === "review" || dialog === "remove-review"} onOpenChange={(open) => !open && closeDialog()}><DialogContent><DialogHeader><DialogTitle>{dialog === "review" ? "Link a completed review" : "Remove the review link"}</DialogTitle><DialogDescription>{dialog === "review" ? "Record which completed same-opponent Scrim Block review shows what staff tested." : "The approved preparation stays unchanged; this later review-link change remains audited."}</DialogDescription></DialogHeader>{dialog === "review" ? <div className="grid gap-5"><div className="grid gap-2"><Label>Completed Scrim Block</Label><Select value={selectedReview} onValueChange={setSelectedReview}><SelectTrigger><SelectValue placeholder="Choose a completed review" /></SelectTrigger><SelectContent>{completedReviewChoices.map((item) => <SelectItem key={item.id} value={item.id}>{item.label} · {new Date(item.startsAt).toLocaleDateString()}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label htmlFor="opponent-preparation-outcome">What did staff test?</Label><Textarea id="opponent-preparation-outcome" maxLength={2000} value={outcomeSummary} onChange={(event) => setOutcomeSummary(event.target.value)} /></div></div> : <div className="grid gap-2"><Label htmlFor="opponent-preparation-review-remove">Why is this link being removed?</Label><Textarea id="opponent-preparation-review-remove" maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} /></div>}<DialogFooter><Button variant="outline" onClick={closeDialog}>Cancel</Button><Button disabled={preparation.isSaving || (dialog === "review" ? !selectedReview || !outcomeSummary.trim() : !reason.trim())} onClick={() => void submitReview()}>{dialog === "review" ? "Link review" : "Remove link"}</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={dialog === "archive" || dialog === "restore"} onOpenChange={(open) => !open && closeDialog()}><DialogContent><DialogHeader><DialogTitle>{dialog === "archive" ? "Archive preparation playbook" : "Restore preparation playbook"}</DialogTitle><DialogDescription>History is retained. Record a reason so the lifecycle remains understandable.</DialogDescription></DialogHeader><div className="grid gap-2"><Label htmlFor="opponent-preparation-lifecycle-reason">Reason</Label><Textarea id="opponent-preparation-lifecycle-reason" maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} /></div><DialogFooter><Button variant="outline" onClick={closeDialog}>Cancel</Button><Button disabled={preparation.isSaving || !reason.trim()} onClick={() => void submitArchive()}>{dialog === "archive" ? "Archive playbook" : "Restore playbook"}</Button></DialogFooter></DialogContent></Dialog>
    </>
  );
}

function PreparationDialog({ dialog, draft, isSaving, onClose, onDraftChange, onSubmitDraft, scrims }: {
  dialog: DialogKind;
  draft: OpponentPreparationDraftInput & { playbookTitle: string };
  isSaving: boolean;
  onClose: () => void;
  onDraftChange: (value: OpponentPreparationDraftInput & { playbookTitle: string }) => void;
  onSubmitDraft: () => Promise<void>;
  scrims: Array<{ id: string; label: string; startsAt: string }>;
}) {
  const open = dialog === "create" || dialog === "edit";
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialog === "create" ? "Start opponent preparation" : "Edit preparation draft"}</DialogTitle>
          <DialogDescription>Staff judgement is editorial. Patch and context remain unrecorded unless entered explicitly.</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[65vh] gap-5 overflow-y-auto pr-1">
          {dialog === "create" && <div className="grid gap-2"><Label htmlFor="opponent-preparation-playbook-title">Season-long playbook title</Label><Input id="opponent-preparation-playbook-title" maxLength={140} value={draft.playbookTitle} onChange={(event) => onDraftChange({ ...draft, playbookTitle: event.target.value })} /></div>}
          <div className="grid gap-2"><Label htmlFor="opponent-preparation-revision-title">Match-week revision title</Label><Input id="opponent-preparation-revision-title" maxLength={140} value={draft.title} onChange={(event) => onDraftChange({ ...draft, title: event.target.value })} /></div>
          <div className="grid gap-2"><Label>Fixture (optional)</Label><Select value={draft.fixtureScrimId || "not_recorded"} onValueChange={(value) => onDraftChange({ ...draft, fixtureScrimId: value === "not_recorded" ? "" : value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="not_recorded">Fixture not recorded</SelectItem>{scrims.map((item) => <SelectItem key={item.id} value={item.id}>{item.label} · {new Date(item.startsAt).toLocaleDateString()}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-2"><Label htmlFor="opponent-preparation-context">Recorded context (optional)</Label><Input id="opponent-preparation-context" maxLength={300} value={draft.contextLabel} onChange={(event) => onDraftChange({ ...draft, contextLabel: event.target.value })} placeholder="Best of three, playoff week, or not recorded" /></div>
          <div className="grid gap-2"><Label htmlFor="opponent-preparation-patch">Recorded patch (optional)</Label><Input id="opponent-preparation-patch" maxLength={40} value={draft.patchLabel} onChange={(event) => onDraftChange({ ...draft, patchLabel: event.target.value })} placeholder="Only enter a patch that is actually recorded" /></div>
          <div className="grid gap-2"><Label htmlFor="opponent-preparation-judgement">Staff judgement</Label><Textarea id="opponent-preparation-judgement" maxLength={4000} value={draft.staffJudgement} onChange={(event) => onDraftChange({ ...draft, staffJudgement: event.target.value })} placeholder="Clearly separate your interpretation from the linked source evidence." /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={isSaving || !draft.title.trim() || (dialog === "create" && !draft.playbookTitle.trim())} onClick={() => void onSubmitDraft()}>{isSaving ? "Saving…" : "Save draft"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
