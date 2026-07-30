import { ArrowRight, BarChart3, ListChecks, TrendingUp } from "lucide-react";
import { Link } from "@/lib/router";

import { Button } from "@/components/ui/button";
import { DataSurface } from "@/components/workspace/DataSurface";

const outcomes = [
  {
    icon: TrendingUp,
    title: "See the current trend",
    description: "Review saved results and recent form from completed practice games.",
  },
  {
    icon: BarChart3,
    title: "Understand the evidence",
    description: "Compare only qualifying records, with sample counts and capture coverage kept visible.",
  },
  {
    icon: ListChecks,
    title: "Return to the right review",
    description: "Open the exact games behind a metric when the team needs a closer look.",
  },
];

export function AnalyticsPlanPreview() {
  return (
    <DataSurface className="mx-auto mt-12 max-w-4xl overflow-hidden">
      <div className="border-b border-[var(--workspace-rule)] px-6 py-7 text-center sm:px-10">
        <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Pro team analytics</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">Turn completed practice into a clearer review.</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--workspace-muted)]">
          Pro organises completed, qualifying game evidence into team trends, supporting context, and direct review links. It activates as your team records practice.
        </p>
      </div>
      <div className="grid divide-y divide-[var(--workspace-rule)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {outcomes.map(({ icon: Icon, title, description }) => (
          <div key={title} className="p-6">
            <Icon className="h-5 w-5 text-[var(--workspace-accent)]" aria-hidden="true" />
            <h2 className="mt-4 font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--workspace-muted)]">{description}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center justify-between gap-3 border-t border-[var(--workspace-rule)] px-6 py-5 sm:flex-row sm:px-10">
        <p className="text-sm text-[var(--workspace-muted)]">No sample metrics are shown before your workspace has recorded qualifying games.</p>
        <Button asChild className="shrink-0"><Link to="/settings?section=billing">Compare Pro <ArrowRight className="h-4 w-4" /></Link></Button>
      </div>
    </DataSurface>
  );
}
