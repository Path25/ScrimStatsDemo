import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

type PublicSectionProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  id?: string;
  surface?: "base" | "raised";
};

export function PublicSection({
  as: Component = "section",
  children,
  className,
  id,
  surface = "base",
}: PublicSectionProps) {
  return (
    <Component
      id={id}
      className={cn(
        "public-section border-b border-[var(--public-rule)]",
        surface === "raised" && "bg-[var(--public-surface)]",
        className,
      )}
    >
      <div className="mx-auto max-w-[1440px] px-5 lg:px-9">{children}</div>
    </Component>
  );
}
