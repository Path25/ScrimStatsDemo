import { useState } from "react";
import {
  Archive,
  ArrowLeft,
  CalendarPlus,
  ClipboardList,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link, useParams } from "@/lib/router";

import { Button } from "@/components/ui/button";
import { OpponentSoloQDialog } from "@/components/scouting/OpponentSoloQDialog";
import { LeaguepediaDraftHistory } from "@/components/scouting/LeaguepediaDraftHistory";
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
import { Textarea } from "@/components/ui/textarea";
import { DataSurface } from "@/components/workspace/DataSurface";
import { SourceBadge } from "@/components/workspace/SourceBadge";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { WorkspaceState } from "@/components/workspace/WorkspaceState";
import { useRole } from "@/contexts/RoleContext";
import { useScoutingWorkspace } from "@/hooks/useScoutingWorkspace";
import { useWorkspaceModules } from "@/hooks/useWorkspaceModules";

type DialogKind =
  | "evidence"
  | "evidence-revision"
  | "tendency"
  | "brief"
  | "player"
  | "player-edit"
  | null;

const categories = ["draft", "champion_pool", "playstyle", "strength", "risk", "macro", "review_note", "other"];
const roles = ["top", "jungle", "mid", "adc", "support"];
type SoloQPlayer = {
  id: string;
  summoner_name: string;
  riot_id: string | null;
  region: string | null;
};

export default function ScoutingTeamReport() {
  const { opponentId } = useParams();
  const { canEditIntelligence, canViewIntelligence } = useRole();
  const { modules } = useWorkspaceModules();
  const scouting = useScoutingWorkspace(opponentId, modules.scouting.enabled && canViewIntelligence);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("playstyle");
  const [confidence, setConfidence] = useState(3);
  const [context, setContext] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [role, setRole] = useState("top");
  const [sourceKind, setSourceKind] = useState<"manual" | "scrim" | "collector">("manual");
  const [scrimId, setScrimId] = useState("");
  const [scrimGameId, setScrimGameId] = useState("");
  const [evidenceIds, setEvidenceIds] = useState<string[]>([]);
  const [editingPlayerId, setEditingPlayerId] = useState("");
  const [editingEvidenceId, setEditingEvidenceId] = useState("");
  const [revisionReason, setRevisionReason] = useState("");
  const [playerRiotId, setPlayerRiotId] = useState("");
  const [playerRegion, setPlayerRegion] = useState("");
  const [soloqPlayer, setSoloqPlayer] = useState<SoloQPlayer | null>(null);

  function reset() {
    setTitle("");
    setBody("");
    setCategory("playstyle");
    setConfidence(3);
    setContext("");
    setScheduledFor("");
    setRole("top");
    setSourceKind("manual");
    setScrimId("");
    setScrimGameId("");
    setEvidenceIds([]);
    setEditingPlayerId("");
    setEditingEvidenceId("");
    setRevisionReason("");
    setPlayerRiotId("");
    setPlayerRegion("");
    setDialog(null);
  }

  async function submit() {
    if (dialog === "evidence") {
      await scouting.addEvidence({
        title,
        observation: body,
        evidenceType: category,
        confidence,
        sampleContext: context,
        sourceKind,
        scrimId: sourceKind === "manual" ? undefined : scrimId,
        scrimGameId: sourceKind === "collector" ? scrimGameId : undefined,
      });
    }
    if (dialog === "tendency") {
      await scouting.addTendency({ title, summary: body, category, confidence, evidenceIds });
    }
    if (dialog === "brief") {
      await scouting.createBrief({
        title,
        scheduledFor: scheduledFor || undefined,
        summary: body,
        evidenceIds,
      });
    }
    if (dialog === "player") {
      await scouting.addPlayer({
        name: title,
        role,
        notes: body,
        riotId: playerRiotId,
        region: playerRegion,
      });
    }
    if (dialog === "player-edit") {
      await scouting.updatePlayer({
        id: editingPlayerId,
        name: title,
        role,
        notes: body,
        riotId: playerRiotId,
        region: playerRegion,
      });
    }
    if (dialog === "evidence-revision") {
      await scouting.supersedeEvidence({
        id: editingEvidenceId,
        title,
        observation: body,
        evidenceType: category,
        confidence,
        sampleContext: context,
        reason: revisionReason,
      });
    }
    reset();
  }

  if (!modules.scouting.enabled) {
    return (
      <WorkspaceState
        icon={Target}
        title="Scouting is not enabled for this workspace"
        description="Opponent reports are unavailable with the current workspace settings."
        action={<Button asChild variant="outline"><Link to="/scouting">Return to scouting</Link></Button>}
      />
    );
  }

  if (!canViewIntelligence) {
    return (
      <WorkspaceState
        icon={ShieldCheck}
        title="Scouting is unavailable"
        description="Your current workspace role cannot read this intelligence workspace."
      />
    );
  }

  if (scouting.isLoading) {
    return <WorkspaceState icon={Target} title="Loading opponent report…" description="Reading private evidence and preparation history." />;
  }

  if (scouting.error || !scouting.data?.team) {
    return (
      <WorkspaceState
        icon={Target}
        title="Opponent report unavailable"
        description="This record does not exist in the active workspace, or the scouting migration has not been applied."
        action={<Button asChild variant="outline"><Link to="/scouting">Return to scouting</Link></Button>}
      />
    );
  }

  const {
    team,
    players,
    evidence,
    tendencies,
    briefs,
    practiceBlocks,
    games,
    tendencyLinks,
    briefLinks,
  } = scouting.data;
  const selectedBlockGames = games.filter(
    (game) =>
      game.scrim_id === scrimId
      && (sourceKind !== "collector" || Boolean(game.desktop_session_id)),
  );
  const activeEvidence = evidence.filter((item) => item.lifecycle_state !== "superseded");
  const supersededEvidence = evidence.filter((item) => item.lifecycle_state === "superseded");
  const activePlayers = players.filter((player) => player.is_active !== false);
  const archivedPlayers = players.filter((player) => player.is_active === false);

  function reviseEvidence(item: (typeof evidence)[number]) {
    setEditingEvidenceId(item.id);
    setTitle(item.title);
    setBody(item.observation);
    setCategory(item.evidence_type);
    setConfidence(item.confidence);
    setContext(item.sample_context || "");
    setDialog("evidence-revision");
  }

  function editPlayer(player: (typeof players)[number]) {
    setEditingPlayerId(player.id);
    setTitle(player.summoner_name);
    setBody(player.notes || "");
    setRole(player.role || "top");
    setPlayerRiotId(player.riot_id || "");
    setPlayerRegion(player.region || "");
    setDialog("player-edit");
  }

  function toggleEvidence(evidenceId: string) {
    setEvidenceIds((current) =>
      current.includes(evidenceId)
        ? current.filter((id) => id !== evidenceId)
        : [...current, evidenceId],
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <Link to="/scouting" className="inline-flex items-center gap-2 text-sm text-[var(--workspace-muted)] hover:text-[var(--workspace-foreground)]">
        <ArrowLeft className="h-4 w-4" /> Private scouting
      </Link>

      <WorkspacePageHeader
        eyebrow={team.region || "Opponent report"}
        title={team.name}
        description={team.description || "A living private report built from your team's own evidence."}
        actions={
          canEditIntelligence ? (
            <>
              <Button variant="outline" onClick={() => setDialog("tendency")}><Target className="h-4 w-4" /> Add tendency</Button>
              <Button onClick={() => setDialog("evidence")}><Plus className="h-4 w-4" /> Add evidence</Button>
            </>
          ) : undefined
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <DataSurface>
            <div className="flex items-center justify-between gap-4 border-b border-[var(--workspace-rule)] px-5 py-4">
              <div>
                <h2 className="font-semibold">Evidence timeline</h2>
                <p className="mt-1 text-sm text-[var(--workspace-muted)]">Observations stay separate from conclusions.</p>
              </div>
              <span className="ss-mono text-xs text-[var(--workspace-subtle)]">
                {activeEvidence.length} current
              </span>
            </div>
            {activeEvidence.length ? (
              <div className="divide-y divide-[var(--workspace-rule)]">
                {activeEvidence.map((item) => (
                  <article key={item.id} className="px-5 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-semibold">{item.title}</h3>
                        <SourceBadge source={item.source_kind === "collector" ? "collector" : "manual"} compact />
                        <span className="ss-mono text-xs uppercase text-[var(--workspace-subtle)]">{item.evidence_type.replace("_", " ")}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => reviseEvidence(item)}
                      >
                        <Pencil className="h-4 w-4" /> Revise
                      </Button>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--workspace-muted)]">{item.observation}</p>
                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--workspace-subtle)]">
                      <span>{new Date(item.observed_at).toLocaleDateString()}</span>
                      <span>Confidence {item.confidence}/5</span>
                      {item.sample_context && <span>{item.sample_context}</span>}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <WorkspaceState icon={ClipboardList} title="No evidence recorded yet." description="Add a manual observation or link evidence from a saved scrim and collector-captured game." className="m-5" />
            )}
            {supersededEvidence.length > 0 && (
              <details className="border-t border-[var(--workspace-rule)]">
                <summary className="cursor-pointer px-5 py-4 text-sm text-[var(--workspace-muted)]">
                  Superseded evidence ({supersededEvidence.length})
                </summary>
                <div className="divide-y divide-[var(--workspace-rule)] border-t border-[var(--workspace-rule)]">
                  {supersededEvidence.map((item) => (
                    <article key={item.id} className="px-5 py-4 opacity-75">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-sm font-medium">{item.title}</h3>
                        <span className="ss-mono text-xs uppercase text-[var(--workspace-subtle)]">
                          Superseded
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[var(--workspace-muted)]">
                        {item.observation}
                      </p>
                      {item.superseded_reason && (
                        <p className="mt-2 text-xs text-[var(--workspace-subtle)]">
                          Revision note: {item.superseded_reason}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </details>
            )}
          </DataSurface>

          <DataSurface>
            <div className="border-b border-[var(--workspace-rule)] px-5 py-4">
              <h2 className="font-semibold">Active tendencies</h2>
              <p className="mt-1 text-sm text-[var(--workspace-muted)]">Staff conclusions that should remain traceable to evidence.</p>
            </div>
            {tendencies.length ? (
              <div className="grid gap-px bg-[var(--workspace-rule)] sm:grid-cols-2">
                {tendencies.map((item) => (
                  <article key={item.id} className="bg-[var(--workspace-surface)] p-5">
                    <p className="workspace-eyebrow text-[var(--workspace-accent)]">{item.category.replace("_", " ")}</p>
                    <h3 className="mt-3 font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--workspace-muted)]">{item.summary}</p>
                    <p className="mt-4 ss-mono text-xs text-[var(--workspace-subtle)]">
                      Confidence {item.confidence}/5 ·{" "}
                      {tendencyLinks.filter((link) => link.tendency_id === item.id).length} linked evidence
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="p-5 text-sm text-[var(--workspace-muted)]">No staff-authored tendencies yet.</p>
            )}
          </DataSurface>
        </div>

        <div className="space-y-6">
          <DataSurface>
            <div className="flex items-center justify-between border-b border-[var(--workspace-rule)] px-5 py-4">
              <h2 className="font-semibold">Opponent roster</h2>
              {canEditIntelligence && <Button size="sm" variant="ghost" onClick={() => setDialog("player")}><Plus className="h-4 w-4" /> Add</Button>}
            </div>
            {activePlayers.length ? (
              <div className="divide-y divide-[var(--workspace-rule)]">
                {activePlayers.map((player) => (
                  <div key={player.id} className="flex items-start justify-between gap-4 px-5 py-4">
                    <div>
                      <p className="text-sm font-medium">{player.summoner_name}</p>
                      {(player.riot_id || player.region) && (
                        <p className="mt-1 text-xs text-[var(--workspace-subtle)]">
                          {[player.riot_id, player.region].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      {player.notes && <p className="mt-1 text-xs leading-5 text-[var(--workspace-subtle)]">{player.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="ss-mono mr-2 text-xs uppercase text-[var(--workspace-subtle)]">{player.role || "unassigned"}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setSoloqPlayer(player)}
                        aria-label={`View ${player.summoner_name} Solo Queue history`}
                      >
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                      {canEditIntelligence && (
                        <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => editPlayer(player)}
                        aria-label={`Edit ${player.summoner_name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => void scouting.setPlayerActive({ id: player.id, isActive: false })}
                        aria-label={`Archive ${player.summoner_name}`}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-5 text-sm text-[var(--workspace-muted)]">No private roster observations.</p>
            )}
            {archivedPlayers.length > 0 && (
              <details className="border-t border-[var(--workspace-rule)]">
                <summary className="cursor-pointer px-5 py-4 text-sm text-[var(--workspace-muted)]">
                  Archived roster entries ({archivedPlayers.length})
                </summary>
                <div className="divide-y divide-[var(--workspace-rule)] border-t border-[var(--workspace-rule)]">
                  {archivedPlayers.map((player) => (
                    <div key={player.id} className="flex items-center justify-between gap-4 px-5 py-4">
                      <div>
                        <p className="text-sm font-medium">{player.summoner_name}</p>
                        <p className="mt-1 text-xs uppercase text-[var(--workspace-subtle)]">
                          {player.role || "unassigned"}
                        </p>
                      </div>
                      {canEditIntelligence && <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void scouting.setPlayerActive({ id: player.id, isActive: true })}
                      >
                        <RotateCcw className="h-4 w-4" /> Restore
                      </Button>}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </DataSurface>

          <DataSurface>
            <div className="flex items-center justify-between border-b border-[var(--workspace-rule)] px-5 py-4">
              <div>
                <h2 className="font-semibold">Draft match plans</h2>
                <p className="mt-1 text-sm text-[var(--workspace-muted)]">Fixture-specific snapshots.</p>
              </div>
              {canEditIntelligence && <Button size="sm" variant="ghost" onClick={() => setDialog("brief")}><CalendarPlus className="h-4 w-4" /> New</Button>}
            </div>
            {briefs.length ? (
              <div className="divide-y divide-[var(--workspace-rule)]">
                {briefs.map((brief) => (
                  <Link key={brief.id} to={`/draft?plan=${brief.id}`} className="workspace-ledger-row block px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{brief.title}</p>
                      <span className="ss-mono text-xs uppercase text-[var(--workspace-subtle)]">{brief.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--workspace-subtle)]">
                      Revision {brief.revision} ·{" "}
                      {briefLinks.filter((link) => link.brief_id === brief.id).length} evidence
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="p-5 text-sm text-[var(--workspace-muted)]">No Draft match plan has been created.</p>
            )}
          </DataSurface>

          <DataSurface className="p-5">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-[var(--workspace-accent)]" />
              <p className="text-sm leading-6 text-[var(--workspace-muted)]">Staff edit the living report. Team members receive read-only published Draft plans.</p>
            </div>
          </DataSurface>
        </div>
      </div>

      <LeaguepediaDraftHistory
        opponentTeamId={team.id}
        opponentName={team.name}
        briefs={briefs}
      />

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && reset()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "evidence" && "Add evidence"}
              {dialog === "evidence-revision" && "Revise evidence"}
              {dialog === "tendency" && "Add a staff tendency"}
              {dialog === "brief" && "Create Draft match plan"}
              {dialog === "player" && "Add opponent roster entry"}
              {dialog === "player-edit" && "Edit opponent roster entry"}
            </DialogTitle>
            <DialogDescription>
              {dialog === "evidence-revision"
                ? "The previous evidence remains in the audit trail and the revision becomes current."
                : "Every entry remains private to this team workspace."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-2">
            <div className="grid gap-2">
              <Label htmlFor="scouting-title">
                {dialog === "player" || dialog === "player-edit" ? "Player name" : "Title"}
              </Label>
              <Input id="scouting-title" value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
            {(dialog === "evidence" || dialog === "evidence-revision" || dialog === "tendency") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="scouting-category">Category</Label>
                  <select id="scouting-category" value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 border border-input bg-background px-3 text-sm">
                    {categories.map((item) => <option key={item} value={item}>{item.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="scouting-confidence">Confidence</Label>
                  <select id="scouting-confidence" value={confidence} onChange={(event) => setConfidence(Number(event.target.value))} className="h-10 border border-input bg-background px-3 text-sm">
                    {[1, 2, 3, 4, 5].map((item) => <option key={item} value={item}>{item}/5</option>)}
                  </select>
                </div>
              </div>
            )}
            {(dialog === "player" || dialog === "player-edit") && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="scouting-role">Observed role</Label>
                  <select id="scouting-role" value={role} onChange={(event) => setRole(event.target.value)} className="h-10 border border-input bg-background px-3 text-sm">
                    {roles.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="opponent-riot-id">Riot ID</Label>
                    <Input
                      id="opponent-riot-id"
                      value={playerRiotId}
                      onChange={(event) => setPlayerRiotId(event.target.value)}
                      placeholder="GameName#TAG"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="opponent-region">Server</Label>
                    <Input
                      id="opponent-region"
                      value={playerRegion}
                      onChange={(event) => setPlayerRegion(event.target.value)}
                      placeholder="EUW"
                    />
                  </div>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  Save a complete Riot ID and server to enable private, server-side Solo Queue
                  tracking from this opponent profile.
                </p>
              </>
            )}
            {dialog === "brief" && (
              <div className="grid gap-2">
                <Label htmlFor="brief-date">Fixture date</Label>
                <Input id="brief-date" type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} />
              </div>
            )}
            {dialog === "evidence" && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="evidence-source">Evidence source</Label>
                  <select
                    id="evidence-source"
                    value={sourceKind}
                    onChange={(event) => {
                      const nextSource = event.target.value as typeof sourceKind;
                      setSourceKind(nextSource);
                      if (nextSource === "manual") {
                        setScrimId("");
                        setScrimGameId("");
                      }
                    }}
                    className="h-10 border border-input bg-background px-3 text-sm"
                  >
                    <option value="manual">Manual staff observation</option>
                    <option value="scrim">Saved practice block</option>
                    <option value="collector">Captured game</option>
                  </select>
                </div>
                {sourceKind !== "manual" && (
                  <div className="grid gap-2">
                    <Label htmlFor="evidence-scrim">Practice block</Label>
                    <select
                      id="evidence-scrim"
                      value={scrimId}
                      onChange={(event) => {
                        setScrimId(event.target.value);
                        setScrimGameId("");
                      }}
                      className="h-10 border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Select a saved block</option>
                      {practiceBlocks.map((block) => (
                        <option key={block.id} value={block.id}>
                          {new Date(block.starts_at).toLocaleDateString()} · {block.opponent_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {sourceKind === "collector" && (
                  <div className="grid gap-2">
                    <Label htmlFor="evidence-game">Captured game</Label>
                    <select
                      id="evidence-game"
                      value={scrimGameId}
                      onChange={(event) => setScrimGameId(event.target.value)}
                      className="h-10 border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Select a recorded game</option>
                      {selectedBlockGames.map((game) => (
                        <option key={game.id} value={game.id}>
                          Game {game.game_number} · {game.result || game.status}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
            <div className="grid gap-2">
              <Label htmlFor="scouting-body">
                {dialog === "evidence" || dialog === "evidence-revision" ? "Observation" : dialog === "tendency" ? "Summary" : dialog === "brief" ? "Executive summary" : "Notes"}
              </Label>
              <Textarea id="scouting-body" value={body} onChange={(event) => setBody(event.target.value)} />
            </div>
            {(dialog === "evidence" || dialog === "evidence-revision") && (
              <div className="grid gap-2">
                <Label htmlFor="scouting-context">Sample context</Label>
                <Input id="scouting-context" value={context} onChange={(event) => setContext(event.target.value)} placeholder="e.g. Two games in the latest practice block" />
              </div>
            )}
            {dialog === "evidence-revision" && (
              <div className="grid gap-2">
                <Label htmlFor="revision-reason">Why this changed</Label>
                <Input
                  id="revision-reason"
                  value={revisionReason}
                  onChange={(event) => setRevisionReason(event.target.value)}
                  placeholder="Newer evidence, corrected context, or staff review"
                />
              </div>
            )}
            {(dialog === "tendency" || dialog === "brief") && activeEvidence.length > 0 && (
              <fieldset className="grid gap-2">
                <legend className="text-sm font-medium">
                  {dialog === "brief" ? "Include evidence" : "Supporting evidence"}
                </legend>
                <div className="max-h-44 divide-y divide-border overflow-y-auto border border-border">
                  {activeEvidence.map((item) => (
                    <label key={item.id} className="flex cursor-pointer items-start gap-3 px-3 py-3 text-sm">
                      <input
                        type="checkbox"
                        checked={evidenceIds.includes(item.id)}
                        onChange={() => toggleEvidence(item.id)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-medium">{item.title}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {item.evidence_type.replace("_", " ")} · {new Date(item.observed_at).toLocaleDateString()}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={reset}>Cancel</Button>
            <Button
              disabled={
                !title.trim()
                || ((dialog === "evidence" || dialog === "evidence-revision" || dialog === "tendency") && !body.trim())
                || (dialog === "evidence" && sourceKind !== "manual" && !scrimId)
                || (dialog === "evidence" && sourceKind === "collector" && !scrimGameId)
              }
              onClick={() => void submit()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <OpponentSoloQDialog
        player={soloqPlayer}
        canRefresh={canEditIntelligence}
        onClose={() => setSoloqPlayer(null)}
      />
    </div>
  );
}
