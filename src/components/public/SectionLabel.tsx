import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SectionLabel({
  children,
  tone = "teal",
}: {
  children: ReactNode;
  tone?: "teal" | "muted";
}) {
  return (
    <p
      className={cn(
        "ss-mono text-[13px] font-medium uppercase leading-5 tracking-[0.12em]",
        tone === "teal"
          ? "text-[var(--public-accent)]"
          : "text-[var(--public-subtle)]",
      )}
    >
      {children}
    </p>
  );
}
