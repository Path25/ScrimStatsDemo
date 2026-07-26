import { cn } from "@/lib/utils";

export type MetricStripItem = {
  detail: string;
  label: string;
  value: string | number;
};

type MetricStripProps = {
  className?: string;
  items: MetricStripItem[];
};

export function MetricStrip({ className, items }: MetricStripProps) {
  return (
    <dl className={cn("workspace-metric-strip", className)}>
      {items.map((item) => (
        <div key={item.label} className="workspace-metric">
          <dt className="workspace-eyebrow text-[var(--workspace-subtle)]">{item.label}</dt>
          <dd className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--workspace-foreground)]">
            {item.value}
          </dd>
          <p className="mt-1 text-sm leading-6 text-[var(--workspace-muted)]">{item.detail}</p>
        </div>
      ))}
    </dl>
  );
}
