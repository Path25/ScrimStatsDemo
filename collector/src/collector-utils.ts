import type { LocalEvent, RosterIdentity } from './types';

export function dedupeEvents(events: LocalEvent[], seen = new Set<string>()) {
  return events.filter((event) => event.event_id && !seen.has(event.event_id));
}

export function riotIdMatches(candidate: string | undefined, rosterId: string | undefined) {
  if (!candidate || !rosterId) return false;
  return candidate.trim().toLocaleLowerCase() === rosterId.trim().toLocaleLowerCase();
}

export function toRiotId(player: Record<string, unknown>) {
  const name = typeof player.riotIdGameName === 'string' ? player.riotIdGameName : player.summonerName;
  const tag = typeof player.riotIdTagLine === 'string' ? player.riotIdTagLine : undefined;
  return typeof name === 'string' ? `${name}${tag ? `#${tag}` : ''}` : undefined;
}

export function resolveRosterTeam(
  players: Array<Record<string, unknown>>,
  roster: RosterIdentity[],
) {
  const rosterByIdentity = new Map(
    roster.map((player) => [
      `${player.riotId}#${player.tagLine}`.trim().toLocaleLowerCase(),
      player,
    ]),
  );
  const matched = players.map((player) => {
    const riotId = toRiotId(player);
    return {
      raw: player,
      riotId,
      roster: riotId ? rosterByIdentity.get(riotId.trim().toLocaleLowerCase()) : undefined,
    };
  });
  const orderMatches = matched.filter((player) => player.roster && player.raw.team === 'ORDER').length;
  const chaosMatches = matched.filter((player) => player.roster && player.raw.team === 'CHAOS').length;
  const team = orderMatches > 0 && chaosMatches === 0
    ? 'ORDER'
    : chaosMatches > 0 && orderMatches === 0
      ? 'CHAOS'
      : undefined;
  return {
    matched,
    team,
    status: team ? 'matched' : orderMatches || chaosMatches ? 'ambiguous' : 'unmatched',
  } as const;
}
