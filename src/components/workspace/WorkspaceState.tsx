import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type WorkspaceStateProps = {
  action?: React.ReactNode;
  className?: string;
  description: string;
  icon: LucideIcon;
  title: string;
};

export function WorkspaceState({
  action,
  className,
  description,
  icon: Icon,
  title,
}: WorkspaceStateProps) {
  return (
    <div className={cn("workspace-state", className)}>
      <Icon className="h-6 w-6 text-[var(--workspace-accent)]" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-semibold text-[var(--workspace-foreground)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--workspace-muted)]">
        {description}
      </p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
