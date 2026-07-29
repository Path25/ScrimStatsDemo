import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WorkspaceReleaseState } from "@/types/workspaceModules";

export function ModuleStateBadge({
  state,
  enabled = true,
  unavailableLabel = "Unavailable",
  className,
}: {
  state: WorkspaceReleaseState;
  enabled?: boolean;
  unavailableLabel?: string;
  className?: string;
}) {
  const label = !enabled ? unavailableLabel : state === "planned" ? "Coming soon" : "Available";

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
