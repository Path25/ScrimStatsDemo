import {
  Crosshair,
  Heart,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Shield,
  Swords,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { AddPlayerDialog } from "@/components/players/AddPlayerDialog";
import { EditPlayerDialog } from "@/components/players/EditPlayerDialog";
import { InviteTeamMemberDialog } from "@/components/team/InviteTeamMemberDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataSurface } from "@/components/workspace/DataSurface";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { WorkspaceState } from "@/components/workspace/WorkspaceState";
import { useRole } from "@/contexts/RoleContext";
import { usePlayersData } from "@/hooks/usePlayersData";
import type { Database } from "@/integrations/supabase/types";
import { championPoolFromJson, displayRiotIdentity } from "@/lib/roster-profile";

type Player = Database["public"]["Tables"]["players"]["Row"];

function RoleIcon({ role }: { role: string | null }) {
  const className = "h-4 w-4";
  switch (role?.toLowerCase()) {
    case "top":
      return <Shield className={className} aria-hidden="true" />;
    case "jungle":
      return <Swords className={className} aria-hidden="true" />;
    case "mid":
      return <Zap className={className} aria-hidden="true" />;
    case "adc":
      return <Crosshair className={className} aria-hidden="true" />;
    case "support":
      return <Heart className={className} aria-hidden="true" />;
    default:
      return <Users className={className} aria-hidden="true" />;
  }
}

function RosterActions({
  playerId,
  playerName,
  removePlayer,
  editPlayer,
  disabled,
}: {
  playerId: string;
  playerName: string | null;
  removePlayer: (playerId: string, playerName: string | null) => void;
  editPlayer: () => void;
  disabled: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-label={`Roster actions for ${playerName || "player"}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={editPlayer}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit roster profile
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => removePlayer(playerId, playerName)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Remove from active roster
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Players() {
  const {
    players,
    archivedPlayers,
    isLoading,
    error,
    refetch,
    deletePlayer,
    reactivatePlayer,
    isDeleting,
    pendingPlayerId,
  } = usePlayersData();
  const { isManager } = useRole();
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  function removePlayer(playerId: string, playerName: string | null) {
    if (
      !window.confirm(
        `Remove ${playerName || "this player"} from the active roster? Their recorded scrim history is retained.`,
      )
    ) {
      return;
    }
    deletePlayer(playerId);
  }

  return (
    <div className="space-y-8 pb-10">
      <WorkspacePageHeader
        eyebrow="Team and calendar"
        title="Active roster"
        description="League profiles used by this workspace. Match performance remains separate until a game record is captured or entered."
        actions={
          isManager ? (
            <>
              {archivedPlayers.length > 0 && (
                <Button variant="outline" onClick={() => setShowArchived((value) => !value)}>
                  {showArchived ? "Hide archived" : `Archived (${archivedPlayers.length})`}
                </Button>
              )}
              <InviteTeamMemberDialog />
              <AddPlayerDialog />
            </>
          ) : undefined
        }
      />

      {isLoading ? (
        <WorkspaceState
          icon={Users}
          title="Loading the active roster"
          description="ScrimStats is reading the players attached to this team workspace."
        />
      ) : error ? (
        <WorkspaceState
          icon={Users}
          title="The roster could not be loaded"
          description={error}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      ) : players.length === 0 ? (
        <WorkspaceState
          icon={Users}
          title="No active players yet"
          description="Add the first player when you are ready to track roster participation and captured scrim results."
          action={isManager ? <AddPlayerDialog /> : undefined}
        />
      ) : (
        <DataSurface>
          <div className="hidden grid-cols-[minmax(14rem,1.4fr)_0.75fr_0.8fr_0.75fr_minmax(12rem,1fr)_auto] gap-4 border-b border-[var(--workspace-rule)] px-5 py-3 md:grid">
            {["Player", "Role", "Rank", "Region", "Champion pool", ""].map((heading) => (
              <span key={heading} className="workspace-eyebrow text-[var(--workspace-subtle)]">
                {heading}
              </span>
            ))}
          </div>

          <div className="divide-y divide-[var(--workspace-rule)]">
            {players.map((player) => {
              const championPool = championPoolFromJson(player.main_champions);
              const riotIdentity = displayRiotIdentity(player.riot_id, player.riot_tag_line);

              return (
              <article
                key={player.id}
                className="workspace-ledger-row px-5 py-5 md:grid md:grid-cols-[minmax(14rem,1.4fr)_0.75fr_0.8fr_0.75fr_minmax(12rem,1fr)_auto] md:items-center md:gap-4 md:py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center border border-[var(--workspace-rule-strong)] text-[var(--workspace-accent)]">
                    <RoleIcon role={player.role} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">
                      {player.summoner_name || "Unnamed player"}
                    </h2>
                    {riotIdentity && (
                      <p className="mt-1 truncate font-mono text-xs text-[var(--workspace-muted)]">
                        {riotIdentity}
                      </p>
                    )}
                    <p className="mt-1 text-xs capitalize text-[var(--workspace-subtle)]">
                      {player.membership_state === "linked"
                        ? "Workspace member"
                        : player.membership_state === "invited"
                          ? "Invitation pending"
                          : player.membership_state === "revoked"
                            ? "Access revoked"
                            : "Roster only"}
                    </p>
                  </div>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 text-sm md:contents">
                  <div>
                    <dt className="workspace-eyebrow mb-1 text-[var(--workspace-subtle)] md:hidden">
                      Role
                    </dt>
                    <dd className="flex items-center gap-2 capitalize text-[var(--workspace-muted)]">
                      <RoleIcon role={player.role} />
                      {player.role || "Not set"}
                    </dd>
                  </div>
                  <div>
                    <dt className="workspace-eyebrow mb-1 text-[var(--workspace-subtle)] md:hidden">
                      Rank
                    </dt>
                    <dd>
                      {player.rank || "Not recorded"}
                      {player.lp !== null ? ` · ${player.lp} LP` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="workspace-eyebrow mb-1 text-[var(--workspace-subtle)] md:hidden">
                      Region
                    </dt>
                    <dd className="text-[var(--workspace-muted)]">
                      {player.region || "Not recorded"}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="workspace-eyebrow mb-1 text-[var(--workspace-subtle)] md:hidden">
                      Champion pool
                    </dt>
                    <dd className="truncate text-[var(--workspace-muted)]">
                      {championPool.length
                        ? championPool.join(" · ")
                        : "Awaiting profile data"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex items-center justify-end border-t border-[var(--workspace-rule)] pt-4 md:mt-0 md:border-0 md:pt-0">
                  {isManager && (
                    <RosterActions
                      playerId={player.id}
                      playerName={player.summoner_name}
                      removePlayer={removePlayer}
                      editPlayer={() => setEditingPlayer(player)}
                      disabled={isDeleting}
                    />
                  )}
                </div>
              </article>
              );
            })}
          </div>
        </DataSurface>
      )}

      {showArchived && archivedPlayers.length > 0 && (
        <DataSurface>
          <div className="border-b border-[var(--workspace-rule)] px-5 py-4">
            <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Retained history</p>
            <h2 className="mt-1 text-lg font-semibold">Archived roster profiles</h2>
          </div>
          <div className="divide-y divide-[var(--workspace-rule)]">
            {archivedPlayers.map((player) => (
              <div key={player.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-medium">{player.summoner_name}</p>
                  <p className="mt-1 text-sm text-[var(--workspace-muted)]">
                    {[player.role, player.region].filter(Boolean).join(" · ") ||
                      "Profile details not recorded"}
                  </p>
                </div>
                {isManager && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => reactivatePlayer(player.id)}
                    disabled={isDeleting}
                  >
                    <RotateCcw className="h-4 w-4" />
                    {pendingPlayerId === player.id ? "Reactivating..." : "Reactivate"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </DataSurface>
      )}

      <EditPlayerDialog
        player={editingPlayer}
        open={Boolean(editingPlayer)}
        onOpenChange={(open) => {
          if (!open) setEditingPlayer(null);
        }}
      />
    </div>
  );
}
