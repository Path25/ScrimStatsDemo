import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  MessageSquareText,
  Pencil,
  Plus,
  RotateCcw,
  Target,
} from "lucide-react";

import { BlockReviewDialog } from "@/components/scrims/BlockReviewDialog";
import { EditScrimDialog } from "@/components/scrims/EditScrimDialog";
import { GameReviewDialog } from "@/components/scrims/GameReviewDialog";
import { GameEvidenceDialog } from "@/components/scrims/GameEvidenceDialog";
import { GameOverviewTab } from "@/components/scrims/GameOverviewTab";
import { DraftView } from "@/components/scrims/DraftView";
import { CoachFeedback } from "@/components/scrims/CoachFeedback";
import { CoachingActionDialog } from "@/components/actions/CoachingActionDialog";
import { ActionCycleRail } from "@/components/actions/ActionCycleRail";
import { ReviewChecklist } from "@/components/scrims/ReviewChecklist";
import { ReviewStatusBadge } from "@/components/scrims/ReviewStatusBadge";
import { PracticeDevelopmentGameEvidenceChip } from "@/components/practice-development/PracticeDevelopmentGameEvidenceChip";
import { PracticeDevelopmentPanel } from "@/components/practice-development/PracticeDevelopmentPanel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataSurface } from "@/components/workspace/DataSurface";
import { MetricStrip } from "@/components/workspace/MetricStrip";
import { WorkspaceState } from "@/components/workspace/WorkspaceState";
import { useRole } from "@/contexts/RoleContext";
import { useScrimBlock } from "@/hooks/useScrimBlock";
import { useScrimGames } from "@/hooks/useScrimGames";
import type { Scrim } from "@/hooks/useOptimizedScrimsData";
import { useScrimParticipants } from "@/hooks/useScrimParticipants";
import {
  blockScoreLabel,
  buildReviewChecklist,
  formatGameDuration,
  gameReviewComplete,
  type ReviewStatus,
} from "@/lib/scrim-review";
import type { ScrimGame } from "@/types/scrimGame";

function localDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date and time not recorded";
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function recordedNumber(value: number | null | undefined) {
  return value === null || value === undefined ? "Not recorded" : value.toLocaleString();
}

function PanelLoading({ label = "Loading saved review data…" }: { label?: string }) {
  return (
    <div className="grid min-h-72 place-items-center border border-[var(--workspace-rule)] bg-[var(--workspace-surface)] text-sm text-[var(--workspace-muted)]">
      {label}
    </div>
  );
}

export function ScrimBlockView({ scrimId, onClose }: { scrimId: string; onClose: () => void }) {
  const { canManageTeam } = useRole();
  const {
    block,
    error: blockError,
    isLoading: blockLoading,
    isReopening,
    reopenReview,
  } = useScrimBlock(scrimId);
  const {
    deleteScrimGame,
    error: gamesError,
    isDeleting,
    isLoading: gamesLoading,
    scrimGames,
  } = useScrimGames(scrimId);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const selectedGame = scrimGames.find((game) => game.id === selectedGameId) || null;
  const selectedGameIndex = selectedGame
    ? scrimGames.findIndex((game) => game.id === selectedGame.id)
    : -1;
  const {
    participants,
    isLoading: participantsLoading,
    error: participantsError,
  } = useScrimParticipants(selectedGame?.id);

  useEffect(() => {
    if (selectedGameId && !scrimGames.some((game) => game.id === selectedGameId)) {
      setSelectedGameId(null);
    }
  }, [scrimGames, selectedGameId]);

  const summary = useMemo(() => {
    const activeGames = scrimGames.filter((game) => game.status !== "cancelled");
    const reviewed = activeGames.filter(gameReviewComplete).length;
    const blue = activeGames.filter((game) => game.side === "blue").length;
    const red = activeGames.filter((game) => game.side === "red").length;
    const durations = activeGames
      .map((game) => game.duration_seconds)
      .filter((duration): duration is number => duration !== null && duration !== undefined);
    return {
      activeGames,
      averageDuration: durations.length
        ? Math.round(durations.reduce((total, duration) => total + duration, 0) / durations.length)
        : null,
      blue,
      red,
      reviewed,
    };
  }, [scrimGames]);

  function selectGame(gameId: string | null) {
    setSelectedGameId(gameId);
    setActiveTab("overview");
  }

  if (blockLoading || gamesLoading) return <PanelLoading />;

  if (blockError || gamesError) {
    return (
      <WorkspaceState
        icon={Clock3}
        title="This practice block could not be loaded."
        description="Try again shortly, or return to the scrim list and reopen this block."
        action={<Button onClick={onClose}>Back to scrim blocks</Button>}
      />
    );
  }

  if (!block) {
    return (
      <WorkspaceState
        icon={Clock3}
        title="Practice block not found."
        description="It may have been archived, deleted, or belong to another workspace."
        action={<Button onClick={onClose}>Back to scrim blocks</Button>}
      />
    );
  }

  const reviewStatus = (block.review_status || "not_started") as ReviewStatus;
  const checks = buildReviewChecklist(scrimGames, {
    opponent_score: block.opponent_score,
    our_score: block.our_score,
    result: block.result,
    result_source: block.result_source === "manual" ? "manual" : "games",
    review_status: reviewStatus,
  });

  return (
    <div className="space-y-6 pb-12">
      <header className="sticky top-[61px] z-20 border-y border-[var(--workspace-rule-strong)] bg-[color:rgba(10,16,22,.94)] px-4 py-4 backdrop-blur-xl sm:px-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-start gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Back to scrim blocks">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <p className="workspace-eyebrow">Practice block review</p>
              <h1 className="mt-1 truncate text-2xl font-semibold tracking-[-0.03em]">
                vs {block.opponent_name || "Opponent not recorded"}
              </h1>
              <p className="mt-1 text-sm text-[var(--workspace-muted)]">
                {localDateTime(block.starts_at)} · {block.format || "Format not recorded"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pl-12 lg:pl-0">
            <ReviewStatusBadge status={reviewStatus} />
            {canManageTeam && (
              <>
                <EditScrimDialog
                  scrim={block as unknown as Scrim}
                  trigger={<Button variant="outline"><Pencil className="h-4 w-4" /> Edit block</Button>}
                />
                {reviewStatus === "complete" ? (
                  <Button variant="outline" disabled={isReopening} onClick={() => void reopenReview()}>
                    <RotateCcw className="h-4 w-4" /> {isReopening ? "Reopening…" : "Reopen review"}
                  </Button>
                ) : (
                  <BlockReviewDialog
                    block={block}
                    games={scrimGames}
                    trigger={<Button>Complete review</Button>}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto border-b border-[var(--workspace-rule)] pb-3" aria-label="Select block or game">
        <Button variant={!selectedGame ? "default" : "ghost"} onClick={() => selectGame(null)} className="shrink-0">
          Block summary
        </Button>
        {scrimGames.map((game) => (
          <Button
            key={game.id}
            variant={selectedGame?.id === game.id ? "secondary" : "ghost"}
            onClick={() => selectGame(game.id)}
            className="shrink-0"
          >
            Game {game.game_number}
            <span className="ss-mono text-xs uppercase">
              {game.result === "win" ? "W" : game.result === "loss" ? "L" : "—"}
            </span>
          </Button>
        ))}
        {canManageTeam && (
          <GameReviewDialog
            scrimId={scrimId}
            defaultGameNumber={Math.max(0, ...scrimGames.map((game) => game.game_number)) + 1}
            trigger={<Button variant="outline" className="shrink-0"><Plus className="h-4 w-4" /> Add game</Button>}
          />
        )}
      </div>

      {!selectedGame ? (
        <div className="space-y-6">
          <MetricStrip
            items={[
              {
                label: reviewStatus === "complete" ? "Final score" : "Recorded-game score",
                value: blockScoreLabel({
                  opponent_score: block.opponent_score,
                  our_score: block.our_score,
                  result: block.result,
                  result_source: block.result_source === "manual" ? "manual" : "games",
                  review_status: reviewStatus,
                }),
                detail: block.result_source === "manual" ? "staff-corrected score" : "from explicit game outcomes",
              },
              {
                label: "Games reviewed",
                value: `${summary.reviewed}/${summary.activeGames.length}`,
                detail: "rating and summary complete",
              },
              {
                label: "Side distribution",
                value: summary.blue || summary.red ? `${summary.blue}B · ${summary.red}R` : "Not recorded",
                detail: "explicitly saved sides",
              },
              {
                label: "Average duration",
                value: formatGameDuration(summary.averageDuration),
                detail: summary.averageDuration === null ? "Not recorded" : "saved game durations",
              },
            ]}
          />

          <PracticeDevelopmentPanel
            games={scrimGames.map((game) => ({ id: game.id, gameNumber: game.game_number, status: game.status }))}
            reviewStatus={reviewStatus}
            scrimId={scrimId}
            scrimStartsAt={block.starts_at}
          />

          {block.notes && (
            <DataSurface className="p-5">
              <p className="workspace-eyebrow">Block focus and notes</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--workspace-foreground)]">{block.notes}</p>
            </DataSurface>
          )}

          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <DataSurface>
              <div className="flex flex-col gap-3 border-b border-[var(--workspace-rule)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold">Game history</h2>
                  <p className="mt-1 text-sm text-[var(--workspace-muted)]">Saved outcomes and review details for this block.</p>
                </div>
                {canManageTeam && (
                  <GameReviewDialog
                    scrimId={scrimId}
                    defaultGameNumber={Math.max(0, ...scrimGames.map((game) => game.game_number)) + 1}
                    trigger={<Button size="sm"><Plus className="h-4 w-4" /> Add game</Button>}
                  />
                )}
              </div>
              {scrimGames.length ? (
                <div className="divide-y divide-[var(--workspace-rule)]">
                  {scrimGames.map((game) => (
                    <div key={game.id} className="workspace-ledger-row grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                      <button type="button" onClick={() => selectGame(game.id)} className="min-w-0 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">Game {game.game_number}</span>
                          <span className="ss-mono text-xs uppercase text-[var(--workspace-subtle)]">
                            {game.result || "Outcome not recorded"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[var(--workspace-muted)]">
                          {game.side ? `${game.side} side` : "Side not recorded"} · {formatGameDuration(game.duration_seconds)} · {recordedNumber(game.our_team_kills)}–{recordedNumber(game.enemy_team_kills)} kills
                        </p>
                      </button>
                      <div className="flex items-center gap-2 sm:justify-end">
                        {canManageTeam && (
                          <GameReviewDialog
                            scrimId={scrimId}
                            game={game}
                            defaultGameNumber={game.game_number}
                            trigger={<Button size="sm" variant="outline"><Pencil className="h-3.5 w-3.5" /> Edit</Button>}
                          />
                        )}
                        <Button variant="ghost" size="icon" onClick={() => selectGame(game.id)} aria-label={`Open game ${game.game_number}`}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <WorkspaceState
                  icon={Clock3}
                  title="No games have been recorded."
                  description={canManageTeam ? "Add a game to begin the structured review." : "Staff have not added a game review yet."}
                  className="m-5"
                />
              )}
            </DataSurface>
            <ReviewChecklist checks={checks} />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <ActionCycleRail scrimId={scrimId} scrimGameId={selectedGame.id} compact />
          <DataSurface className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">Game {selectedGame.game_number}</h2>
                <GameEvidenceDialog compact gameId={selectedGame.id} />
                <PracticeDevelopmentGameEvidenceChip gameId={selectedGame.id} gameStatus={selectedGame.status} scrimId={scrimId} scrimStartsAt={block.starts_at} />
              </div>
              <p className="mt-2 text-sm text-[var(--workspace-muted)]">
                {selectedGame.result ? `${selectedGame.result === "win" ? "Win" : "Loss"}` : "Outcome not recorded"} · {selectedGame.side ? `${selectedGame.side} side` : "Side not recorded"} · {formatGameDuration(selectedGame.duration_seconds)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="ss-mono mr-2 text-sm">{recordedNumber(selectedGame.our_team_kills)}–{recordedNumber(selectedGame.enemy_team_kills)} kills</span>
              {canManageTeam && (
                <>
                  <CoachingActionDialog scrimId={scrimId} scrimGameId={selectedGame.id} />
                  <GameReviewDialog
                    scrimId={scrimId}
                    game={selectedGame}
                    defaultGameNumber={selectedGame.game_number}
                    trigger={<Button variant="outline"><Pencil className="h-4 w-4" /> Edit game</Button>}
                  />
                </>
              )}
              <Button variant="ghost" size="icon" onClick={() => selectGame(scrimGames[selectedGameIndex - 1]?.id || null)} disabled={selectedGameIndex <= 0} aria-label="Previous game">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => selectGame(scrimGames[selectedGameIndex + 1]?.id || null)} disabled={selectedGameIndex >= scrimGames.length - 1} aria-label="Next game">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </DataSurface>

          {participantsError && (
            <p className="border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-100">
              Participant evidence could not be loaded. The game summary remains available.
            </p>
          )}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid h-auto w-full grid-cols-3 border border-[var(--workspace-rule)] bg-[var(--workspace-surface)] p-1">
              <TabsTrigger value="overview" className="min-h-10 text-xs sm:text-sm"><ClipboardList className="mr-2 h-4 w-4" /> Summary</TabsTrigger>
              <TabsTrigger value="draft" className="min-h-10 text-xs sm:text-sm"><Target className="mr-2 h-4 w-4" /> Draft</TabsTrigger>
              <TabsTrigger value="feedback" className="min-h-10 text-xs sm:text-sm"><MessageSquareText className="mr-2 h-4 w-4" /> Review notes</TabsTrigger>
            </TabsList>
            <div className="mt-5">
                <TabsContent value="overview" className="mt-0">
                  {participantsLoading ? <PanelLoading label="Loading participant evidence…" /> : <GameOverviewTab game={selectedGame} participants={participants} />}
                </TabsContent>
                <TabsContent value="draft" className="mt-0"><DraftView game={selectedGame} participants={participants} /></TabsContent>
                <TabsContent value="feedback" className="mt-0"><CoachFeedback game={selectedGame} participants={participants} canEdit={canManageTeam} /></TabsContent>
            </div>
          </Tabs>

          {canManageTeam && (
            <div className="flex justify-end border-t border-[var(--workspace-rule)] pt-5">
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={() => {
                  if (window.confirm(`Delete game ${selectedGame.game_number}? This cannot be undone.`)) {
                    deleteScrimGame(selectedGame.id);
                  }
                }}
              >
                {isDeleting ? "Deleting…" : "Delete game"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
