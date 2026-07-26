import { CheckCircle2, CircleDashed, Clock3 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ReviewStatus } from "@/lib/scrim-review";

const statusConfig = {
  not_started: {
    icon: CircleDashed,
    label: "Not started",
    className: "border-white/10 bg-white/[0.035] text-[var(--workspace-subtle)]",
  },
  in_review: {
    icon: Clock3,
    label: "In review",
    className: "border-amber-400/25 bg-amber-400/[0.07] text-amber-200",
  },
  complete: {
    icon: CheckCircle2,
    label: "Complete",
    className: "border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-200",
  },
} as const;

export function ReviewStatusBadge({
  className,
  status,
}: {
  className?: string;
  status: ReviewStatus;
}) {
  const config = statusConfig[status] || statusConfig.not_started;
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-1 text-xs font-medium",
        config.className,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {config.label}
    </span>
  );
}
