import { Crosshair, Eye, GitCompareArrows, Network, Target, Users } from "lucide-react";

import { DataSurface } from "@/components/workspace/DataSurface";
import { SourceBadge } from "@/components/workspace/SourceBadge";

const panels = [
  {
    title: "Champion performance",
    icon: Crosshair,
    description: "Picks, bans, roles, patches, sides, opponents, wins and raw samples.",
    requirement: "Requires reconciled champion drafts and saved results.",
  },
  {
    title: "Matchups and duos",
    icon: Users,
    description: "Role matchups, all champion pairs, Jungle–Mid and ADC–Support combinations.",
    requirement: "Requires matched roles on both teams.",
  },
  {
    title: "Composition identities",
    icon: Network,
    description: "Explainable multi-label identities from a versioned champion-trait taxonomy.",
    requirement: "Requires five reconciled team picks.",
  },
  {
    title: "Player contribution",
    icon: Target,
    description: "KDA, CS/min, gold/min, damage, vision, ward activity and champion history.",
    requirement: "Only fields supplied by the evidence tier are calculated.",
  },
  {
    title: "Objectives and game state",
    icon: Eye,
    description: "Objective counts, first timings, control rates and 10/15/20-minute comparisons.",
    requirement: "Awaiting validated Collector v2 events and snapshots.",
  },
  {
    title: "Improvement windows",
    icon: GitCompareArrows,
    description: "Recent ten games compared with the previous ten comparable games.",
    requirement: "No callout is shown below two complete ten-game windows.",
  },
];

export function AdvancedAnalyticsPanels() {
  return (
    <section>
      <div className="mb-4">
        <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Advanced evidence contract</p>
        <h2 className="mt-2 text-xl font-semibold">Panels activate when their evidence qualifies.</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--workspace-muted)]">
          Legacy, manual and Collector v2 samples remain separate. Every live calculation will show
          numerator, denominator, exclusions, date range, source coverage and contract version.
        </p>
      </div>
      <div className="grid gap-px bg-[var(--workspace-rule)] md:grid-cols-2 xl:grid-cols-3">
        {panels.map((panel) => {
          const Icon = panel.icon;
          return (
            <DataSurface key={panel.title} className="rounded-none border-0 p-5">
              <div className="flex items-start justify-between gap-4">
                <Icon className="h-5 w-5 text-[var(--workspace-accent)]" />
                <SourceBadge source="awaiting" />
              </div>
              <h3 className="mt-5 font-semibold">{panel.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--workspace-muted)]">
                {panel.description}
              </p>
              <p className="mt-4 border-t border-[var(--workspace-rule)] pt-3 text-xs leading-5 text-[var(--workspace-subtle)]">
                {panel.requirement}
              </p>
            </DataSurface>
          );
        })}
      </div>
    </section>
  );
}
