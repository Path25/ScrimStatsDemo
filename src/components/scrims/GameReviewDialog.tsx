import { useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useScrimGames } from "@/hooks/useScrimGames";
import type { GameResult, GameSide, GameStatus, ScrimGame } from "@/types/scrimGame";

function optionalNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function RatingSelect({
  id,
  label,
  onChange,
  required,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Not recorded" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Not recorded</SelectItem>
          {[1, 2, 3, 4, 5].map((rating) => (
            <SelectItem key={rating} value={String(rating)}>
              {rating} / 5
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function GameReviewDialog({
  defaultGameNumber,
  game,
  scrimId,
  trigger,
}: {
  defaultGameNumber: number;
  game?: ScrimGame;
  scrimId: string;
  trigger: ReactNode;
}) {
  const { isSavingReview, saveGameReview } = useScrimGames(scrimId);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameNumber, setGameNumber] = useState(String(game?.game_number || defaultGameNumber));
  const [status, setStatus] = useState<GameStatus>(game?.status || "pending");
  const [side, setSide] = useState(game?.side || "none");
  const [result, setResult] = useState(game?.result || "none");
  const [durationMinutes, setDurationMinutes] = useState(
    game?.duration_seconds === null || game?.duration_seconds === undefined
      ? ""
      : String(Math.floor(game.duration_seconds / 60)),
  );
  const [ourKills, setOurKills] = useState(game?.our_team_kills?.toString() || "");
  const [enemyKills, setEnemyKills] = useState(game?.enemy_team_kills?.toString() || "");
  const [ourGold, setOurGold] = useState(game?.our_team_gold?.toString() || "");
  const [enemyGold, setEnemyGold] = useState(game?.enemy_team_gold?.toString() || "");
  const [performanceRating, setPerformanceRating] = useState(
    game?.performance_rating?.toString() || "none",
  );
  const [earlyRating, setEarlyRating] = useState(game?.early_game_rating?.toString() || "none");
  const [midRating, setMidRating] = useState(game?.mid_game_rating?.toString() || "none");
  const [lateRating, setLateRating] = useState(game?.late_game_rating?.toString() || "none");
  const [performanceSummary, setPerformanceSummary] = useState(game?.performance_summary || "");
  const [notes, setNotes] = useState(game?.notes || "");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const parsedGameNumber = Number(gameNumber);
    if (!Number.isInteger(parsedGameNumber) || parsedGameNumber < 1) {
      setError("Game number must be at least 1.");
      return;
    }
    if (status === "completed" && result === "none") {
      setError("Completed games require a win or loss.");
      return;
    }

    try {
      await saveGameReview({
        id: game?.id,
        gameNumber: parsedGameNumber,
        status,
        side: side === "none" ? null : (side as GameSide),
        result: result === "none" ? null : (result as GameResult),
        durationSeconds:
          durationMinutes.trim() === "" ? null : Math.round(Number(durationMinutes) * 60),
        ourTeamKills: optionalNumber(ourKills),
        enemyTeamKills: optionalNumber(enemyKills),
        ourTeamGold: optionalNumber(ourGold),
        enemyTeamGold: optionalNumber(enemyGold),
        performanceRating: performanceRating === "none" ? null : Number(performanceRating),
        performanceSummary: performanceSummary.trim() || null,
        earlyGameRating: earlyRating === "none" ? null : Number(earlyRating),
        midGameRating: midRating === "none" ? null : Number(midRating),
        lateGameRating: lateRating === "none" ? null : Number(lateRating),
        notes: notes.trim() || null,
      });
      setOpen(false);
    } catch {
      // The hook presents the database validation message in a toast.
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{game ? `Review game ${game.game_number}` : "Add game review"}</DialogTitle>
          <DialogDescription>
            Save only confirmed outcomes and statistics. Missing fields remain visibly unrecorded.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor="review-game-number">Game number</Label>
              <Input
                id="review-game-number"
                type="number"
                min={1}
                value={gameNumber}
                onChange={(event) => setGameNumber(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="review-game-status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as GameStatus)}>
                <SelectTrigger id="review-game-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="review-game-side">Our side</Label>
              <Select value={side} onValueChange={setSide}>
                <SelectTrigger id="review-game-side"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not recorded</SelectItem>
                  <SelectItem value="blue">Blue side</SelectItem>
                  <SelectItem value="red">Red side</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="review-game-result">Outcome</Label>
              <Select value={result} onValueChange={setResult}>
                <SelectTrigger id="review-game-result"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not recorded</SelectItem>
                  <SelectItem value="win">Win</SelectItem>
                  <SelectItem value="loss">Loss</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <p className="workspace-eyebrow mb-3">Basic statistics</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["review-duration", "Duration (min)", durationMinutes, setDurationMinutes],
                ["review-our-kills", "Our kills", ourKills, setOurKills],
                ["review-enemy-kills", "Opponent kills", enemyKills, setEnemyKills],
                ["review-our-gold", "Our gold", ourGold, setOurGold],
                ["review-enemy-gold", "Opponent gold", enemyGold, setEnemyGold],
              ].map(([id, label, value, setter]) => (
                <div key={id as string} className="grid gap-2">
                  <Label htmlFor={id as string}>{label as string}</Label>
                  <Input
                    id={id as string}
                    type="number"
                    min={0}
                    step={id === "review-duration" ? "0.1" : "1"}
                    value={value as string}
                    onChange={(event) => (setter as (next: string) => void)(event.target.value)}
                    placeholder="Not recorded"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <RatingSelect id="performance-rating" label="Overall performance" required value={performanceRating} onChange={setPerformanceRating} />
            <RatingSelect id="early-rating" label="Early game" value={earlyRating} onChange={setEarlyRating} />
            <RatingSelect id="mid-rating" label="Mid game" value={midRating} onChange={setMidRating} />
            <RatingSelect id="late-rating" label="Late game" value={lateRating} onChange={setLateRating} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="performance-summary">Team performance summary *</Label>
            <Textarea
              id="performance-summary"
              value={performanceSummary}
              onChange={(event) => setPerformanceSummary(event.target.value)}
              placeholder="What did the team execute well, and what needs to change next game?"
              className="min-h-24"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="game-notes">Additional game notes</Label>
            <Textarea
              id="game-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional context that does not belong in the coaching summary."
            />
          </div>

          {error && <p className="text-sm text-rose-300" role="alert">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSavingReview}>
              {isSavingReview ? "Saving…" : "Save game review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
