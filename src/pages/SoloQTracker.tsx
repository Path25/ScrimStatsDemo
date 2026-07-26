import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock3, Database, RefreshCw, Settings2, TrendingDown, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

import { SoloQMatchRow } from "@/components/soloq/SoloQMatchRow";
import { SoloQRankChart } from "@/components/soloq/SoloQRankChart";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataSurface } from "@/components/workspace/DataSurface";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { WorkspaceState } from "@/components/workspace/WorkspaceState";
import { useRole } from "@/contexts/RoleContext";
import { useTenant } from "@/contexts/TenantContext";
import { useSoloQTracker } from "@/hooks/useSoloQTracker";
import { dateInTimezone, formatRank, rankMovement, recentForm, thirtyDayNet } from "@/lib/soloq";
import type { SoloQSyncState } from "@/types/soloq";

function MovementValue({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[var(--workspace-muted)]">Not available</span>;
  const positive = value >= 0;
  return (
    <span className={`flex items-center gap-1 ${positive ? "text-emerald-400" : "text-red-400"}`}>
      {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
      {value > 0 ? "+" : ""}{value} LP
    </span>
  );
}

function syncMessage(state: SoloQSyncState | null, integrationStatus?: string) {
  if (!integrationStatus) return { tone: "warning", title: "Workspace Riot key required", detail: "Staff must configure this workspace's Riot API key before automatic tracking can begin." };
  if (integrationStatus === "invalid") return { tone: "danger", title: "Workspace Riot key is invalid", detail: "Update the Riot credential in Integrations to resume the queue." };
  if (!state) return { tone: "neutral", title: "Awaiting first synchronization", detail: "This eligible profile will join the next workspace run after 05:15 local time." };
  if (state.status === "ready" && state.last_success_at && Date.now() - new Date(state.last_success_at).getTime() > 36 * 60 * 60 * 1000) {
    return { tone: "warning", title: "Ranked data is stale", detail: `Last successful synchronization was ${new Date(state.last_success_at).toLocaleString()}.` };
  }
  const messages: Record<string, { tone: string; title: string; detail: string }> = {
    queued: { tone: "neutral", title: "Queued for synchronization", detail: "The paced workspace worker will process this profile shortly." },
    syncing: { tone: "neutral", title: "Synchronization in progress", detail: "Ranked state and uncached match details are being requested from Riot." },
    ready: { tone: "success", title: "Ranked data is current", detail: state.last_success_at ? `Last synchronized ${new Date(state.last_success_at).toLocaleString()}.` : "Synchronization completed." },
    unranked: { tone: "warning", title: "Currently unranked", detail: "No active Solo/Duo ranked entry was returned; recent ranked matches remain available." },
    invalid_identity: { tone: "danger", title: "Riot identity could not be resolved", detail: state.error_message || "Check the player's Riot name, tagline, and server." },
    rate_limited: { tone: "warning", title: "Riot rate limit pause", detail: state.next_allowed_at ? `This workspace will resume after ${new Date(state.next_allowed_at).toLocaleTimeString()}.` : "The queue will resume automatically when Riot allows it." },
    failed: { tone: "danger", title: "Synchronization failed", detail: state.error_message || "The worker will retry transient failures automatically." },
    unavailable: { tone: "warning", title: "Profile unavailable", detail: state.error_message || "This player cannot currently be synchronized." },
    never_synced: { tone: "neutral", title: "Awaiting first synchronization", detail: "This profile has not been synchronized yet." },
  };
  return messages[state.status] || messages.never_synced;
}

export default function SoloQTracker() {
  const [playerId, setPlayerId] = useState("");
  const { isManager } = useRole();
  const { tenant } = useTenant();
  const tracker = useSoloQTracker(playerId);
  const players = tracker.players;
  const selectedPlayer = players.find((player) => player.id === playerId);
  const timezone = typeof tenant?.settings.timezone === "string" ? tenant.settings.timezone : "UTC";

  useEffect(() => {
    if (!players.some((player) => player.id === playerId)) setPlayerId(players[0]?.id ?? "");
  }, [playerId, players]);

  const movement = useMemo(
    () => rankMovement(tracker.snapshots, dateInTimezone(new Date(), timezone)),
    [timezone, tracker.snapshots],
  );
  const netMovement = useMemo(() => thirtyDayNet(tracker.snapshots), [tracker.snapshots]);
  const form = useMemo(() => recentForm(tracker.matches), [tracker.matches]);
  const status = syncMessage(tracker.syncState, tracker.integration?.status);
  const progress = tracker.run?.total_jobs
    ? Math.round((tracker.run.completed_jobs / tracker.run.total_jobs) * 100)
    : 0;

  return (
    <div className="space-y-8 pb-12">
      <WorkspacePageHeader
        eyebrow="Ranked practice"
        title="Solo Queue tracker"
        description="Daily rank movement, recent form, and full match context for every eligible active roster profile."
        actions={
          <div className="flex min-w-0 flex-wrap gap-2">
            <Select value={playerId} onValueChange={setPlayerId}>
              <SelectTrigger aria-label="Tracked roster player" className="min-w-52 border-[var(--workspace-rule-strong)] bg-[var(--workspace-surface)]">
                <SelectValue placeholder="Choose player" />
              </SelectTrigger>
              <SelectContent>
                {players.map((player) => <SelectItem key={player.id} value={player.id}>{player.summoner_name}</SelectItem>)}
              </SelectContent>
            </Select>
            {isManager && (
              <Button onClick={() => void tracker.refresh()} disabled={!playerId || tracker.refreshing || !tracker.integration || tracker.integration.status === "invalid"}>
                <RefreshCw className={`h-4 w-4 ${tracker.refreshing ? "animate-spin" : ""}`} />
                Refresh player
              </Button>
            )}
          </div>
        }
      />

      {tracker.roster.isLoading ? (
        <WorkspaceState icon={Database} title="Loading tracked roster…" description="Checking active profiles with complete Riot identities." />
      ) : tracker.roster.error ? (
        <WorkspaceState icon={AlertTriangle} title="Tracked roster could not be loaded" description="Other workspace pages remain available. Retry this page in a moment." />
      ) : !players.length ? (
        <WorkspaceState icon={Database} title="No eligible roster profiles" description="An active player needs a supported server plus a complete Riot name and tagline." action={isManager ? <Button asChild variant="outline"><Link to="/players">Review roster</Link></Button> : undefined} />
      ) : !selectedPlayer ? null : (
        <>
          {tracker.run && ["pending", "running"].includes(tracker.run.status) && (
            <DataSurface className="p-4" aria-live="polite">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-sm font-semibold">Workspace sync in progress</p><p className="mt-1 text-xs text-[var(--workspace-subtle)]">{tracker.run.completed_jobs} of {tracker.run.total_jobs} profiles complete · paced sequentially</p></div>
                <span className="ss-mono text-sm">{progress}%</span>
              </div>
              <Progress value={progress} className="mt-3 h-1.5 rounded-none" />
            </DataSurface>
          )}

          <DataSurface elevated className="overflow-hidden">
            <div className="flex flex-col justify-between gap-5 p-6 lg:flex-row lg:items-start">
              <div>
                <h2 className="text-2xl font-semibold">{selectedPlayer.summoner_name}</h2>
                <p className="mt-2 text-sm text-[var(--workspace-muted)]">{selectedPlayer.riot_id || `${selectedPlayer.summoner_name}#${selectedPlayer.riot_tag_line}`} · {selectedPlayer.region?.toUpperCase()}</p>
              </div>
              <div className={`max-w-xl border-l-2 px-4 py-2 ${status.tone === "danger" ? "border-red-400" : status.tone === "warning" ? "border-amber-400" : status.tone === "success" ? "border-emerald-400" : "border-[var(--workspace-rule-strong)]"}`}>
                <p className="text-sm font-semibold">{status.title}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--workspace-muted)]">{status.detail}</p>
                {isManager && (!tracker.integration || tracker.integration.status === "invalid") && <Button asChild variant="link" className="mt-1 h-auto p-0 text-xs"><Link to="/integrations"><Settings2 className="mr-1 h-3.5 w-3.5" />Open Integrations</Link></Button>}
              </div>
            </div>

            <div className="grid border-t border-[var(--workspace-rule)] sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              <div className="border-b border-[var(--workspace-rule)] p-4 sm:border-r xl:border-b-0"><p className="workspace-eyebrow">Current rank</p><p className="mt-2 text-base font-semibold">{movement.latest ? formatRank(movement.latest.tier, movement.latest.division, movement.latest.league_points) : "Not available"}</p></div>
              <div className="border-b border-[var(--workspace-rule)] p-4 lg:border-r xl:border-b-0"><p className="workspace-eyebrow">{movement.label}</p><p className="mt-2 text-base font-semibold"><MovementValue value={movement.change} /></p>{movement.label === "Since last snapshot" && movement.comparisonDate ? <p className="mt-1 text-[11px] text-[var(--workspace-subtle)]">From {new Date(`${movement.comparisonDate}T12:00:00Z`).toLocaleDateString()}</p> : null}</div>
              <div className="border-b border-[var(--workspace-rule)] p-4 sm:border-r xl:border-b-0"><p className="workspace-eyebrow">30-day net</p><p className="mt-2 text-base font-semibold"><MovementValue value={netMovement} /></p></div>
              <div className="border-b border-[var(--workspace-rule)] p-4 lg:border-r xl:border-b-0"><p className="workspace-eyebrow">Recent record</p><p className="mt-2 text-base font-semibold">{tracker.matches.length ? `${form.wins}W · ${form.losses}L` : "Not available"}</p></div>
              <div className="border-b border-[var(--workspace-rule)] p-4 sm:border-b-0 sm:border-r"><p className="workspace-eyebrow">Games · 7 days</p><p className="mt-2 text-base font-semibold">{form.gamesLastSevenDays}</p></div>
              <div className="border-b border-[var(--workspace-rule)] p-4 sm:border-b-0 lg:border-r"><p className="workspace-eyebrow">Average KDA</p><p className="mt-2 ss-mono text-base font-semibold">{form.averageKda === null ? "Not available" : form.averageKda.toFixed(2)}</p></div>
              <div className="p-4"><p className="workspace-eyebrow">CS / minute</p><p className="mt-2 ss-mono text-base font-semibold">{form.csPerMinute === null ? "Not available" : form.csPerMinute.toFixed(1)}</p></div>
            </div>
          </DataSurface>

          <DataSurface>
            <div className="border-b border-[var(--workspace-rule)] px-5 py-4">
              <h2 className="font-semibold">30-day ranked progression</h2>
              <p className="mt-1 text-sm text-[var(--workspace-muted)]">Tier-aware movement across promotions and demotions. Missing days are left as gaps in the evidence.</p>
            </div>
            {tracker.snapshotsQuery.isLoading ? <p className="flex h-64 items-center justify-center text-sm text-[var(--workspace-muted)]">Loading rank history…</p> : tracker.snapshotsQuery.error ? <WorkspaceState icon={AlertTriangle} title="Rank history could not be loaded" description="Recent matches and synchronization controls are still available." className="m-5" /> : <SoloQRankChart snapshots={tracker.snapshots} />}
          </DataSurface>

          <DataSurface>
            <div className="flex flex-col gap-2 border-b border-[var(--workspace-rule)] px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
              <div><h2 className="font-semibold">Latest ranked games</h2><p className="mt-1 text-sm text-[var(--workspace-muted)]">Expand a row for the complete blue and red scoreboards and supplied objective context.</p></div>
              {tracker.syncState?.last_success_at && <p className="flex items-center gap-1.5 text-xs text-[var(--workspace-subtle)]"><Clock3 className="h-3.5 w-3.5" />Updated {new Date(tracker.syncState.last_success_at).toLocaleString()}</p>}
            </div>
            {tracker.matchesQuery.isLoading ? <p className="p-8 text-center text-sm text-[var(--workspace-muted)]">Loading recent matches…</p> : tracker.matchesQuery.error ? <WorkspaceState icon={AlertTriangle} title="Recent matches could not be loaded" description="Rank history and synchronization status are still available." className="m-5" /> : tracker.matches.length ? <div className="divide-y divide-[var(--workspace-rule)]">{tracker.matches.map((match) => <SoloQMatchRow key={match.id} match={match} selectedPuuid={selectedPlayer.puuid} />)}</div> : <WorkspaceState icon={Database} title="No recent ranked games" description="No Solo/Duo matches are cached for this player yet. Missing matches are never fabricated." className="m-5" />}
          </DataSurface>
        </>
      )}
    </div>
  );
}
