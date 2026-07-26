import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";

export function PublicCta({
  to,
  children,
  secondary = false,
}: {
  to: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  const classes = cn(
    "group inline-flex min-h-12 items-center justify-center gap-4 rounded-md px-5 text-base font-semibold transition-colors",
    secondary
      ? "border border-[var(--public-rule-strong)] text-[var(--public-foreground)] hover:border-[var(--public-accent)]"
      : "bg-[linear-gradient(135deg,var(--public-accent),#00b8ff)] text-[#06100f] shadow-[0_16px_38px_-22px_rgba(17,226,208,.9)] hover:saturate-125",
  );

  if (to.startsWith("#")) {
    return (
      <a href={to} className={classes}>
        {children}
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </a>
    );
  }

  return (
    <Link to={to} className={classes}>
      {children}
      <ArrowRight
        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}
