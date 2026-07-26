import { useEffect, useState } from "react";
import { CheckCircle2, Download, HardDrive, Link2, MonitorCheck, Radio, Unlink } from "lucide-react";
import { Link } from "@/lib/router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataSurface } from "@/components/workspace/DataSurface";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { useParticipantReconciliation } from "@/hooks/useParticipantReconciliation";
import { usePlayersData } from "@/hooks/usePlayersData";
import { useRole } from "@/contexts/RoleContext";
import type { NativeCollectorStatus } from "@/types/collectorBridge";

export default function CollectorWorkspace() {
  const bridge = window.scrimstatsCollector;
  const { isManager } = useRole();
  const { players } = usePlayersData();
  const { unresolvedParticipants, reconcileParticipant, isReconciling } =
    useParticipantReconciliation(isManager);
  const [status, setStatus] = useState<NativeCollectorStatus | null>(null);
  const [pairingCode, setPairingCode] = useState("");
  const [label, setLabel] = useState(() => `${navigator.platform || "Windows"} collector`);
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

  async function pairDevice(event: React.FormEvent) {
    event.preventDefault();
    if (!bridge) return;
    setPending(true);
    setError("");
    try {
      const result = await bridge.pair(pairingCode.trim(), label.trim());
      setStatus((current) => ({
        ...(current || { state: "ready", message: "Paired.", queueDepth: 0 }),
        state: "ready",
        scrims: result.scrims,
      }));
      setPairingCode("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Pairing failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <WorkspacePageHeader
        eyebrow="Native workspace"
        title="Desktop collector"
        description="League capture runs in the secured Windows process while this window remains the real ScrimStats workspace."
        actions={
          bridge ? (
            <Button variant="outline" onClick={() => void bridge.exportDiagnostics()}>
              <Download className="h-4 w-4" />
              Export diagnostics
            </Button>
          ) : undefined
        }
      />

      {!bridge ? (
        <DataSurface className="p-6">
          <div className="flex gap-4">
            <HardDrive className="h-6 w-6 text-[var(--workspace-accent)]" />
            <div>
              <h2 className="text-lg font-semibold">Open this route in the ScrimStats desktop app.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--workspace-muted)]">
                The browser workspace can review collector status, but pairing and local League
                capture are available only through the signed Windows application.
              </p>
            </div>
          </div>
        </DataSurface>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <DataSurface>
            <div className="border-b border-[var(--workspace-rule)] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Native status</p>
                  <h2 className="mt-2 text-lg font-semibold capitalize">{status?.state || "Loading"}</h2>
                </div>
                {status?.state === "capturing" ? (
                  <Radio className="h-5 w-5 text-[var(--workspace-accent)]" />
                ) : (
                  <MonitorCheck className="h-5 w-5 text-[var(--workspace-subtle)]" />
                )}
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--workspace-muted)]">
                {status?.message || "Reading the native collector bridge…"}
              </p>
            </div>
            <div className="divide-y divide-[var(--workspace-rule)] px-5">
              <div className="flex items-center justify-between py-4 text-sm">
                <span className="text-[var(--workspace-muted)]">Queued uploads</span>
                <span className="ss-mono">{status?.queueDepth ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between py-4 text-sm">
                <span className="text-[var(--workspace-muted)]">Selected block</span>
                <span>{status?.selectedScrim?.opponent_name || "Not selected"}</span>
              </div>
            </div>
          </DataSurface>

          {status?.state === "unpaired" ? (
            <DataSurface className="p-6">
              <form onSubmit={pairDevice} className="max-w-lg space-y-5">
                <div>
                  <h2 className="text-lg font-semibold">Pair this computer</h2>
                  <p className="mt-2 text-sm text-[var(--workspace-muted)]">
                    Create a one-time code from Integrations, then enter it here.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="collector-code">Pairing code</Label>
                  <Input
                    id="collector-code"
                    value={pairingCode}
                    onChange={(event) => setPairingCode(event.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="collector-label">Device label</Label>
                  <Input
                    id="collector-label"
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={pending || !pairingCode.trim() || label.trim().length < 2}>
                  <Link2 className="h-4 w-4" />
                  {pending ? "Pairing…" : "Pair collector"}
                </Button>
              </form>
            </DataSurface>
          ) : (
            <DataSurface>
              <div className="border-b border-[var(--workspace-rule)] p-5">
                <h2 className="font-semibold">Choose the practice block</h2>
                <p className="mt-1 text-sm text-[var(--workspace-muted)]">
                  Capture is attached only to the explicit block selected here.
                </p>
              </div>
              {(status?.scrims || []).length ? (
                <div className="divide-y divide-[var(--workspace-rule)]">
                  {status!.scrims!.map((scrim) => (
                    <button
                      key={scrim.id}
                      type="button"
                      onClick={() => void bridge.selectScrim(scrim.id)}
                      className="workspace-ledger-row flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <div>
                        <p className="font-medium">vs {scrim.opponent_name}</p>
                        <p className="mt-1 text-xs text-[var(--workspace-subtle)]">
                          {new Date(scrim.scheduled_time).toLocaleString()} · {scrim.format || "Format open"}
                        </p>
                      </div>
                      {status?.selectedScrim?.id === scrim.id ? (
                        <CheckCircle2 className="h-5 w-5 text-[var(--workspace-accent)]" />
                      ) : (
                        <span className="text-sm text-[var(--workspace-accent)]">Select</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-5 text-sm text-[var(--workspace-muted)]">
                  No scheduled blocks are currently available.{" "}
                  <Link to="/calendar" className="text-[var(--workspace-accent)]">Open calendar</Link>
                </div>
              )}
            </DataSurface>
          )}
        </div>
      )}

      {isManager && unresolvedParticipants.length > 0 && (
        <DataSurface>
          <div className="border-b border-[var(--workspace-rule)] p-5">
            <p className="workspace-eyebrow text-[var(--workspace-warning)]">Post-capture review</p>
            <h2 className="mt-2 text-lg font-semibold">Resolve captured participants</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--workspace-muted)]">
              This belongs to capture review rather than roster administration. Link an exact team
              profile or mark the participant as an opponent.
            </p>
          </div>
          <div className="divide-y divide-[var(--workspace-rule)]">
            {unresolvedParticipants.map((participant) => (
              <article
                key={participant.id}
                className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(12rem,1fr)_minmax(15rem,1fr)_auto] lg:items-center"
              >
                <div>
                  <p className="font-medium">{participant.summoner_name || "Unknown participant"}</p>
                  <p className="mt-1 text-sm text-[var(--workspace-muted)]">
                    {participant.riot_id
                      ? `${participant.riot_id}${participant.riot_tag_line ? `#${participant.riot_tag_line}` : ""}`
                      : "Riot identity unavailable"}
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
                  aria-label={`Roster match for ${participant.summoner_name || "captured participant"}`}
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
                    Link team profile
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isReconciling}
                    onClick={() =>
                      void reconcileParticipant({ participantId: participant.id, ignore: true })
                    }
                  >
                    <Unlink className="h-4 w-4" />
                    Mark opponent
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
