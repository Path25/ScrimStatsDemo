import { useMemo, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type ActionCategory, type ActionScope, type CoachingAction, useCoachingActions } from "@/hooks/useCoachingActions";
import { useOptimizedScrimsData } from "@/hooks/useOptimizedScrimsData";
import { usePlayersData } from "@/hooks/usePlayersData";

const categories: Array<[ActionCategory, string]> = [
  ["draft", "Draft"], ["laning", "Laning"], ["pathing", "Pathing"], ["vision", "Vision"],
  ["objectives", "Objectives"], ["teamfighting", "Teamfighting"], ["communication", "Communication"],
  ["macro", "Macro"], ["preparation", "Preparation"], ["review_discipline", "Review discipline"],
];

export interface CoachingActionPrefill {
  description?: string;
  patternLabel?: string;
  title?: string;
}

interface CoachingActionDialogProps {
  onCreated?: (action: CoachingAction) => Promise<void> | void;
  prefill?: CoachingActionPrefill;
  requireDueAt?: boolean;
  scrimGameId?: string;
  scrimId?: string;
  trigger?: ReactNode;
}

export function CoachingActionDialog({ onCreated, prefill, requireDueAt = false, scrimId, scrimGameId, trigger }: CoachingActionDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [scopeType, setScopeType] = useState<ActionScope>("player");
  const [category, setCategory] = useState<ActionCategory>("review_discipline");
  const [unitLabel, setUnitLabel] = useState("");
  const [assignee, setAssignee] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [dueAt, setDueAt] = useState("");
  const [checkpoints, setCheckpoints] = useState<string[]>([]);
  const [patternLabel, setPatternLabel] = useState("");
  const [templateId, setTemplateId] = useState("none");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const { players } = usePlayersData();
  const upcomingQuery = useOptimizedScrimsData({ mode: "upcoming", pageSize: 100 });
  const { createAction, saveTemplate, templates, isSaving } = useCoachingActions();
  const upcoming = useMemo(() => upcomingQuery.data?.scrims || [], [upcomingQuery.data?.scrims]);
  const activePlayers = players.filter((player) => player.is_active !== false && !player.archived_at);

  function toggle(list: string[], value: string, checked: boolean) {
    return checked ? [...new Set([...list, value])] : list.filter((item) => item !== value);
  }

  function resetForm(usePrefill: boolean) {
    setTitle(usePrefill ? prefill?.title || "" : "");
    setDescription(usePrefill ? prefill?.description || "" : "");
    setPriority("medium");
    setScopeType("player");
    setCategory("review_discipline");
    setUnitLabel("");
    setAssignee("");
    setParticipants([]);
    setDueAt("");
    setCheckpoints([]);
    setPatternLabel(usePrefill ? prefill?.patternLabel || "" : "");
    setTemplateId("none");
    setSaveAsTemplate(false);
  }

  function setDialogOpen(nextOpen: boolean) {
    if (nextOpen) resetForm(true);
    setOpen(nextOpen);
  }

  function applyTemplate(id: string) {
    setTemplateId(id);
    const template = templates.find((item) => item.id === id);
    if (!template) return;
    setTitle(template.title);
    setDescription(template.success_evidence || "");
    setCategory(template.category as ActionCategory);
    setScopeType(template.scope_type as ActionScope);
    setUnitLabel(template.unit_label || "");
    if (template.suggested_duration_days) {
      const due = new Date(Date.now() + template.suggested_duration_days * 86_400_000);
      setDueAt(new Date(due.getTime() - due.getTimezoneOffset() * 60_000).toISOString().slice(0, 16));
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const player = activePlayers.find((item) => item.id === assignee);
    const selectedParticipants = scopeType === "player" ? (assignee ? [assignee] : []) : participants;
    let action: CoachingAction;
    try {
      action = await createAction({
        title, description, priority, scopeType, unitLabel: scopeType === "unit" ? unitLabel : undefined, category,
        participantPlayerIds: selectedParticipants, assigneePlayerId: player?.id, assigneeUserId: player?.linked_user_id || undefined,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined, scrimId, scrimGameId,
        checkpointScrimIds: checkpoints, sourceType: scrimGameId ? "game" : scrimId ? "scrim" : "manual",
        patternLabel,
      });
    } catch {
      return;
    }
    try {
      await onCreated?.(action);
    } catch {
      // A created action is valid even when an optional linking callback fails.
    }
    if (saveAsTemplate) {
      try {
        await saveTemplate({ title, successEvidence: description, category, scopeType, unitLabel: scopeType === "unit" ? unitLabel : undefined });
      } catch {
        // Template persistence is optional and must not invite duplicate action creation.
      }
    }
    setOpen(false);
    resetForm(false);
  }

  const validScope = scopeType === "team" || (scopeType === "player" && assignee) || (scopeType === "unit" && unitLabel.trim() && participants.length >= 2);
  const validDueAt = !requireDueAt || Boolean(dueAt);

  return <Dialog open={open} onOpenChange={setDialogOpen}>
    <DialogTrigger asChild>{trigger || <Button size="sm"><Plus className="h-4 w-4" /> Assign action</Button>}</DialogTrigger>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Assign an action cycle</DialogTitle>
        <DialogDescription>Define one observable behaviour, where it came from, and the practice blocks where it should be checked.</DialogDescription>
      </DialogHeader>
      <form className="grid gap-5" onSubmit={(event) => void submit(event)}>
        {templates.length > 0 && <div className="grid gap-2"><Label>Start from a team template</Label><Select value={templateId} onValueChange={applyTemplate}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Blank action</SelectItem>{templates.map((template) => <SelectItem key={template.id} value={template.id}>{template.title}</SelectItem>)}</SelectContent></Select></div>}
        <div className="grid gap-2"><Label htmlFor="action-title">Action</Label><Input id="action-title" required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Call the first objective setup 60 seconds early" /></div>
        <div className="grid gap-2"><Label htmlFor="action-description">Success evidence</Label><Textarea id="action-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What should staff be able to observe in a later block?" /></div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2"><Label>Scope</Label><Select value={scopeType} onValueChange={(value) => setScopeType(value as ActionScope)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="player">Player</SelectItem><SelectItem value="unit">Role unit</SelectItem><SelectItem value="team">Whole team</SelectItem></SelectContent></Select></div>
          <div className="grid gap-2"><Label>Category</Label><Select value={category} onValueChange={(value) => setCategory(value as ActionCategory)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-2"><Label>Priority</Label><Select value={priority} onValueChange={(value) => setPriority(value as typeof priority)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select></div>
        </div>
        {scopeType === "unit" && <div className="grid gap-2"><Label htmlFor="action-unit">Unit name</Label><Input id="action-unit" value={unitLabel} onChange={(event) => setUnitLabel(event.target.value)} placeholder="Jungle + Mid" /></div>}
        {scopeType === "player" ? <div className="grid gap-2"><Label>Primary player</Label><Select value={assignee} onValueChange={setAssignee}><SelectTrigger><SelectValue placeholder="Select player" /></SelectTrigger><SelectContent>{activePlayers.map((player) => <SelectItem key={player.id} value={player.id}>{player.summoner_name}{player.linked_user_id ? "" : " (staff managed)"}</SelectItem>)}</SelectContent></Select></div> : <fieldset className="grid gap-3"><legend className="text-sm font-medium">Participating players {scopeType === "team" && <span className="font-normal text-[var(--workspace-muted)]">(optional)</span>}</legend><div className="grid gap-2 sm:grid-cols-2">{activePlayers.map((player) => <label key={player.id} className="flex min-h-10 items-center gap-3 border border-[var(--workspace-rule)] px-3 text-sm"><Checkbox checked={participants.includes(player.id)} onCheckedChange={(checked) => setParticipants((current) => toggle(current, player.id, checked === true))} />{player.summoner_name}</label>)}</div></fieldset>}
        <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="action-due">Review by{requireDueAt ? " (required)" : ""}</Label><Input id="action-due" type="datetime-local" required={requireDueAt} value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></div><div className="grid gap-2"><Label htmlFor="action-pattern">Recurring pattern</Label><Input id="action-pattern" value={patternLabel} onChange={(event) => setPatternLabel(event.target.value)} placeholder="Late objective setup" /></div></div>
        <fieldset className="grid gap-3"><legend className="text-sm font-medium">Practice checkpoints</legend><p className="text-sm leading-6 text-[var(--workspace-muted)]">The action appears before these blocks and remains linked when staff review the outcome.</p><div className="grid max-h-40 gap-2 overflow-y-auto">{upcoming.map((scrim) => <label key={scrim.id} className="flex min-h-10 items-center gap-3 border border-[var(--workspace-rule)] px-3 text-sm"><Checkbox checked={checkpoints.includes(scrim.id)} onCheckedChange={(checked) => setCheckpoints((current) => toggle(current, scrim.id, checked === true))} /><span className="min-w-0 flex-1 truncate">{scrim.opponent_name}</span><span className="text-[var(--workspace-subtle)]">{new Date(scrim.starts_at || scrim.scheduled_time || scrim.match_date).toLocaleDateString()}</span></label>)}</div>{!upcoming.length && <p className="text-sm text-[var(--workspace-muted)]">No upcoming practice blocks are available yet.</p>}</fieldset>
        <label className="flex items-center gap-3 text-sm"><Checkbox checked={saveAsTemplate} onCheckedChange={(checked) => setSaveAsTemplate(checked === true)} />Save this definition as a reusable team template</label>
        <DialogFooter><Button type="submit" disabled={isSaving || !title.trim() || !validScope || !validDueAt}>{isSaving ? "Assigning..." : "Assign action cycle"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
