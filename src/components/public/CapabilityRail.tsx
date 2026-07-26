import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type CapabilityRailProps = {
  description: string;
  eyebrow: string;
  icon: LucideIcon;
  index: string;
  reverse?: boolean;
  signals: readonly string[];
  title: string;
};

export function CapabilityRail({
  description,
  eyebrow,
  icon: Icon,
  index,
  reverse = false,
  signals,
  title,
}: CapabilityRailProps) {
  return (
    <article
      className={cn(
        "grid gap-7 border-t border-[var(--public-rule-strong)] py-9 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-16 lg:py-12",
        reverse && "lg:grid-cols-[1.18fr_0.82fr]",
      )}
    >
      <div className={cn(reverse && "lg:order-2")}>
        <div className="flex items-center gap-4">
          <span className="ss-mono text-[13px] tracking-[0.13em] text-[var(--public-accent)]">
            {index}
          </span>
          <span className="h-px w-10 bg-[var(--public-rule-strong)]" aria-hidden="true" />
          <span className="ss-mono text-[13px] uppercase tracking-[0.12em] text-[var(--public-subtle)]">
            {eyebrow}
          </span>
        </div>
        <h3 className="mt-5 max-w-2xl text-[clamp(2rem,3.3vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-[var(--public-foreground)]">
          {title}
        </h3>
      </div>

      <div className={cn("relative pl-7 sm:pl-10", reverse && "lg:order-1")}>
        <span
          className="absolute bottom-0 left-0 top-0 w-px bg-[linear-gradient(to_bottom,var(--public-accent),var(--public-accent-secondary),transparent)]"
          aria-hidden="true"
        />
        <Icon className="h-6 w-6 text-[var(--public-accent)]" aria-hidden="true" />
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--public-muted)] sm:text-lg sm:leading-8">
          {description}
        </p>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3" aria-label={`${eyebrow} capabilities`}>
          {signals.map((signal) => (
            <li
              key={signal}
              className="flex items-center gap-2 text-[15px] font-medium text-[var(--public-foreground)]"
            >
              <span className="h-1.5 w-1.5 bg-[var(--public-accent)]" aria-hidden="true" />
              {signal}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
