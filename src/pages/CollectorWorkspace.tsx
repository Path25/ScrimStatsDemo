import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Download,
  Gamepad2,
  HardDrive,
  Link2,
  MonitorCheck,
  Radio,
  RefreshCw,
  TriangleAlert,
  Unlink,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { HowCaptureWorks } from "@/components/capture/HowCaptureWorks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataSurface } from "@/components/workspace/DataSurface";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { useRole } from "@/contexts/RoleContext";
import { useTenant } from "@/contexts/TenantContext";
import { useParticipantReconciliation } from "@/hooks/useParticipantReconciliation";
import { usePlayersData } from "@/hooks/usePlayersData";
import { supabase } from "@/integrations/supabase/client";
import type { NativeCollectorStatus } from "@/types/collectorBridge";

const captureStateLabels: Record<NativeCollectorStatus["state"], string> = {
  unpaired: "Not connected",
  ready: "Ready",
  capturing: "Game in progress",
  finalizing: "Saving game",
  retrying: "Upload pending",
  error: "Needs attention",
};

const unsignedBetaRelease = {
  version: "0.6.0",
  size: "200 MB",
  sha256: "B1FAE384703C4B3903273A0FB9069B8526BBED71477F4FA6816511A234C211B4",
  url: "https://github.com/Path25/ScrimStatsDemo/releases/download/game-capture-v0.6.0-beta/ScrimStats-Game-Capture-Setup-0.6.0.exe",
};

export default function CollectorWorkspace() {
  const bridge = window.scrimstatsCollector;
  const configuredDownloadUrl = import.meta.env.VITE_GAME_CAPTURE_DOWNLOAD_URL?.trim();
  const downloadUrl = configuredDownloadUrl || unsignedBetaRelease.url;
  const isUnsignedBeta = !configuredDownloadUrl;
  const { tenant } = useTenant();
  const { isManager } = useRole();
  const { players } = usePlayersData();
  const { unresolvedParticipants, reconcileParticipant, isReconciling } =
    useParticipantReconciliation(isManager);
  const [status, setStatus] = useState<NativeCollectorStatus | null>(null);
  const [pairingCode, setPairingCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [identitySelections, setIdentitySelections] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!bridge) return;
    void bridge.getStatus().then(setStatus).catch((reason) => setError(String(reason)));
    return bridge.onStatus((next) =>
      setStatus((current) => ({ ...current, ...next, scrims: current?.scrims })),
    );
  }, [bridge]);

  async function refreshStatus() {
    if (!bridge) return;
    setStatus(await bridge.getStatus());
  }

  async function pairWithCode(code: string) {
    if (!bridge) return;
    const result = await bridge.pair(code.trim(), `${navigator.platform || "Windows"} game capture`);
    setStatus((current) => ({
      ...(current || { state: "ready", message: "Connected.", queueDepth: 0, recordingArmed: false }),
      state: "ready",
      scrims: result.scrims,
    }));
    setPairingCode("");
  }

  async function connectThisComputer() {
    if (!bridge || !tenant?.id || !isManager) return;
    setPending(true);
    setError("");
    try {
      const { data, error: pairingError } = await supabase.functions.invoke("collector-pairing", {
        body: { action: "create", tenant_id: tenant.id },
      });
      if (pairingError || !data?.pairing_code) {
        throw pairingError || new Error("A connection code could not be created.");
      }
      await pairWithCode(data.pairing_code);
      await refreshStatus();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "This computer could not be connected.");
    } finally {
      setPending(false);
    }
  }

  async function submitPairingCode(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await pairWithCode(pairingCode);
      await refreshStatus();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "This computer could not be connected.");
    } finally {
      setPending(false);
    }
  }

  async function refreshBlocks() {
    if (!bridge) return;
    setPending(true);
    setError("");
    try {
      const result = await bridge.refreshConfiguration();
      setStatus((current) => current ? { ...current, scrims: result.scrims } : current);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upcoming blocks could not be refreshed.");
    } finally {
      setPending(false);
    }
  }

  async function captureBlock(scrimId: string) {
    if (!bridge) return;
    setPending(true);
    setError("");
    try {
      if (status?.selectedScrim?.id !== scrimId) await bridge.selectScrim(scrimId);
      await bridge.setRecordingEnabled(true);
      await refreshStatus();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Capture could not be started for that block.");
    } finally {
      setPending(false);
    }
  }

  async function stopCapture() {
    if (!bridge) return;
    setPending(true);
    setError("");
    try {
      await bridge.setRecordingEnabled(false);
      await refreshStatus();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Capture could not be stopped.");
    } finally {
      setPending(false);
    }
  }

  const upcomingBlocks = status?.scrims || [];
  const suggestedBlock = upcomingBlocks.find((scrim) => scrim.status === "in_progress") || upcomingBlocks[0];
  const otherBlocks = upcomingBlocks.filter((scrim) => scrim.id !== suggestedBlock?.id);
  const captureActive = Boolean(status?.recordingArmed || status?.state === "capturing" || status?.state === "finalizing");

  return (
    <div className="space-y-8 pb-12">
      <WorkspacePageHeader
        eyebrow="Practice workflow"
        title="Game Capture"
        description="Save champion select and post-game results directly to the scrim block you are playing."
      />

      {!bridge ? (
        <DataSurface className="p-6">
          <div className="flex gap-4">
            <HardDrive className="h-6 w-6 text-[var(--workspace-accent)]" />
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold">Continue in the ScrimStats Windows app</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--workspace-muted)]">
                Game Capture connects to League on the computer running your custom game. Open this
                page in the Windows app to connect the computer and choose your next block.
              </p>
              <Button className="mt-5" asChild>
                <a href={downloadUrl} download>
                  <Download className="h-4 w-4" />
                  {isUnsignedBeta ? "Download unsigned beta" : "Download for Windows"}
                </a>
              </Button>
              {isUnsignedBeta && (
                <div className="mt-5 border border-[var(--workspace-warning)] bg-[color:rgba(245,158,11,.06)] p-4">
                  <div className="flex items-start gap-3">
                    <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-[var(--workspace-warning)]" />
                    <div>
                      <p className="text-sm font-medium">Unsigned testing release</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--workspace-muted)]">
                        Windows may show an Unknown publisher warning. This beta is provided for early
                        team testing while ScrimStats completes publisher verification.
                      </p>
                      <p className="mt-3 text-xs text-[var(--workspace-subtle)]">
                        Version {unsignedBetaRelease.version} · {unsignedBetaRelease.size}
                      </p>
                      <p className="mt-1 break-all font-mono text-[10px] leading-4 text-[var(--workspace-subtle)]">
                        SHA-256 {unsignedBetaRelease.sha256}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DataSurface>
      ) : !status ? (
        <DataSurface className="p-6">
          <div className="flex items-center gap-3 text-sm text-[var(--workspace-muted)]">
            <MonitorCheck className="h-5 w-5 text-[var(--workspace-accent)]" />
            Checking this computer’s Game Capture connection…
          </div>
        </DataSurface>
      ) : status.state === "unpaired" ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <DataSurface className="p-6">
            <div className="max-w-xl">
              <p className="workspace-eyebrow text-[var(--workspace-accent)]">One-time setup</p>
              <h2 className="mt-2 text-xl font-semibold">Connect this computer</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--workspace-muted)]">
                Once connected, this computer will stay linked to your team and will be ready whenever
                you choose a scrim block.
              </p>
              {isManager ? (
                <Button className="mt-5" disabled={pending || !tenant?.id} onClick={() => void connectThisComputer()}>
                  <Link2 className="h-4 w-4" />
                  {pending ? "Connecting…" : "Connect this computer"}
                </Button>
              ) : (
                <form onSubmit={submitPairingCode} className="mt-5 max-w-md space-y-4">
                  <p className="text-sm leading-6 text-[var(--workspace-muted)]">
                    Ask a team manager for a connection code, then enter it below.
                  </p>
                  <div className="grid gap-2">
                    <Label htmlFor="game-capture-code">Connection code</Label>
                    <Input
                      id="game-capture-code"
                      value={pairingCode}
                      onChange={(event) => setPairingCode(event.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <Button type="submit" disabled={pending || !pairingCode.trim()}>
                    <Link2 className="h-4 w-4" />
                    {pending ? "Connecting…" : "Connect"}
                  </Button>
                </form>
              )}
              {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
            </div>
          </DataSurface>
          <HowCaptureWorks />
        </div>
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
            <DataSurface>
              <div className="border-b border-[var(--workspace-rule)] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Capture status</p>
                    <h2 className="mt-2 text-lg font-semibold">{captureStateLabels[status.state]}</h2>
                  </div>
                  {status.state === "capturing" || status.state === "finalizing" ? (
                    <Radio className="h-5 w-5 text-[var(--workspace-accent)]" />
                  ) : (
                    <MonitorCheck className="h-5 w-5 text-[var(--workspace-subtle)]" />
                  )}
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--workspace-muted)]">{status.message}</p>
              </div>
              <div className="divide-y divide-[var(--workspace-rule)] px-5">
                <div className="flex items-center justify-between py-4 text-sm">
                  <span className="text-[var(--workspace-muted)]">Computer</span>
                  <span className="inline-flex items-center gap-2 text-[var(--workspace-accent)]">
                    <CheckCircle2 className="h-4 w-4" /> Connected
                  </span>
                </div>
                <div className="flex items-center justify-between py-4 text-sm">
                  <span className="text-[var(--workspace-muted)]">Current block</span>
                  <span>{status.selectedScrim ? `vs ${status.selectedScrim.opponent_name}` : "Choose a block"}</span>
                </div>
                {status.queueDepth > 0 && (
                  <div className="flex items-center justify-between py-4 text-sm">
                    <span className="text-[var(--workspace-muted)]">Waiting to upload</span>
                    <span>{status.queueDepth}</span>
                  </div>
                )}
              </div>
              <details className="border-t border-[var(--workspace-rule)] px-5 py-4 text-sm">
                <summary className="cursor-pointer text-[var(--workspace-muted)]">Troubleshooting and diagnostics</summary>
                <p className="mt-3 leading-6 text-[var(--workspace-subtle)]">
                  Export diagnostics if support asks for them. Connection credentials and League client
                  credentials are not included.
                </p>
                <Button className="mt-3" size="sm" variant="outline" onClick={() => void bridge.exportDiagnostics()}>
                  <Download className="h-4 w-4" /> Export diagnostics
                </Button>
              </details>
            </DataSurface>

            <DataSurface>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--workspace-rule)] p-5">
                <div>
                  <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Upcoming practice</p>
                  <h2 className="mt-2 text-lg font-semibold">
                    {captureActive ? "Capture is ready" : "Choose the block you are about to play"}
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--workspace-muted)]">
                    {captureActive
                      ? "Leave League and ScrimStats open. Each game in this block will be saved automatically."
                      : "One click prepares champion select, the game, and post-game results for the complete block."}
                  </p>
                </div>
                <Button size="sm" variant="outline" disabled={pending || status.state === "capturing"} onClick={() => void refreshBlocks()}>
                  <RefreshCw className="h-4 w-4" /> Refresh
                </Button>
              </div>

              {captureActive && status.selectedScrim ? (
                <div className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4 border border-[var(--workspace-accent)] bg-[color:rgba(17,226,208,.05)] p-5">
                    <div>
                      <p className="workspace-eyebrow text-[var(--workspace-accent)]">Active block</p>
                      <p className="mt-2 text-lg font-semibold">vs {status.selectedScrim.opponent_name}</p>
                      <p className="mt-1 text-sm text-[var(--workspace-muted)]">
                        {new Date(status.selectedScrim.scheduled_time).toLocaleString()} · {status.selectedScrim.format || "Open format"}
                      </p>
                    </div>
                    <Button variant="outline" disabled={pending} onClick={() => void stopCapture()}>
                      {status.state === "capturing" ? "Stop after this game" : "Stop capture"}
                    </Button>
                  </div>
                </div>
              ) : suggestedBlock ? (
                <div>
                  <article className="workspace-ledger-row flex flex-wrap items-center justify-between gap-4 px-5 py-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold">vs {suggestedBlock.opponent_name}</p>
                        <span className="workspace-eyebrow text-[var(--workspace-accent)]">Suggested</span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--workspace-subtle)]">
                        {new Date(suggestedBlock.scheduled_time).toLocaleString()} · {suggestedBlock.format || "Open format"}
                      </p>
                    </div>
                    <Button disabled={pending} onClick={() => void captureBlock(suggestedBlock.id)}>
                      <Gamepad2 className="h-4 w-4" /> Capture this block
                    </Button>
                  </article>
                  {otherBlocks.length > 0 && (
                    <details className="border-t border-[var(--workspace-rule)]">
                      <summary className="cursor-pointer px-5 py-4 text-sm text-[var(--workspace-muted)]">
                        Choose another upcoming block ({otherBlocks.length})
                      </summary>
                      <div className="divide-y divide-[var(--workspace-rule)] border-t border-[var(--workspace-rule)]">
                        {otherBlocks.map((scrim) => (
                          <article key={scrim.id} className="workspace-ledger-row flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                            <div>
                              <p className="font-medium">vs {scrim.opponent_name}</p>
                              <p className="mt-1 text-xs text-[var(--workspace-subtle)]">
                                {new Date(scrim.scheduled_time).toLocaleString()} · {scrim.format || "Open format"}
                              </p>
                            </div>
                            <Button variant="outline" disabled={pending} onClick={() => void captureBlock(scrim.id)}>
                              Capture this block
                            </Button>
                          </article>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ) : (
                <div className="p-5 text-sm leading-6 text-[var(--workspace-muted)]">
                  There are no current or upcoming scrim blocks to capture. Schedule a block first,
                  then return here before champion select.
                </div>
              )}
              {error && <p className="border-t border-[var(--workspace-rule)] p-5 text-sm text-destructive">{error}</p>}
            </DataSurface>
          </div>

          <HowCaptureWorks />
        </>
      )}

      {isManager && unresolvedParticipants.length > 0 && (
        <DataSurface>
          <div className="border-b border-[var(--workspace-rule)] p-5">
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-5 w-5 text-[var(--workspace-warning)]" />
              <div>
                <p className="workspace-eyebrow text-[var(--workspace-warning)]">Roster check needed</p>
                <h2 className="mt-2 text-lg font-semibold">Unmatched teammates</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--workspace-muted)]">
                  Opponents are identified automatically. These players appeared on your team but did
                  not match an exact Riot ID on the active roster.
                </p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-[var(--workspace-rule)]">
            {unresolvedParticipants.map((participant) => (
              <article
                key={participant.id}
                className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(12rem,1fr)_minmax(15rem,1fr)_auto] lg:items-center"
              >
                <div>
                  <p className="font-medium">{participant.summoner_name || "Unknown player"}</p>
                  <p className="mt-1 text-sm text-[var(--workspace-muted)]">
                    {participant.riot_id
                      ? `${participant.riot_id}${participant.riot_tag_line ? `#${participant.riot_tag_line}` : ""}`
                      : "Riot ID unavailable"}
                    {participant.champion_name ? ` · ${participant.champion_name}` : ""}
                  </p>
                </div>
                <select
                  value={identitySelections[participant.id] || ""}
                  onChange={(event) =>
                    setIdentitySelections((current) => ({
                      ...current,
                      [participant.id]: event.target.value,
                    }))
                  }
                  className="h-10 w-full border border-[var(--workspace-rule-strong)] bg-[var(--workspace-surface)] px-3 text-sm text-[var(--workspace-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--workspace-focus)]"
                  aria-label={`Roster match for ${participant.summoner_name || "captured player"}`}
                >
                  <option value="">Choose roster player</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.summoner_name}
                      {player.riot_id
                        ? ` · ${player.riot_id}${player.riot_tag_line ? `#${player.riot_tag_line}` : ""}`
                        : ""}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button
                    size="sm"
                    disabled={!identitySelections[participant.id] || isReconciling}
                    onClick={() =>
                      void reconcileParticipant({
                        participantId: participant.id,
                        playerId: identitySelections[participant.id],
                      })
                    }
                  >
                    Link roster player
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isReconciling}
                    onClick={() => void reconcileParticipant({ participantId: participant.id, ignore: true })}
                  >
                    <Unlink className="h-4 w-4" /> Not on our roster
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </DataSurface>
      )}
    </div>
  );
}
