import type { Json } from "@/integrations/supabase/types";

type ScenarioAction = {
  action_type: string;
  champion_name: string;
  team_side: string;
};

export type ExternalDraftGame = {
  blue_team: string;
  red_team: string;
  blue_picks: Json;
  red_picks: Json;
  blue_bans: Json;
  red_bans: Json;
};

function names(value: Json) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];
}

function normalized(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function compareOpponentDraft(
  actions: ScenarioAction[],
  game: ExternalDraftGame,
  opponentName: string,
) {
  const opponentIsBlue = normalized(game.blue_team) === normalized(opponentName);
  const opponentIsRed = normalized(game.red_team) === normalized(opponentName);
  if (!opponentIsBlue && !opponentIsRed) return null;

  const actualPicks = names(opponentIsBlue ? game.blue_picks : game.red_picks);
  const actualBans = names(opponentIsBlue ? game.blue_bans : game.red_bans);
  const plannedPicks = actions
    .filter((action) => action.team_side === "opponent" && action.action_type === "pick")
    .map((action) => action.champion_name);
  const plannedBans = actions
    .filter((action) => action.team_side === "opponent" && action.action_type === "ban")
    .map((action) => action.champion_name);

  const intersect = (planned: string[], actual: string[]) => planned.filter((name) =>
    actual.some((candidate) => normalized(candidate) === normalized(name))
  );
  const absent = (planned: string[], actual: string[]) => planned.filter((name) =>
    !actual.some((candidate) => normalized(candidate) === normalized(name))
  );
  const additional = (actual: string[], planned: string[]) => actual.filter((name) =>
    !planned.some((candidate) => normalized(candidate) === normalized(name))
  );

  return {
    side: opponentIsBlue ? "blue" : "red",
    picks: {
      observedFromPlan: intersect(plannedPicks, actualPicks),
      plannedNotObserved: absent(plannedPicks, actualPicks),
      observedBeyondPlan: additional(actualPicks, plannedPicks),
    },
    bans: {
      observedFromPlan: intersect(plannedBans, actualBans),
      plannedNotObserved: absent(plannedBans, actualBans),
      observedBeyondPlan: additional(actualBans, plannedBans),
    },
  };
}
