import { Crown, Shield } from "lucide-react";

import { DataSurface } from "@/components/workspace/DataSurface";
import { SourceBadge } from "@/components/workspace/SourceBadge";
import { WorkspaceState } from "@/components/workspace/WorkspaceState";
import { useGameDrafts } from "@/hooks/useGameDrafts";
import type { DraftBan, DraftPick, ScrimGame, ScrimParticipant } from "@/types/scrimGame";

interface DraftViewProps {
  game: ScrimGame;
  participants: ScrimParticipant[];
}

function DraftColumn({
  title,
  picks,
  bans,
}: {
  title: string;
  picks: DraftPick[];
  bans: DraftBan[];
}) {
  return (
    <DataSurface>
      <div className="border-b border-[var(--workspace-rule)] px-5 py-4">
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="p-5">
        <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Picks</p>
        <div className="mt-3 divide-y divide-[var(--workspace-rule)]">
          {picks.map((pick) => (
            <div key={`${pick.team}-${pick.order}`} className="flex justify-between gap-4 py-3">
              <span className="font-medium">{pick.champion || "Unavailable"}</span>
              <span className="text-sm capitalize text-[var(--workspace-muted)]">
                {pick.role || `Pick ${pick.order}`}
              </span>
            </div>
          ))}
        </div>
        <p className="workspace-eyebrow mt-7 text-[var(--workspace-subtle)]">Bans</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {bans.length ? (
            bans.map((ban) => (
              <span
                key={`${ban.team}-${ban.order}`}
                className="border border-[var(--workspace-rule)] px-3 py-2 text-sm text-[var(--workspace-muted)]"
              >
                {ban.champion}
              </span>
            ))
          ) : (
            <span className="text-sm text-[var(--workspace-muted)]">No bans recorded</span>
          )}
        </div>
      </div>
    </DataSurface>
  );
}

export function DraftView({ game }: DraftViewProps) {
  const { draft, isLoading, error } = useGameDrafts(game.id);
  const savedPicks = draft?.draft_data?.picks || [];
  const savedBans = draft?.draft_data?.bans || [];
  const ourSide = draft?.our_team_side || game.side;

  if (isLoading) {
    return (
      <WorkspaceState
        icon={Crown}
        title="Loading draft evidence…"
        description="Checking the saved draft record for this game."
      />
    );
  }

  if (error) {
    return (
      <WorkspaceState
        icon={Shield}
        title="Draft evidence is unavailable."
        description="The game remains accessible, but its saved draft could not be loaded."
      />
    );
  }

  if (!draft || (!savedPicks.length && !savedBans.length)) {
    return (
      <WorkspaceState
        icon={Crown}
        title="No draft was captured for this game."
        description="ScrimStats will show the draft only when the collector or a team member has saved it."
      />
    );
  }

  const bluePicks = savedPicks.filter((pick) => pick.team === "blue");
  const redPicks = savedPicks.filter((pick) => pick.team === "red");
  const blueBans = savedBans.filter((ban) => ban.team === "blue");
  const redBans = savedBans.filter((ban) => ban.team === "red");

  return (
    <div className="space-y-5">
      <DataSurface className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Draft provenance</p>
          <p className="mt-2 text-sm text-[var(--workspace-muted)]">
            Our team played {ourSide ? `${ourSide} side` : "an unavailable side"}.
          </p>
        </div>
        <SourceBadge source={draft.draft_mode === "client" ? "collector" : "manual"} />
      </DataSurface>
      <div className="grid gap-5 xl:grid-cols-2">
        <DraftColumn title="Blue side" picks={bluePicks} bans={blueBans} />
        <DraftColumn title="Red side" picks={redPicks} bans={redBans} />
      </div>
    </div>
  );
}
