import { useMemo, useState } from "react";
import { BarChart3, CalendarRange, Database } from "lucide-react";

import { TeamAnalyticsWorkspace } from "@/components/analytics/TeamAnalyticsWorkspace";
import { Button } from "@/components/ui/button";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { WorkspaceState } from "@/components/workspace/WorkspaceState";
import { useTeamAnalytics } from "@/hooks/useTeamAnalytics";
import { useWorkspaceModules } from "@/hooks/useWorkspaceModules";

type Range = "all" | 30 | 90 | 180;

export default function Analytics() {
  const { modules } = useWorkspaceModules();
  const moduleEnabled = modules.analytics.enabled;
  const [range, setRange] = useState<Range>("all");
  const dateTo = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const dateFrom = useMemo(() => {
    if (range === "all") return "2000-01-01";
    const date = new Date();
    date.setDate(date.getDate() - (range - 1));
    return date.toISOString().slice(0, 10);
  }, [range]);
  const analytics = useTeamAnalytics(dateFrom, dateTo, moduleEnabled);

  return (
    <div className="space-y-8 pb-12">
      <WorkspacePageHeader
        eyebrow="Coaching analytics"
        title="Team performance"
        description="Compare improvement, inspect team and draft patterns, and trace every metric back to its qualifying practice games."
        actions={
          <div className="flex items-center gap-1 border border-[var(--workspace-rule)] p-1" aria-label="Analytics date range">
            {(["all", 30, 90, 180] as const).map((option) => (
              <Button key={option} size="sm" variant={range === option ? "secondary" : "ghost"} onClick={() => setRange(option)}>
                {option === "all" ? "All history" : `${option} days`}
              </Button>
            ))}
          </div>
        }
      />

      {!moduleEnabled ? (
        <WorkspaceState icon={BarChart3} title="Team analytics is not enabled" description="An owner can enable analytics for this workspace when its evidence workflow is ready." />
      ) : analytics.isLoading ? (
        <WorkspaceState icon={CalendarRange} title="Building the performance workspace…" description="Normalizing factual game, participant, review, and evidence-capability records." />
      ) : analytics.error || !analytics.data ? (
        <WorkspaceState icon={Database} title="Team analytics could not be loaded" description="Analytics data is temporarily unavailable. Try again, or contact support if the problem continues." />
      ) : <TeamAnalyticsWorkspace dataset={analytics.data} />}
    </div>
  );
}
