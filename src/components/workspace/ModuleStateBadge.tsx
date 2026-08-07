import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WorkspaceReleaseState } from "@/types/workspaceModules";

export function ModuleStateBadge({
  state,
  enabled = true,
  unavailableLabel = "Unavailable",
  availableLabel = "Available",
  className,
}: {
  state: WorkspaceReleaseState;
  enabled?: boolean;
  unavailableLabel?: string;
  availableLabel?: string;
  className?: string;
}) {
  const label = !enabled ? unavailableLabel : state === "planned" ? "Coming soon" : availableLabel;

  return (
    <Badge
      variant="outline"
      className={cn(
        "ss-mono border-[var(--workspace-rule-strong)] px-2 py-0.5 text-[11px] uppercase tracking-[0.12em]",
        enabled && state === "live" && "text-[var(--workspace-success)]",
        enabled && state === "beta" && "text-[var(--workspace-accent)]",
        (!enabled || state === "planned") && "text-[var(--workspace-awaiting)]",
        className,
      )}
    >
      {label}
    </Badge>
  );
}
