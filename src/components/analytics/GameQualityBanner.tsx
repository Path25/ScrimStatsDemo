import { AlertTriangle } from "lucide-react";

import { DataSurface } from "@/components/workspace/DataSurface";
import type { TeamAnalyticsDataset } from "@/lib/analytics/team-analytics";

export function GameQualityBanner({ dataset }: { dataset: TeamAnalyticsDataset }) {
  const nonstandard = dataset.games.filter((game) => game.game_classification === "nonstandard_custom");
  const incomplete = dataset.games.filter((game) => game.game_classification === "incomplete_capture");
  if (!nonstandard.length && !incomplete.length) return null;

  return (
    <DataSurface className="border-amber-400/30 bg-amber-400/[0.04] p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
        <div>
          <h2 className="font-semibold text-amber-100">Game quality warning</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--workspace-muted)]">
            {nonstandard.length ? `${nonstandard.length} non-standard custom ${nonstandard.length === 1 ? "game is" : "games are"} included in raw analytics but excluded from the Measured Performance Index. ` : ""}
            {incomplete.length ? `${incomplete.length} incomplete ${incomplete.length === 1 ? "capture is" : "captures are"} shown only where the required evidence exists.` : ""}
          </p>
        </div>
      </div>
    </DataSurface>
  );
}
