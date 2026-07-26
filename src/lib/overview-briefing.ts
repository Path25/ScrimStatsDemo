export type OverviewGame = {
  id: string;
  result: string | null;
  scrim_id: string;
  status: string;
};

export type OverviewScrim = {
  ends_at: string | null;
  format: string | null;
  id: string;
  notes: string | null;
  opponent_name: string;
  opponent_score: number | null;
  our_score: number | null;
  result: string | null;
  starts_at: string;
  status: string | null;
};

export type OverviewCalendarEvent = {
  end_time: string | null;
  event_type: string;
  id: string;
  location: string | null;
  scrim_id: string | null;
  start_time: string;
  title: string;
};

export type OverviewAgendaItem = {
  detail: string | null;
  endTime: string | null;
  href: string;
  id: string;
  startsAt: string;
  title: string;
  type: string;
};

export type OverviewHistoryBlock = OverviewScrim & {
  gameRecord: { wins: number; losses: number };
};

const inactiveStatuses = new Set(["cancelled", "completed"]);

function normalized(value: string | null | undefined) {
  return value?.trim().toLowerCase() || "";
}

function explicitGameRecord(games: OverviewGame[]) {
  return games.reduce(
    (record, game) => {
      if (normalized(game.status) !== "completed") return record;
      const result = normalized(game.result);
      if (result === "win") record.wins += 1;
      if (result === "loss") record.losses += 1;
      return record;
    },
    { wins: 0, losses: 0 },
  );
}

function scrimHref(scrim: OverviewScrim) {
  const query = new URLSearchParams({
    opponent: scrim.opponent_name,
    date: scrim.starts_at.slice(0, 10),
    format: scrim.format || "",
    result: scrim.result || "",
  });
  return `/scrims/${scrim.id}?${query.toString()}`;
}

export function buildOverviewBriefing({
  events,
  games,
  now,
  scrims,
}: {
  events: OverviewCalendarEvent[];
  games: OverviewGame[];
  now: Date;
  scrims: OverviewScrim[];
}) {
  const nowMs = now.getTime();
  const thirtyDaysAgo = nowMs - 30 * 86_400_000;
  const sevenDaysFromNow = nowMs + 7 * 86_400_000;
  const gamesByScrim = new Map<string, OverviewGame[]>();

  for (const game of games) {
    const current = gamesByScrim.get(game.scrim_id) || [];
    current.push(game);
    gamesByScrim.set(game.scrim_id, current);
  }

  const futureScrims = scrims
    .filter((scrim) => {
      const startsAt = new Date(scrim.starts_at).getTime();
      return startsAt >= nowMs && !inactiveStatuses.has(normalized(scrim.status));
    })
    .sort((left, right) => left.starts_at.localeCompare(right.starts_at));

  const nextBlock = futureScrims[0] || null;
  const upcomingAgenda: OverviewAgendaItem[] = [
    ...futureScrims.slice(1).map((scrim) => ({
      detail: scrim.format,
      endTime: scrim.ends_at,
      href: scrimHref(scrim),
      id: `scrim-${scrim.id}`,
      startsAt: scrim.starts_at,
      title: `Scrim vs ${scrim.opponent_name}`,
      type: "scrim",
    })),
    ...events
      .filter(
        (event) =>
          !event.scrim_id && new Date(event.start_time).getTime() >= nowMs,
      )
      .map((event) => ({
        detail: event.location,
        endTime: event.end_time,
        href: "/calendar",
        id: `event-${event.id}`,
        startsAt: event.start_time,
        title: event.title,
        type: event.event_type,
      })),
  ]
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt))
    .slice(0, 3);

  const completed = scrims
    .filter((scrim) => {
      const startsAt = new Date(scrim.starts_at).getTime();
      return (
        startsAt <= nowMs &&
        (normalized(scrim.status) === "completed" || Boolean(scrim.result?.trim()))
      );
    })
    .sort((left, right) => right.starts_at.localeCompare(left.starts_at));

  const recentBlocks: OverviewHistoryBlock[] = completed.slice(0, 5).map((scrim) => ({
    ...scrim,
    gameRecord: explicitGameRecord(gamesByScrim.get(scrim.id) || []),
  }));

  const recentGames = games.filter((game) => {
    const parent = scrims.find((scrim) => scrim.id === game.scrim_id);
    if (!parent) return false;
    const startsAt = new Date(parent.starts_at).getTime();
    return startsAt >= thirtyDaysAgo && startsAt <= nowMs;
  });

  const scheduledEventsNext7Days =
    futureScrims.filter((scrim) => new Date(scrim.starts_at).getTime() <= sevenDaysFromNow).length +
    events.filter((event) => {
      const startsAt = new Date(event.start_time).getTime();
      return !event.scrim_id && startsAt >= nowMs && startsAt <= sevenDaysFromNow;
    }).length;

  return {
    completedBlocksLast30Days: completed.filter((scrim) => {
      const startsAt = new Date(scrim.starts_at).getTime();
      return startsAt >= thirtyDaysAgo && startsAt <= nowMs;
    }).length,
    nextBlock,
    recentBlocks,
    recentGameRecord: explicitGameRecord(recentGames),
    scheduledEventsNext7Days,
    upcomingAgenda,
  };
}
