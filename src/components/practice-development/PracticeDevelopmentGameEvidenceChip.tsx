import { CheckCircle2, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRole } from "@/contexts/RoleContext";
import { usePracticeDevelopment } from "@/hooks/usePracticeDevelopment";

interface PracticeDevelopmentGameEvidenceChipProps {
  gameId: string;
  gameStatus: string;
  scrimId: string;
  scrimStartsAt: string;
}

export function PracticeDevelopmentGameEvidenceChip({ gameId, gameStatus, scrimId, scrimStartsAt }: PracticeDevelopmentGameEvidenceChipProps) {
  const { canManagePracticeDevelopment } = useRole();
  const { isModuleAvailable, isSaving, linkEvidence, loop } = usePracticeDevelopment(scrimId, gameId);
  const canManage = Boolean(canManagePracticeDevelopment && loop?.projection === "staff-v1");
  const objective = loop?.objective;
  const linked = loop?.evidence.find((item) => item.sourceMatchKey === "context_game");

  if (!isModuleAvailable || !objective) return null;

  if (linked) {
    return (
      <span className="inline-flex min-h-7 items-center gap-1.5 border border-violet-300/25 bg-violet-300/[0.06] px-2.5 ss-mono text-xs uppercase text-violet-200">
        {linked.state === "reviewed" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
        Objective {linked.state === "reviewed" ? "reviewed" : "linked"}
      </span>
    );
  }

  if (!canManage || gameStatus !== "completed" || new Date(scrimStartsAt).getTime() > Date.now() || objective.isArchived || objective.availability !== "available" || !["planned", "evidenced"].includes(objective.status)) return null;

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isSaving}
      onClick={() => void linkEvidence({
        expectedVersion: objective.version,
        objectiveId: objective.id,
        sourceId: gameId,
        sourceType: "scrim_game",
      })}
    >
      <Link2 className="h-4 w-4" /> Link to objective
    </Button>
  );
}
