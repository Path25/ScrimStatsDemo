import {
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  Plus,
  Swords,
} from "lucide-react";
import { Link } from "@/lib/router";

import { ScheduleScrimDialog } from "@/components/scrims/ScheduleScrimDialog";
import { ActionCycleRail } from "@/components/actions/ActionCycleRail";
import { Button } from "@/components/ui/button";
import { DataSurface } from "@/components/workspace/DataSurface";
import { MetricStrip } from "@/components/workspace/MetricStrip";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { WorkspaceState } from "@/components/workspace/WorkspaceState";
import { useRole } from "@/contexts/RoleContext";
import { useOverviewBriefing } from "@/hooks/useOverviewBriefing";
import type { OverviewHistoryBlock, OverviewScrim } from "@/lib/overview-briefing";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function countdown(value: string) {
  const difference = new Date(value).getTime() - Date.now();
  if (difference <= 0) return "Starting now";
  const hours = Math.floor(difference / 3_600_000);
  if (hours < 1) return `Starts in ${Math.max(1, Math.ceil(difference / 60_000))} min`;
  if (hours < 24) return `Starts in ${hours} hr`;
  const days = Math.floor(hours / 24);
  return `Starts in ${days} ${days === 1 ? "day" : "days"}`;
}

function blockPath(block: OverviewScrim) {
  const query = new URLSearchParams({
    opponent: block.opponent_name,
    date: block.starts_at.slice(0, 10),
    format: block.format || "",
    result: block.result || "",
  });
  return `/scrims/${block.id}?${query.toString()}`;
}

function blockOutcome(block: OverviewHistoryBlock) {
  if (block.result?.trim()) return block.result.trim();
  if (
    block.our_score !== null &&
    block.opponent_score !== null &&
    (block.our_score !== 0 || block.opponent_score !== 0)
  ) {
    return `${block.our_score}–${block.opponent_score}`;
  }
  return "Outcome not recorded";
}

function gameRecord(block: OverviewHistoryBlock) {
  const total = block.gameRecord.wins + block.gameRecord.losses;
  return total ? `${block.gameRecord.wins}–${block.gameRecord.losses}` : "No recorded games";
}

export default function Overview() {
  const { isCoach, isManager } = useRole();
  const briefingQuery = useOverviewBriefing();
  const briefing = briefingQuery.data;
  const canSchedule = isCoach || isManager;

  return (
    <div className="space-y-8 pb-12">
      <WorkspacePageHeader
        eyebrow="Team briefing"
        title="Overview"
        description="Upcoming practice, the team schedule, and recent scrim outcomes at a glance."
        actions={
          <>
            {canSchedule && (
              <ScheduleScrimDialog
                trigger={
                  <Button>
                    <Plus className="h-4 w-4" /> Schedule scrim
                  </Button>
                }
              />
            )}
            <Button variant="outline" asChild>
              <Link to="/calendar">
                <CalendarDays className="h-4 w-4" /> View calendar
              </Link>
            </Button>
          </>
        }
      />

      {briefingQuery.isLoading ? (
        <WorkspaceState
          icon={Clock3}
          title="Loading the team overview"
          description="ScrimStats is reading the upcoming schedule and recent results."
        />
      ) : briefingQuery.error || !briefing ? (
        <WorkspaceState
          icon={Clock3}
          title="The team overview is unavailable"
          description="The schedule or recent results could not be loaded. Refresh the page to try again."
        />
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <DataSurface elevated className="p-6 lg:p-8">
              <p className="workspace-eyebrow">Next scrim block</p>
              {briefing.nextBlock ? (
                <>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <span className="ss-mono border border-[var(--workspace-accent)]/30 bg-[var(--workspace-accent)]/10 px-3 py-1 text-xs uppercase tracking-[0.12em] text-[var(--workspace-accent)]">
                      {countdown(briefing.nextBlock.starts_at)}
                    </span>
                    <span className="ss-mono text-xs uppercase tracking-[0.12em] text-[var(--workspace-subtle)]">
                      {briefing.nextBlock.status || "Scheduled"}
                    </span>
                  </div>
                  <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                    vs {briefing.nextBlock.opponent_name}
                  </h2>
                  <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3 text-sm text-[var(--workspace-muted)]">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-[var(--workspace-accent)]" />
                      {formatDateTime(briefing.nextBlock.starts_at)}
                    </span>
                    <span className="flex items-center gap-2">
                      <Swords className="h-4 w-4 text-[var(--workspace-accent)]" />
                      {briefing.nextBlock.format || "Format not set"}
                    </span>
                  </div>
                  {briefing.nextBlock.notes?.trim() && (
                    <div className="mt-7 border-l-2 border-[var(--workspace-accent)]/45 pl-4">
                      <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Block focus</p>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--workspace-muted)]">
                        {briefing.nextBlock.notes}
                      </p>
                    </div>
                  )}
                  <Button className="mt-8" asChild>
                    <Link to={blockPath(briefing.nextBlock)}>
                      Open block <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </>
              ) : (
                <WorkspaceState
                  icon={Swords}
                  title="No scrim block is scheduled"
                  description="The next confirmed practice block will appear here."
                  action={canSchedule ? <ScheduleScrimDialog /> : undefined}
                  className="mt-5"
                />
              )}
            </DataSurface>

            <DataSurface>
              <div className="border-b border-[var(--workspace-rule)] px-5 py-4">
                <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Coming up</p>
                <h2 className="mt-2 text-lg font-semibold">Team agenda</h2>
              </div>
              {briefing.upcomingAgenda.length ? (
                <div className="divide-y divide-[var(--workspace-rule)]">
                  {briefing.upcomingAgenda.map((item) => (
                    <Link key={item.id} to={item.href} className="workspace-ledger-row block px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="mt-1 text-sm text-[var(--workspace-muted)]">
                            {formatDateTime(item.startsAt)}
                          </p>
                          {item.detail && (
                            <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--workspace-subtle)]">
                              {item.type === "scrim" ? <Swords className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                              {item.detail}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="mt-1 h-4 w-4 text-[var(--workspace-subtle)]" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <WorkspaceState
                  icon={CalendarDays}
                  title="Nothing else is scheduled"
                  description="Additional team events will appear here."
                  className="m-5"
                />
              )}
            </DataSurface>
          </div>

          <MetricStrip
            items={[
              {
                label: "Recorded games · 30 days",
                value: `${briefing.recentGameRecord.wins}–${briefing.recentGameRecord.losses}`,
                detail: "explicitly saved game outcomes",
              },
              {
                label: "Completed blocks · 30 days",
                value: briefing.completedBlocksLast30Days,
                detail: "completed or result-recorded scrims",
              },
              {
                label: "Scheduled · next 7 days",
                value: briefing.scheduledEventsNext7Days,
                detail: "scrims and team calendar events",
              },
            ]}
          />

          <ActionCycleRail compact />

          <DataSurface>
            <div className="flex items-end justify-between gap-4 border-b border-[var(--workspace-rule)] px-5 py-4">
              <div>
                <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Recent results</p>
                <h2 className="mt-2 text-lg font-semibold">Completed scrim blocks</h2>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/scrims">All blocks <ChevronRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            {briefing.recentBlocks.length ? (
              <div className="divide-y divide-[var(--workspace-rule)]">
                {briefing.recentBlocks.map((block) => (
                  <Link
                    key={block.id}
                    to={blockPath(block)}
                    className="workspace-ledger-row grid gap-4 px-5 py-5 sm:grid-cols-[minmax(12rem,1fr)_0.65fr_0.65fr_0.8fr_auto] sm:items-center"
                  >
                    <div>
                      <p className="font-semibold">vs {block.opponent_name}</p>
                      <p className="mt-1 text-xs text-[var(--workspace-subtle)]">{formatDate(block.starts_at)}</p>
                    </div>
                    <div>
                      <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Block outcome</p>
                      <p className="mt-1 text-sm">{blockOutcome(block)}</p>
                    </div>
                    <div>
                      <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Recorded games</p>
                      <p className="ss-mono mt-1 text-sm">{gameRecord(block)}</p>
                    </div>
                    <div>
                      <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Format</p>
                      <p className="mt-1 text-sm text-[var(--workspace-muted)]">{block.format || "Not set"}</p>
                    </div>
                    <ChevronRight className="hidden h-4 w-4 text-[var(--workspace-subtle)] sm:block" />
                  </Link>
                ))}
              </div>
            ) : (
              <WorkspaceState
                icon={Swords}
                title="No completed scrims yet"
                description="Completed blocks and their explicitly saved outcomes will appear here."
                className="m-5"
              />
            )}
          </DataSurface>
        </>
      )}
    </div>
  );
}
