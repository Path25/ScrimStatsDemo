import { useMemo, useState, type DragEvent } from "react";
import { AlertTriangle, GitBranch, Pencil, Search, X } from "lucide-react";

import { ChampionAvatar } from "@/components/scrims/ChampionAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataSurface } from "@/components/workspace/DataSurface";
import { useChampionCatalog } from "@/hooks/useChampionCatalog";
import { dedupeChampionImageCandidates, isStagingAvatarQaFixtureEnabled, STAGING_AVATAR_QA_FAILURE_URL } from "@/lib/champion-avatar";
import {
  DRAFT_SEQUENCE,
  sequenceSlot,
  validateDraftScenario,
  type DraftActionRecord,
  type DraftActionType,
  type DraftOwner,
  type DraftSide,
} from "@/lib/draft-workspace";
import { cn } from "@/lib/utils";

const phaseLabels = { ban_1: "First bans", pick_1: "First picks", ban_2: "Second bans", pick_2: "Final picks" } as const;

export function DraftSequenceBoard({
  side,
  actions,
  restrictions,
  canEdit,
  onSelectSlot,
  onPlaceChampion,
  onDelete,
  onBranch,
}: {
  side: DraftSide;
  actions: DraftActionRecord[];
  restrictions: string[];
  canEdit: boolean;
  onSelectSlot: (sequence: number, action?: DraftActionRecord) => void;
  onPlaceChampion: (sequence: number, champion: string, action?: DraftActionRecord) => void;
  onDelete: (id: string) => void;
  onBranch: (sequence: number) => void;
}) {
  const catalog = useChampionCatalog();
  const [query, setQuery] = useState("");
  const [selectedChampion, setSelectedChampion] = useState<string | null>(null);
  const bySequence = new Map(actions.map((action) => [action.sequence_number, action]));
  const issues = validateDraftScenario(actions, side, restrictions);
  const restricted = useMemo(() => new Set(restrictions.map((name) => name.toLocaleLowerCase())), [restrictions]);
  const avatarQaFixtureEnabled = isStagingAvatarQaFixtureEnabled();
  const champions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return dedupeChampionImageCandidates(catalog.data || []).filter((champion) => !normalized || champion.name.toLocaleLowerCase().includes(normalized));
  }, [catalog.data, query]);

  function place(sequence: number, champion: string) {
    if (!canEdit || restricted.has(champion.toLocaleLowerCase())) return;
    onPlaceChampion(sequence, champion, bySequence.get(sequence));
    setSelectedChampion(null);
  }

  function receiveDrop(event: DragEvent, sequence: number) {
    event.preventDefault();
    const champion = event.dataTransfer.getData("text/plain");
    if (champion) place(sequence, champion);
  }

  function ownerSlots(owner: DraftOwner, actionType: DraftActionType) {
    return DRAFT_SEQUENCE.flatMap((slot) => {
      const expected = sequenceSlot(slot.sequence, side);
      return expected?.teamSide === owner && slot.actionType === actionType ? [slot] : [];
    });
  }

  function slotAction(sequence: number, compact = false) {
    const action = bySequence.get(sequence);
    const slot = DRAFT_SEQUENCE[sequence - 1];
    const isSelectedTarget = Boolean(selectedChampion && canEdit);
    return (
      <button
        type="button"
        onDragOver={(event) => canEdit && event.preventDefault()}
        onDrop={(event) => receiveDrop(event, sequence)}
        onClick={() => selectedChampion ? place(sequence, selectedChampion) : onSelectSlot(sequence, action)}
        disabled={!canEdit}
        className={cn(
          "group/slot relative flex w-full flex-col items-center justify-center border text-center transition-colors disabled:cursor-default",
          compact ? "min-h-12 px-2 py-1.5" : "min-h-28 p-2",
          action ? "border-[var(--workspace-rule-strong)] bg-[var(--workspace-surface-raised)]" : "border-dashed border-[var(--workspace-rule)]",
          isSelectedTarget && "border-[var(--workspace-accent)]/60 hover:bg-[var(--workspace-accent-soft)]",
        )}
        aria-label={`${action ? "Edit" : "Fill"} action ${sequence}, ${slot.colour} ${slot.actionType}${selectedChampion ? ` with ${selectedChampion}` : ""}`}
      >
        {action ? <>
          <ChampionAvatar championName={action.champion_name} size={compact ? "xs" : "md"} className="rounded-none" />
          <span className={cn("truncate font-medium", compact ? "mt-1 max-w-20 text-[10px]" : "mt-2 w-full text-xs")}>{action.champion_name}</span>
          {!compact && <span className="mt-1 ss-mono text-[10px] uppercase text-[var(--workspace-subtle)]">{action.assigned_role || `Action ${sequence}`}</span>}
        </> : <>
          <span className={cn("ss-mono uppercase text-[var(--workspace-subtle)]", compact ? "text-[9px]" : "text-[10px]")}>{slot.actionType === "pick" ? "P" : "B"}{ownerSlots(sequenceSlot(sequence, side)!.teamSide, slot.actionType).findIndex((item) => item.sequence === sequence) + 1}</span>
          {!compact && <span className="mt-2 text-xs text-[var(--workspace-subtle)]">Drop champion</span>}
        </>}
      </button>
    );
  }

  return (
    <div className="space-y-5">
      {canEdit && <DataSurface>
        <div className="flex flex-col gap-4 border-b border-[var(--workspace-rule)] p-5 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="workspace-eyebrow">Champion pool</p><h3 className="mt-2 font-semibold">Drag a champion into the draft</h3><p className="mt-1 text-sm text-[var(--workspace-muted)]">On touch or keyboard, select a champion and then choose any pick or ban slot.</p></div>
          <div className="relative w-full lg:w-72"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[var(--workspace-subtle)]" /><Input value={query} onChange={(event)=>setQuery(event.target.value)} className="pl-9" placeholder="Search champions" aria-label="Search champion pool" /></div>
        </div>
        <div className="grid max-h-72 grid-cols-4 gap-2 overflow-y-auto p-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
          {champions.map((champion) => {
            const isRestricted = restricted.has(champion.name.toLocaleLowerCase());
            const selected = selectedChampion === champion.name;
            return <button key={champion.id} type="button" draggable={!isRestricted} disabled={isRestricted} aria-pressed={selected} onDragStart={(event)=>{event.dataTransfer.effectAllowed="copy";event.dataTransfer.setData("text/plain",champion.name);setSelectedChampion(champion.name);}} onDragEnd={()=>setSelectedChampion(null)} onClick={()=>setSelectedChampion(selected?null:champion.name)} className={cn("flex min-w-0 flex-col items-center border p-2 transition-colors",selected?"border-[var(--workspace-accent)] bg-[var(--workspace-accent-soft)]":"border-transparent hover:border-[var(--workspace-rule-strong)]",isRestricted&&"cursor-not-allowed opacity-30")} title={isRestricted?`${champion.name} is unavailable in this series`:champion.name}><ChampionAvatar championName={champion.name} size="sm" className="rounded-none" /><span className="mt-1 w-full truncate text-[10px]">{champion.name}</span></button>;
          })}
          {!catalog.isLoading&&!champions.length&&<p className="col-span-full py-6 text-center text-sm text-[var(--workspace-subtle)]">No champions match this search.</p>}
        </div>
        {selectedChampion&&<div className="border-t border-[var(--workspace-rule)] px-5 py-3 text-sm text-[var(--workspace-muted)]"><strong className="text-[var(--workspace-text)]">{selectedChampion}</strong> selected · choose a slot to place it.</div>}
        {avatarQaFixtureEnabled && <div className="border-t border-[var(--workspace-rule)] bg-[var(--workspace-surface-raised)] px-5 py-4" data-testid="staging-avatar-qa-fixture">
          <p className="workspace-eyebrow">Staging QA fixture</p>
          <p className="mt-1 text-xs text-[var(--workspace-muted)]">Non-customer visual checks only. This fixture creates no workspace data.</p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--workspace-muted)]">
            <div className="flex items-center gap-2"><ChampionAvatar championName="None" size="sm" className="rounded-none" /><span>None</span></div>
            <div className="flex items-center gap-2"><ChampionAvatar championName="Unknown Champion" size="sm" className="rounded-none" /><span>Unknown champion</span></div>
            <div className="flex items-center gap-2"><ChampionAvatar championName="Ahri" imageUrlOverride={STAGING_AVATAR_QA_FAILURE_URL} size="sm" className="rounded-none" /><span>Forced image failure: Ahri</span></div>
          </div>
        </div>}
      </DataSurface>}

      <div className="grid gap-4 lg:grid-cols-2">
        {(["ours", "opponent"] as const).map((owner) => {
          const picks = ownerSlots(owner, "pick");
          const bans = ownerSlots(owner, "ban");
          return (
            <DataSurface key={owner} className="p-5">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--workspace-rule)] pb-3">
                <div><p className="workspace-eyebrow">{owner === "ours" ? "Our team" : "Opponent"}</p><h3 className="mt-1 font-semibold">{owner === "ours" ? side : side === "blue" ? "red" : "blue"} side</h3></div>
                <span className="ss-mono text-xs text-[var(--workspace-subtle)]">{picks.filter((slot)=>bySequence.has(slot.sequence)).length}/5 picks</span>
              </div>
              <div className="mt-4 grid grid-cols-5 gap-2">{picks.map((slot)=><div key={slot.sequence}>{slotAction(slot.sequence)}</div>)}</div>
              <div className="mt-4 grid grid-cols-5 gap-2">{bans.map((slot)=><div key={slot.sequence}>{slotAction(slot.sequence,true)}</div>)}</div>
            </DataSurface>
          );
        })}
      </div>

      <DataSurface>
        <div className="flex flex-col gap-2 border-b border-[var(--workspace-rule)] p-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="workspace-eyebrow">Tournament order</p><h3 className="mt-2 font-semibold">Complete 20-action sequence</h3></div>
          <p className="text-xs text-[var(--workspace-subtle)]">Drop directly into the sequence or use the team boxes above.</p>
        </div>
        <div className="divide-y divide-[var(--workspace-rule)]">
          {(Object.keys(phaseLabels) as Array<keyof typeof phaseLabels>).map((phase) => (
            <section key={phase} className="p-5">
              <p className="workspace-eyebrow mb-3">{phaseLabels[phase]}</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {DRAFT_SEQUENCE.filter((slot) => slot.phase === phase).map((slot) => {
                  const action = bySequence.get(slot.sequence);
                  const expected = sequenceSlot(slot.sequence, side);
                  return (
                    <div key={slot.sequence} onDragOver={(event)=>canEdit&&event.preventDefault()} onDrop={(event)=>receiveDrop(event,slot.sequence)} className={cn("group relative min-h-24 border p-3", action ? "border-[var(--workspace-rule-strong)] bg-[var(--workspace-surface-raised)]" : "border-dashed border-[var(--workspace-rule)]",selectedChampion&&canEdit&&"border-[var(--workspace-accent)]/60")}>
                      <button type="button" disabled={!canEdit} onClick={() => selectedChampion?place(slot.sequence,selectedChampion):onSelectSlot(slot.sequence,action)} className="w-full text-left disabled:cursor-default" aria-label={`${action ? "Edit" : "Fill"} action ${slot.sequence}, ${slot.colour} ${slot.actionType}`}>
                        <div className="flex items-center justify-between gap-2"><span className={cn("ss-mono text-[10px] uppercase", slot.colour === "blue" ? "text-sky-300" : "text-rose-300")}>{String(slot.sequence).padStart(2, "0")} · {slot.colour}</span>{action&&<Pencil className="h-3.5 w-3.5 text-[var(--workspace-subtle)]" />}</div>
                        <div className="mt-3 flex items-center gap-2">{action&&<ChampionAvatar championName={action.champion_name} size="xs" className="rounded-none" />}<div className="min-w-0"><p className="truncate text-sm font-medium">{action?.champion_name || `${expected?.teamSide === "ours" ? "Our" : "Opponent"} ${slot.actionType}`}</p><p className="mt-1 text-xs text-[var(--workspace-subtle)]">{action?.assigned_role || expected?.teamSide || "Not recorded"}</p></div></div>
                      </button>
                      {action && canEdit && <Button size="icon" variant="ghost" className="absolute bottom-1 right-1 h-7 w-7 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100" aria-label={`Remove ${action.champion_name}`} onClick={() => onDelete(action.id)}><X className="h-3.5 w-3.5" /></Button>}
                      {action && canEdit && slot.sequence < 20 && <Button size="icon" variant="ghost" className="absolute bottom-1 left-1 h-7 w-7 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100" aria-label={`Branch after action ${slot.sequence}`} onClick={() => onBranch(slot.sequence + 1)}><GitBranch className="h-3.5 w-3.5" /></Button>}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </DataSurface>

      <DataSurface className={cn("p-5", issues.length ? "border-amber-400/30" : "border-emerald-400/30")}>
        <div className="flex items-start gap-3">{issues.length ? <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-300" /> : <div className="mt-1 h-3 w-3 bg-emerald-300" />}<div><h3 className="font-semibold">{issues.length ? "Publication checklist" : "Scenario is complete"}</h3>{issues.length ? <ul className="mt-3 grid gap-1 text-sm text-[var(--workspace-muted)]">{issues.slice(0, 8).map((issue) => <li key={issue}>· {issue}</li>)}</ul> : <p className="mt-2 text-sm text-[var(--workspace-muted)]">All sequence, champion, restriction, and role requirements are resolved.</p>}</div></div>
      </DataSurface>
    </div>
  );
}
