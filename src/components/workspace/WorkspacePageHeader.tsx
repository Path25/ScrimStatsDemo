import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type WorkspacePageHeaderProps = {
  actions?: ReactNode;
  className?: string;
  description: string;
  eyebrow: string;
  title: string;
};

export function WorkspacePageHeader({
  actions,
  className,
  description,
  eyebrow,
  title,
}: WorkspacePageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col justify-between gap-5 border-b border-[var(--workspace-rule-strong)] pb-6 sm:flex-row sm:items-end",
        className,
      )}
    >
      <div>
        <p className="workspace-eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-[var(--workspace-foreground)] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--workspace-muted)] sm:text-base">
          {description}
        </p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
