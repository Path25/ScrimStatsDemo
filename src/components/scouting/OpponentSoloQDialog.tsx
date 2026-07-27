import { Database, RefreshCw, TrendingUp } from "lucide-react";

import { ChampionAvatar } from "@/components/scrims/ChampionAvatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WorkspaceState } from "@/components/workspace/WorkspaceState";
import { useOpponentSoloQ } from "@/hooks/useOpponentSoloQ";

type OpponentPlayer = {
  id: string;
  summoner_name: string;
  riot_id: string | null;
  region: string | null;
};

export function OpponentSoloQDialog({
  player,
  canRefresh,
  onClose,
}: {
  player: OpponentPlayer | null;
  canRefresh: boolean;
  onClose: () => void;
}) {
  const tracker = useOpponentSoloQ(player?.id ?? null, Boolean(player));
  const latest = tracker.data?.snapshots[0];
  const matches = tracker.data?.matches || [];
  const wins = matches.filter((match) => match.win).length;

  return (
    <Dialog open={Boolean(player)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{player?.summoner_name || "Opponent"} Solo Queue</DialogTitle>
          <DialogDescription>
            Private team scouting context from the configured Riot connection. This history is not
            shared across ScrimStats tenants.
          </DialogDescription>
        </DialogHeader>
        {tracker.isLoading ? (
          <WorkspaceState icon={Database} title="Loading ranked history…" />
        ) : tracker.error ? (
          <WorkspaceState
            icon={Database}
            title="Ranked history unavailable"
            description="Check the workspace Riot connection, then try again."
          />
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 border-y border-[var(--workspace-rule)] py-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="workspace-eyebrow">Tracked identity</p>
                <p className="mt-2 text-sm font-medium">
                  {[player?.riot_id, player?.region].filter(Boolean).join(" · ") || "Riot identity required"}
                </p>
              </div>
              {canRefresh && (
                <Button
                  onClick={() => void tracker.refresh().catch(() => undefined)}
                  disabled={tracker.refreshing || !player?.riot_id || !player?.region}
                >
                  <RefreshCw className={`h-4 w-4 ${tracker.refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              )}
            </div>
            <div className="grid gap-px bg-[var(--workspace-rule)] sm:grid-cols-3">
              <div className="bg-[var(--workspace-surface)] p-4">
                <p className="workspace-eyebrow">Current rank</p>
                <p className="mt-2 text-lg font-semibold">
                  {latest
                    ? `${latest.tier} ${latest.division} · ${latest.league_points} LP`
                    : "Awaiting sync"}
                </p>
              </div>
              <div className="bg-[var(--workspace-surface)] p-4">
                <p className="workspace-eyebrow">Recent 20</p>
                <p className="mt-2 text-lg font-semibold">
                  {matches.length ? `${wins}W · ${matches.length - wins}L` : "Awaiting sync"}
                </p>
              </div>
              <div className="bg-[var(--workspace-surface)] p-4">
                <p className="workspace-eyebrow">Connection state</p>
                <p className="mt-2 text-lg font-semibold capitalize">
                  {tracker.data?.state?.status?.replaceAll("_", " ") || "Not synced"}
                </p>
              </div>
            </div>
            {matches.length ? (
              <div className="divide-y divide-[var(--workspace-rule)] border-y border-[var(--workspace-rule)]">
                {matches.map((match) => {
                  const minutes = Math.max(1, match.game_duration_seconds / 60);
                  return (
                    <div key={match.id} className="grid gap-4 py-3 sm:grid-cols-[1fr_repeat(3,6rem)] sm:items-center">
                      <div className="flex items-center gap-3">
                        <ChampionAvatar championName={match.champion_name} size="sm" className="rounded-none" />
                        <div>
                          <p className="text-sm font-medium">{match.champion_name}</p>
                          <p className="mt-1 text-xs text-[var(--workspace-subtle)]">
                            {match.win ? "Victory" : "Defeat"} · {match.team_position || "Role unavailable"} · {Math.round(minutes)}m
                          </p>
                        </div>
                      </div>
                      <p className="ss-mono text-xs">{match.kills}/{match.deaths}/{match.assists} KDA</p>
                      <p className="ss-mono text-xs">{(match.cs / minutes).toFixed(1)} CS/m</p>
                      <p className="text-xs text-[var(--workspace-subtle)]">{new Date(match.played_at).toLocaleDateString()}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <WorkspaceState
                icon={TrendingUp}
                title="No ranked matches cached"
                description="Staff can request the latest 20 Solo/Duo games after the Riot identity and workspace connection are configured."
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
