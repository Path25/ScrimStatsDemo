import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

type DataSurfaceProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  elevated?: boolean;
};

export function DataSurface({
  as: Component = "section",
  children,
  className,
  elevated = false,
}: DataSurfaceProps) {
  return (
    <Component
      className={cn(
        "workspace-data-surface",
        elevated && "workspace-data-surface-elevated",
        className,
      )}
    >
      {children}
    </Component>
  );
}
