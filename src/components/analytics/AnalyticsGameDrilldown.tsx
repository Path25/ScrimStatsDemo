import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { TeamAnalyticsGame } from "@/lib/analytics/team-analytics";

function resultLabel(result: TeamAnalyticsGame["result"]) {
  if (result === "win") return "Win";
  if (result === "loss") return "Loss";
  if (result === "draw") return "Draw";
  return "Outcome not recorded";
}

export function AnalyticsGameDrilldown({
  games,
  label = "View games",
  title,
}: {
  games: TeamAnalyticsGame[];
  label?: string;
  title: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" disabled={!games.length}>{label}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{games.length} qualifying game{games.length === 1 ? "" : "s"}. These are the exact records used by this view.</DialogDescription>
        </DialogHeader>
        <div className="divide-y divide-[var(--workspace-rule)] border-y border-[var(--workspace-rule)]">
          {games.map((game) => (
            <div key={game.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">vs {game.opponent_name}</span>
                  <span className="ss-mono text-xs uppercase text-[var(--workspace-subtle)]">Game {game.game_number}</span>
                </div>
                <p className="mt-1 text-sm text-[var(--workspace-muted)]">
                  {new Date(game.played_at).toLocaleDateString()} · {resultLabel(game.result)} · {game.side ? `${game.side} side` : "Side not recorded"}
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to={`/scrims/${game.scrim_id}`}>Open review <ArrowUpRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
