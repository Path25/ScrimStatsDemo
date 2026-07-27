import { AlertTriangle, Check, DatabaseZap, FileText, MonitorCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SourceBadge } from "@/components/workspace/SourceBadge";
import { useRole } from "@/contexts/RoleContext";
import { useGameEvidence } from "@/hooks/useGameEvidence";
import type { EvidenceCapability, EvidenceProvider } from "@/lib/analytics/team-analytics";

const capabilityLabels: Record<EvidenceCapability, string> = {
  result: "Saved result",
  draft: "Draft",
  participant_stats: "Participant statistics",
  timeline: "Timeline",
  objectives: "Objectives",
  position_samples: "Position samples",
  movement_detail: "Movement detail",
  champion_select: "Champion select payload",
  post_game_stats: "Post-game statistics",
  coach_review: "Coach review",
};

function source(provider: EvidenceProvider) {
  if (provider === "desktop_collector") return "desktop" as const;
  return provider;
}

export function GameEvidenceDialog({ gameId, compact = false }: { gameId: string; compact?: boolean }) {
  const { canManageTeam } = useRole();
  const { evidence, reconciliations, isLoading, isResolving, resolve } = useGameEvidence(gameId);
  const provider = (evidence?.provider || "manual") as EvidenceProvider;
  const capabilities = (evidence?.capabilities || []) as EvidenceCapability[];
  const ProviderIcon = provider === "grid" ? DatabaseZap : provider === "desktop_collector" ? MonitorCheck : FileText;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" aria-label="View game evidence coverage">
          <SourceBadge compact={compact} source={source(provider)} />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Game evidence coverage</DialogTitle>
          <DialogDescription>
            Data coverage shows which statistics and analysis are available for this game. Source details remain attached to the record.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p className="text-sm text-[var(--workspace-muted)]">Loading evidence…</p>
        ) : (
          <>
            <div className="flex items-start gap-3 border border-[var(--workspace-rule)] p-4">
              <ProviderIcon className="mt-0.5 h-5 w-5 text-[var(--workspace-accent)]" />
              <div>
                <p className="font-medium">{provider === "grid" ? "GRID" : provider === "desktop_collector" ? "Game Capture" : "Manual"}</p>
                <p className="mt-1 text-xs text-[var(--workspace-subtle)]">
                  Data version {evidence?.payload_version || "manual-v1"}
                  {evidence?.captured_at ? ` · Captured ${new Date(evidence.captured_at).toLocaleString()}` : ""}
                </p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(capabilityLabels) as EvidenceCapability[]).map((capability) => {
                const available = capabilities.includes(capability);
                return (
                  <div key={capability} className="flex items-center gap-2 border border-[var(--workspace-rule)] px-3 py-2 text-sm">
                    <Check className={available ? "h-4 w-4 text-emerald-300" : "h-4 w-4 text-[var(--workspace-subtle)] opacity-25"} />
                    <span className={available ? "" : "text-[var(--workspace-subtle)]"}>{capabilityLabels[capability]}</span>
                  </div>
                );
              })}
            </div>
            {!capabilities.length && <p className="text-sm text-[var(--workspace-muted)]">No analytical capabilities have been recorded for this game yet.</p>}
            {reconciliations.map((item) => (
              <div key={item.id} className="border border-amber-400/25 bg-amber-400/[0.06] p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />
                  <div>
                    <p className="text-sm font-medium text-amber-100">Possible duplicate capture</p>
                    <p className="mt-1 text-xs leading-5 text-amber-100/70">{item.match_reasons.join(" · ")}</p>
                  </div>
                </div>
                {canManageTeam && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" disabled={isResolving} onClick={() => void resolve({ id: item.id, action: "resolved", acceptedGameId: gameId })}>Keep this game</Button>
                    <Button size="sm" variant="outline" disabled={isResolving} onClick={() => void resolve({ id: item.id, action: "dismissed" })}>Not a duplicate</Button>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
