import { useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MoreHorizontal,
  Plus,
  Search,
  Swords,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { EditScrimDialog } from "@/components/scrims/EditScrimDialog";
import { ReviewStatusBadge } from "@/components/scrims/ReviewStatusBadge";
import { ScheduleScrimDialog } from "@/components/scrims/ScheduleScrimDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataSurface } from "@/components/workspace/DataSurface";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { WorkspaceState } from "@/components/workspace/WorkspaceState";
import { useRole } from "@/contexts/RoleContext";
import { type Scrim, useOptimizedScrimsData } from "@/hooks/useOptimizedScrimsData";
import { useScrimsData } from "@/hooks/useScrimsData";
import { blockScoreLabel, type ReviewStatus } from "@/lib/scrim-review";
import { cn } from "@/lib/utils";

const HISTORY_PAGE_SIZE = 12;

function localDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { date: "Date not recorded", time: "Time not recorded" };
  }
  return {
    date: date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
    time: date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
}

function ResultMark({ scrim }: { scrim: Scrim }) {
  const label = blockScoreLabel({
    opponent_score: scrim.opponent_score,
    our_score: scrim.our_score,
    result: scrim.result,
    result_source: scrim.result_source === "manual" ? "manual" : "games",
    review_status: (scrim.review_status || "not_started") as ReviewStatus,
  });
  if (scrim.our_score === null || scrim.opponent_score === null) {
    return <span className="text-sm text-[var(--workspace-subtle)]">Outcome not recorded</span>;
  }
  return (
    <span
      className={cn(
        "ss-mono inline-flex min-w-20 justify-center border px-2 py-1 text-xs font-medium",
        scrim.result === "win"
          ? "border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-300"
          : scrim.result === "loss"
            ? "border-rose-400/25 bg-rose-400/[0.07] text-rose-300"
            : "border-white/10 bg-white/[0.035] text-[var(--workspace-muted)]",
      )}
    >
      {label}
    </span>
  );
}

export default function Scrims() {
  const { isCoach, isManager } = useRole();
  const canEdit = isManager || isCoach;
  const navigate = useNavigate();
  const { deleteScrim } = useScrimsData();
  const [editingScrim, setEditingScrim] = useState<Scrim | null>(null);
  const [opponentSearch, setOpponentSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("all");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [page, setPage] = useState(1);

  const upcomingQuery = useOptimizedScrimsData({
    includeGames: true,
    mode: "upcoming",
    pageSize: 4,
  });
  const historyQuery = useOptimizedScrimsData({
    includeGames: true,
    mode: "history",
    opponent: opponentSearch,
    page,
    pageSize: HISTORY_PAGE_SIZE,
    result: resultFilter === "all" ? undefined : resultFilter as "win" | "loss" | "draw" | "unrecorded",
    reviewStatus:
      reviewFilter === "all"
        ? undefined
        : reviewFilter as "not_started" | "in_review" | "complete",
  });

  const upcoming = upcomingQuery.data?.scrims || [];
  const featured = upcoming[0];
  const queue = upcoming.slice(1);
  const history = historyQuery.data?.scrims || [];
  const historyCount = historyQuery.data?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(historyCount / HISTORY_PAGE_SIZE));

  function deleteBlock(scrim: Scrim) {
    const confirmed = window.confirm(
      `Delete the block against ${scrim.opponent_name}? Its recorded games will also be removed. This cannot be undone.`,
    );
    if (confirmed) deleteScrim(scrim.id);
  }

  function resetPage() {
    setPage(1);
  }

  return (
    <div className="space-y-8 pb-10">
      <WorkspacePageHeader
        eyebrow="Practice workspace"
        title="Scrim blocks"
        description="Plan practice, capture confirmed outcomes, and finish each coaching review."
        actions={
          canEdit ? (
            <ScheduleScrimDialog
              trigger={
                <Button><Plus className="h-4 w-4" /> Schedule scrim</Button>
              }
            />
          ) : undefined
        }
      />

      {upcomingQuery.isLoading ? (
        <WorkspaceState icon={Clock3} title="Loading upcoming practice" description="Reading the current team schedule." />
      ) : upcomingQuery.error ? (
        <WorkspaceState icon={Clock3} title="Upcoming practice is unavailable" description="Refresh the page to try again." />
      ) : featured ? (
        <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <DataSurface elevated className="overflow-hidden">
            <div className="border-b border-[var(--workspace-rule)] px-5 py-4">
              <p className="workspace-eyebrow">Next practice block</p>
            </div>
            <div className="grid gap-6 p-5 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h2 className="text-3xl font-semibold tracking-[-0.04em]">vs {featured.opponent_name}</h2>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--workspace-muted)]">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {localDateTime(featured.starts_at).date}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4" />
                    {localDateTime(featured.starts_at).time}
                  </span>
                  <span>{featured.format || "Format not recorded"}</span>
                  <span className="capitalize">{featured.status.replace("_", " ")}</span>
                </div>
                <div className="mt-6 border-l-2 border-[var(--workspace-accent)] pl-4">
                  <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Focus</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--workspace-muted)]">
                    {featured.notes?.trim() || "No block focus has been saved."}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {canEdit && (
                  <Button variant="secondary" onClick={() => setEditingScrim(featured)}>Edit block</Button>
                )}
                <Button onClick={() => navigate(`/scrims/${featured.id}`)}>Open block</Button>
              </div>
            </div>
          </DataSurface>

          <DataSurface>
            <div className="flex items-center justify-between border-b border-[var(--workspace-rule)] px-5 py-4">
              <div>
                <p className="workspace-eyebrow">Upcoming queue</p>
                <h2 className="mt-2 font-semibold">Following blocks</h2>
              </div>
              <span className="ss-mono text-xs text-[var(--workspace-subtle)]">{queue.length}</span>
            </div>
            {queue.length ? (
              <div className="divide-y divide-[var(--workspace-rule)]">
                {queue.map((scrim) => (
                  <button
                    key={scrim.id}
                    type="button"
                    onClick={() => navigate(`/scrims/${scrim.id}`)}
                    className="workspace-ledger-row flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">vs {scrim.opponent_name}</span>
                      <span className="mt-1 block text-xs text-[var(--workspace-subtle)]">
                        {localDateTime(scrim.starts_at).date} · {localDateTime(scrim.starts_at).time}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[var(--workspace-subtle)]" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="px-5 py-6 text-sm text-[var(--workspace-muted)]">No later blocks are scheduled.</p>
            )}
          </DataSurface>
        </section>
      ) : (
        <WorkspaceState
          icon={Swords}
          title="No upcoming practice is scheduled"
          description="Create a block when the opponent and time are confirmed."
          action={canEdit ? <ScheduleScrimDialog /> : undefined}
        />
      )}

      <section>
        <div className="mb-4">
          <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Scrim history</p>
          <div className="mt-2 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
            <div>
              <h2 className="text-xl font-semibold">Completed and past blocks</h2>
              <p className="mt-1 text-sm text-[var(--workspace-muted)]">
                Find results and return to reviews that still need coaching detail.
              </p>
            </div>
            <span className="ss-mono text-xs text-[var(--workspace-subtle)]">{historyCount} blocks</span>
          </div>
        </div>

        <DataSurface>
          <div className="grid gap-3 border-b border-[var(--workspace-rule)] p-4 md:grid-cols-[minmax(14rem,1fr)_12rem_12rem]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--workspace-subtle)]" />
              <Input
                value={opponentSearch}
                onChange={(event) => {
                  setOpponentSearch(event.target.value);
                  resetPage();
                }}
                placeholder="Search opponent"
                aria-label="Search scrim history by opponent"
                className="pl-9"
              />
            </div>
            <Select
              value={resultFilter}
              onValueChange={(value) => {
                setResultFilter(value);
                resetPage();
              }}
            >
              <SelectTrigger aria-label="Filter by result"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All outcomes</SelectItem>
                <SelectItem value="win">Wins</SelectItem>
                <SelectItem value="loss">Losses</SelectItem>
                <SelectItem value="draw">Draws</SelectItem>
                <SelectItem value="unrecorded">Not recorded</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={reviewFilter}
              onValueChange={(value) => {
                setReviewFilter(value);
                resetPage();
              }}
            >
              <SelectTrigger aria-label="Filter by review progress"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All review states</SelectItem>
                <SelectItem value="not_started">Not started</SelectItem>
                <SelectItem value="in_review">In review</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {historyQuery.isLoading ? (
            <WorkspaceState icon={Clock3} title="Loading team history" description="Reading the saved practice blocks." className="m-4" />
          ) : historyQuery.error ? (
            <WorkspaceState icon={Clock3} title="Team history is unavailable" description="Refresh the page to try again." className="m-4" />
          ) : history.length ? (
            <>
              <div className="hidden grid-cols-[minmax(13rem,1.2fr)_0.7fr_0.6fr_0.8fr_0.8fr_auto] gap-4 border-b border-[var(--workspace-rule)] px-5 py-3 md:grid">
                {["Opponent", "Score", "Games", "Date", "Review", ""].map((heading) => (
                  <span key={heading} className="workspace-eyebrow text-[var(--workspace-subtle)]">{heading}</span>
                ))}
              </div>
              <div className="divide-y divide-[var(--workspace-rule)]">
                {history.map((scrim) => (
                  <article
                    key={scrim.id}
                    className="workspace-ledger-row px-5 py-5 md:grid md:grid-cols-[minmax(13rem,1.2fr)_0.7fr_0.6fr_0.8fr_0.8fr_auto] md:items-center md:gap-4 md:py-4"
                  >
                    <button
                      type="button"
                      className="text-left font-semibold hover:text-[var(--workspace-accent)]"
                      onClick={() => navigate(`/scrims/${scrim.id}`)}
                    >
                      vs {scrim.opponent_name}
                      <span className="mt-1 block text-xs font-normal text-[var(--workspace-subtle)]">
                        {scrim.format || "Format not recorded"}
                      </span>
                    </button>
                    <div className="mt-4 md:mt-0"><ResultMark scrim={scrim} /></div>
                    <p className="ss-mono mt-3 text-sm text-[var(--workspace-muted)] md:mt-0">
                      {scrim.scrim_games?.length || 0}
                    </p>
                    <p className="mt-3 text-sm text-[var(--workspace-muted)] md:mt-0">
                      {localDateTime(scrim.starts_at).date}
                    </p>
                    <div className="mt-3 md:mt-0">
                      <ReviewStatusBadge status={(scrim.review_status || "not_started") as ReviewStatus} />
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-[var(--workspace-rule)] pt-4 md:mt-0 md:border-0 md:pt-0">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/scrims/${scrim.id}`)}>
                        Review
                      </Button>
                      {canEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={`Actions for ${scrim.opponent_name}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingScrim(scrim)}>Edit block</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteBlock(scrim)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete block
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </article>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-[var(--workspace-rule)] px-4 py-3">
                <p className="text-xs text-[var(--workspace-subtle)]">Page {page} of {totalPages}</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Previous history page">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} aria-label="Next history page">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <WorkspaceState icon={Swords} title="No blocks match these filters" description="Adjust the opponent, outcome, or review filters." className="m-4" />
          )}
        </DataSurface>
      </section>

      {editingScrim && (
        <EditScrimDialog
          scrim={editingScrim}
          open
          onOpenChange={(open) => !open && setEditingScrim(null)}
        />
      )}
    </div>
  );
}
