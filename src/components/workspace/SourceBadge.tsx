import { CircleAlert, CloudDownload, Clock3, DatabaseZap, MonitorCheck, PenLine } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CaptureSource } from "@/types/captureSource";

const sourceConfig = {
  collector: {
    label: "Collector-captured",
    icon: CloudDownload,
    className: "workspace-source-collector",
  },
  desktop: {
    label: "Desktop Collector",
    icon: MonitorCheck,
    className: "workspace-source-collector",
  },
  grid: {
    label: "GRID",
    icon: DatabaseZap,
    className: "workspace-source-collector",
  },
  manual: {
    label: "Manual",
    icon: PenLine,
    className: "workspace-source-manual",
  },
  awaiting: {
    label: "Awaiting capture",
    icon: Clock3,
    className: "workspace-source-awaiting",
  },
  unavailable: {
    label: "Unavailable",
    icon: CircleAlert,
    className: "workspace-source-unavailable",
  },
} as const;

type SourceBadgeProps = {
  className?: string;
  compact?: boolean;
  source: CaptureSource;
};

export function SourceBadge({ className, compact = false, source }: SourceBadgeProps) {
  const config = sourceConfig[source];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "workspace-source-badge",
        config.className,
        compact && "workspace-source-badge-compact",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {config.label}
    </span>
  );
}
