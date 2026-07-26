import {
  authenticatedUser,
  json,
  managerMembership,
  serviceClient,
} from "../_shared/collector.ts";

type LeagueEntry = {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
};
type Participant = {
  puuid: string;
  championId: number;
  championName: string;
  teamPosition?: string;
  individualPosition?: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  goldEarned: number;
  totalDamageDealtToChampions: number;
  visionScore: number;
};
type Match = {
  metadata: { matchId: string };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameVersion?: string;
    queueId: number;
    participants: Participant[];
  };
};

const platformToRegion: Record<string, string> = {
  br1: "americas", la1: "americas", la2: "americas", na1: "americas",
  eun1: "europe", euw1: "europe", tr1: "europe", ru: "europe",
  jp1: "asia", kr: "asia",
  oc1: "sea", ph2: "sea", sg2: "sea", th2: "sea", tw2: "sea", vn2: "sea",
};
function platform(value: string | null) {
  const normalized = (value || "").trim().toLowerCase();
  return ({ euw: "euw1", eune: "eun1", eune1: "eun1", na: "na1", oce: "oc1" } as Record<string, string>)[normalized] || normalized;
}
async function riot<T>(url: string, apiKey: string) {
  const response = await fetch(url, { headers: { "X-Riot-Token": apiKey } });
  if (!response.ok) {
    const error = new Error(`Riot API returned ${response.status}`);
    Object.assign(error, { status: response.status });
    throw error;
  }
  return await response.json() as T;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const user = await authenticatedUser(req);
  const { opponentPlayerId } = await req.json().catch(() => ({})) as { opponentPlayerId?: string };
  if (!user || !opponentPlayerId) return json({ error: "Authentication is required." }, 401);

  const admin = serviceClient();
  const { data: player } = await admin.from("opponent_players")
    .select("id,opponent_team_id,summoner_name,riot_id,region,is_active,opponent_teams!inner(tenant_id)")
    .eq("id", opponentPlayerId).maybeSingle();
  const team = Array.isArray(player?.opponent_teams)
    ? player?.opponent_teams[0]
    : player?.opponent_teams;
  const tenantId = team?.tenant_id;
  if (!player || !tenantId || !await managerMembership(user.id, tenantId)) {
    return json({ error: "Owner or admin access is required." }, 403);
  }

  const parsed = (player.riot_id || "").split("#");
  const gameName = parsed[0]?.trim();
  const tagLine = parsed[1]?.trim();
  const platformId = platform(player.region);
  const regional = platformToRegion[platformId];
  if (!gameName || !tagLine || !regional) {
    return json({ error: "The opponent requires Riot ID with tagline and a supported server." }, 400);
  }

  const { data: tenantKey } = await admin.rpc("get_tenant_riot_api_key", {
    p_tenant_id: tenantId,
  });
  const apiKey = tenantKey || Deno.env.get("RIOT_API_KEY");
  if (!apiKey) return json({ error: "This workspace has no Riot API connection." }, 503);

  const { data: claimed } = await admin.rpc("claim_opponent_soloq_sync", {
    p_opponent_player_id: player.id,
  });
  if (!claimed) return json({ cached: true });

  try {
    const account = await riot<{ puuid: string }>(
      `https://${regional}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      apiKey,
    );
    const entries = await riot<LeagueEntry[]>(
      `https://${platformId}.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(account.puuid)}`,
      apiKey,
    );
    const solo = entries.find((entry) => entry.queueType === "RANKED_SOLO_5x5");
    if (!solo) throw Object.assign(new Error("No current Solo/Duo rank is available."), { status: 404 });
    const ids = await riot<string[]>(
      `https://${regional}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(account.puuid)}/ids?queue=420&start=0&count=20`,
      apiKey,
    );
    const matches: Match[] = [];
    for (let index = 0; index < ids.length; index += 5) {
      matches.push(...await Promise.all(ids.slice(index, index + 5).map((id) =>
        riot<Match>(`https://${regional}.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(id)}`, apiKey)
      )));
    }
    const normalized = matches.flatMap((match) => {
      const subject = match.info.participants.find((entry) => entry.puuid === account.puuid);
      return subject ? [{
        tenant_id: tenantId,
        opponent_team_id: player.opponent_team_id,
        opponent_player_id: player.id,
        match_id: match.metadata.matchId,
        played_at: new Date(match.info.gameCreation).toISOString(),
        game_duration_seconds: match.info.gameDuration,
        queue_id: match.info.queueId,
        game_version: match.info.gameVersion || null,
        champion_id: subject.championId,
        champion_name: subject.championName,
        team_position: subject.teamPosition || subject.individualPosition || null,
        win: subject.win,
        kills: subject.kills,
        deaths: subject.deaths,
        assists: subject.assists,
        cs: subject.totalMinionsKilled + subject.neutralMinionsKilled,
        gold_earned: subject.goldEarned,
        damage_to_champions: subject.totalDamageDealtToChampions,
        vision_score: subject.visionScore,
        synced_at: new Date().toISOString(),
      }] : [];
    });
    const writes = await Promise.all([
      admin.from("opponent_soloq_daily_snapshots").upsert({
        tenant_id: tenantId,
        opponent_team_id: player.opponent_team_id,
        opponent_player_id: player.id,
        snapshot_date: new Date().toISOString().slice(0, 10),
        queue_type: solo.queueType,
        tier: solo.tier,
        division: solo.rank,
        league_points: solo.leaguePoints,
        wins: solo.wins,
        losses: solo.losses,
        captured_at: new Date().toISOString(),
      }, { onConflict: "opponent_player_id,snapshot_date,queue_type" }),
      normalized.length
        ? admin.from("opponent_soloq_recent_matches").upsert(normalized, {
            onConflict: "opponent_player_id,match_id",
          })
        : Promise.resolve({ error: null }),
      admin.from("opponent_soloq_sync_state").update({
        status: "ready",
        last_success_at: new Date().toISOString(),
        error_code: null,
        error_message: null,
        updated_at: new Date().toISOString(),
      }).eq("opponent_player_id", player.id),
    ]);
    const error = writes.find((write) => write.error)?.error;
    if (error) throw error;
    return json({ cached: false, matches: normalized.length });
  } catch (reason) {
    const status = Number((reason as { status?: number }).status || 0);
    await admin.from("opponent_soloq_sync_state").update({
      status: status === 429 ? "rate_limited" : status === 404 ? "unavailable" : "failed",
      error_code: status ? String(status) : "sync_failed",
      error_message: reason instanceof Error ? reason.message.slice(0, 240) : "Sync failed.",
      next_allowed_at: new Date(Date.now() + (status === 429 ? 60 : 15) * 60_000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("opponent_player_id", player.id);
    return json({
      error: reason instanceof Error ? reason.message : "Opponent Solo Queue sync failed.",
    }, status === 429 ? 429 : 400);
  }
});
