import type { ScrimGame } from "@/types/scrimGame";

export type ReviewStatus = "not_started" | "in_review" | "complete";
export type ResultSource = "games" | "manual";

export interface ReviewableBlock {
  opponent_score: number | null;
  our_score: number | null;
  result: string | null;
  result_source: ResultSource;
  review_status: ReviewStatus;
}

export interface ReviewCheck {
  complete: boolean;
  detail: string;
  label: string;
}

export function recordedGameScore(games: ScrimGame[]) {
  const reviewedGames = games.filter(
    (game) => game.status !== "cancelled" && (game.result === "win" || game.result === "loss"),
  );

  return {
    losses: reviewedGames.filter((game) => game.result === "loss").length,
    recorded: reviewedGames.length,
    wins: reviewedGames.filter((game) => game.result === "win").length,
  };
}

export function deriveBlockResult(ourScore: number, opponentScore: number) {
  if (ourScore > opponentScore) return "win" as const;
  if (ourScore < opponentScore) return "loss" as const;
  return "draw" as const;
}

export function blockScoreLabel(block: ReviewableBlock) {
  if (block.our_score === null || block.opponent_score === null) return "Outcome not recorded";
  const score = `${block.our_score}–${block.opponent_score}`;
  return block.review_status === "complete" ? score : `${score} recorded`;
}

export function gameReviewComplete(game: ScrimGame) {
  return Boolean(
    game.status !== "cancelled" &&
      game.result &&
      game.side &&
      game.performance_rating &&
      game.performance_summary?.trim(),
  );
}

export function buildReviewChecklist(games: ScrimGame[], block: ReviewableBlock): ReviewCheck[] {
  const activeGames = games.filter((game) => game.status !== "cancelled");
  const outcomes = activeGames.filter((game) => game.result).length;
  const sides = activeGames.filter((game) => game.side).length;
  const performance = activeGames.filter(
    (game) => game.performance_rating && game.performance_summary?.trim(),
  ).length;
  const scoreResolved = block.our_score !== null && block.opponent_score !== null;

  return [
    {
      label: "Games recorded",
      complete: activeGames.length > 0,
      detail: activeGames.length ? `${activeGames.length} saved` : "Add at least one game",
    },
    {
      label: "Outcomes saved",
      complete: activeGames.length > 0 && outcomes === activeGames.length,
      detail: `${outcomes}/${activeGames.length}`,
    },
    {
      label: "Sides saved",
      complete: activeGames.length > 0 && sides === activeGames.length,
      detail: `${sides}/${activeGames.length}`,
    },
    {
      label: "Performance reviewed",
      complete: activeGames.length > 0 && performance === activeGames.length,
      detail: `${performance}/${activeGames.length}`,
    },
    {
      label: "Score resolved",
      complete: scoreResolved,
      detail: scoreResolved ? `${block.our_score}–${block.opponent_score}` : "Not recorded",
    },
  ];
}

export function formatGameDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined) return "Not recorded";
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}
