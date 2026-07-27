import {
  Archive,
  ArrowRight,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Target,
} from "lucide-react";
import { useState } from "react";
import { Link } from "@/lib/router";

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
import { Textarea } from "@/components/ui/textarea";
import { DataSurface } from "@/components/workspace/DataSurface";
import { ModuleStateBadge } from "@/components/workspace/ModuleStateBadge";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { WorkspaceState } from "@/components/workspace/WorkspaceState";
import { useRole } from "@/contexts/RoleContext";
import { useOpponentTeams, type OpponentTeam } from "@/hooks/useOpponentTeams";
import { useWorkspaceModules } from "@/hooks/useWorkspaceModules";

export default function Scouting() {
  const { canEditIntelligence } = useRole();
  const { modules } = useWorkspaceModules();
  const moduleEnabled = modules.scouting.enabled;
  const {
    data: teams,
    archivedData,
    isLoading,
    error,
    createTeam,
    updateTeam,
    archiveTeam,
    restoreTeam,
    isCreating,
    isUpdating,
    isArchiving,
  } = useOpponentTeams(moduleEnabled);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<OpponentTeam | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");

  const visibleTeams = teams.filter((team) =>
    `${team.name} ${team.region || ""}`.toLowerCase().includes(query.toLowerCase()),
  );

  function closeDialog() {
    setName("");
    setRegion("");
    setDescription("");
    setEditingTeam(null);
    setDialogOpen(false);
  }

  function openCreate() {
    closeDialog();
    setDialogOpen(true);
  }

  function openEdit(team: OpponentTeam) {
    setEditingTeam(team);
    setName(team.name);
    setRegion(team.region || "");
    setDescription(team.description || "");
    setDialogOpen(true);
  }

  async function submit() {
    if (editingTeam) {
      await updateTeam({ id: editingTeam.id, name, region, description });
    } else {
      await createTeam({ name, region, description });
    }
    closeDialog();
  }

  return (
    <div className="space-y-8 pb-12">
      <WorkspacePageHeader
        eyebrow="Intelligence"
        title="Private scouting"
        description="Build a private opponent history from staff observations, completed scrims, and captured game evidence."
        actions={
          <>
            <ModuleStateBadge state={modules.scouting.state} />
            {canEditIntelligence && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Add opponent
              </Button>
            )}
          </>
        }
      />

      {!moduleEnabled ? (
        <WorkspaceState
          icon={Target}
          title="Scouting is not enabled for this workspace"
          description="When enabled, staff can connect opponent evidence to Draft match plans."
        />
      ) : !canEditIntelligence ? (
        <WorkspaceState
          icon={ShieldCheck}
          title="Private staff workspace"
          description="Owners and admins maintain the living opponent report. Published fixture briefs and draft scenarios are available to the full team in Draft."
          action={
            <Button asChild variant="outline">
              <Link to="/draft?view=published">Open published plans</Link>
            </Button>
          }
        />
      ) : (
        <>
          <DataSurface className="p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-[var(--workspace-accent)]" />
              <div>
                <h2 className="font-semibold">Your evidence stays inside this workspace</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--workspace-muted)]">
                  ScrimStats does not share opponent reports between teams or enrich them from public
                  databases. Every observation keeps its source, author, date, and confidence.
                </p>
              </div>
            </div>
          </DataSurface>

          <div className="flex max-w-lg items-center gap-2 border border-[var(--workspace-rule)] bg-[var(--workspace-surface)] px-3">
            <Search className="h-4 w-4 text-[var(--workspace-subtle)]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search private opponent records"
              className="border-0 bg-transparent focus-visible:ring-0"
            />
          </div>

          {isLoading ? (
            <WorkspaceState
              icon={Target}
              title="Loading private scouting…"
              description="Reading opponent records for this workspace."
            />
          ) : error ? (
            <WorkspaceState
              icon={Target}
              title="Scouting unavailable"
              description="Opponent records could not be loaded. Try again, or contact support if the problem continues."
            />
          ) : visibleTeams.length ? (
            <DataSurface>
              <div className="divide-y divide-[var(--workspace-rule)]">
                {visibleTeams.map((team) => (
                  <article
                    key={team.id}
                    className="workspace-ledger-row grid gap-4 px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <Link to={`/scouting/${team.id}`} className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-semibold">{team.name}</h2>
                        {team.region && (
                          <span className="ss-mono text-xs uppercase tracking-[0.12em] text-[var(--workspace-subtle)]">
                            {team.region}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--workspace-muted)]">
                        {team.description || "No staff-authored summary yet."}
                      </p>
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/scouting/${team.id}`}>
                          Open report <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(team)}
                        aria-label={`Edit ${team.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isArchiving}
                        onClick={() => void archiveTeam(team.id)}
                        aria-label={`Archive ${team.name}`}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </DataSurface>
          ) : (
            <WorkspaceState
              icon={Target}
              title={
                query ? "No opponent matches that search." : "Start with the next opponent that matters."
              }
              description={
                query
                  ? "Try another team name or region."
                  : "Create a private opponent record, attach evidence from practice, and publish a focused Draft match plan."
              }
              action={
                !query ? (
                  <Button onClick={openCreate}>
                    <Plus className="h-4 w-4" /> Add first opponent
                  </Button>
                ) : undefined
              }
            />
          )}

          {archivedData.length > 0 && (
            <DataSurface>
              <button
                type="button"
                className="flex w-full items-center justify-between px-5 py-4 text-left"
                onClick={() => setShowArchived((current) => !current)}
              >
                <span>
                  <span className="workspace-eyebrow text-[var(--workspace-subtle)]">
                    Retained history
                  </span>
                  <span className="mt-1 block font-semibold">
                    Archived opponents ({archivedData.length})
                  </span>
                </span>
                <span className="text-sm text-[var(--workspace-muted)]">
                  {showArchived ? "Hide" : "Show"}
                </span>
              </button>
              {showArchived && (
                <div className="divide-y divide-[var(--workspace-rule)] border-t border-[var(--workspace-rule)]">
                  {archivedData.map((team) => (
                    <div key={team.id} className="flex items-center justify-between gap-4 px-5 py-4">
                      <div>
                        <p className="font-medium">{team.name}</p>
                        <p className="mt-1 text-sm text-[var(--workspace-muted)]">
                          {team.region || "Region not recorded"}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isArchiving}
                        onClick={() => void restoreTeam(team.id)}
                      >
                        <RotateCcw className="h-4 w-4" /> Restore
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </DataSurface>
          )}
        </>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
          else setDialogOpen(true);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTeam ? "Edit private opponent record" : "Add a private opponent record"}
            </DialogTitle>
            <DialogDescription>
              Use only information your team is permitted to record. Public enrichment is
              intentionally excluded.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-2">
            <div className="grid gap-2">
              <Label htmlFor="opponent-name">Team name</Label>
              <Input
                id="opponent-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="opponent-region">Region or competition</Label>
              <Input
                id="opponent-region"
                value={region}
                onChange={(event) => setRegion(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="opponent-description">Staff summary</Label>
              <Textarea
                id="opponent-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              disabled={!name.trim() || isCreating || isUpdating}
              onClick={() => void submit()}
            >
              {isCreating || isUpdating
                ? "Saving…"
                : editingTeam
                  ? "Save changes"
                  : "Add opponent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
