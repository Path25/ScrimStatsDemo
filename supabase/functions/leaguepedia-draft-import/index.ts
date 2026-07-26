import {
  authenticatedUser,
  json,
  managerMembership,
  serviceClient,
} from "../_shared/collector.ts";

const LEAGUEPEDIA_API = "https://lol.fandom.com/api.php";
const USER_AGENT = "ScrimStats/1.0 (https://scrimstats.gg; contact@scrimstats.gg)";
const MAX_GAMES = 30;

type CargoRow = Record<string, string | number | null>;
type CargoResponse = {
  cargoquery?: Array<{ title?: CargoRow }>;
  error?: { code?: string; info?: string };
};
type RevisionResponse = {
  query?: { pages?: Array<{ title?: string; revisions?: Array<{ revid?: number }> }> };
};

function cleanName(value: unknown) {
  if (typeof value !== "string") return "";
  return [...value.trim()]
    .filter((character) => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127)
    .join("")
    .slice(0, 160);
}

function cargoString(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function compactList(row: CargoRow, prefix: string, count = 5) {
  return Array.from({ length: count }, (_, index) => cleanName(row[`${prefix}${index + 1}`]))
    .filter(Boolean);
}

function asIso(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value.endsWith("Z") || /[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function providerPageUrl(page: string) {
  return `https://lol.fandom.com/wiki/${encodeURIComponent(page.replaceAll(" ", "_"))}`;
}

async function fetchJson<T>(url: URL) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
  });
  if (!response.ok) {
    const error = new Error(`Leaguepedia returned ${response.status}`);
    Object.assign(error, { status: response.status });
    throw error;
  }
  return await response.json() as T;
}

async function loadRevisions(pages: string[]) {
  const revisions = new Map<string, string>();
  if (!pages.length) return revisions;
  const url = new URL(LEAGUEPEDIA_API);
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    prop: "revisions",
    rvprop: "ids",
    titles: pages.slice(0, 50).join("|"),
  }).toString();
  try {
    const payload = await fetchJson<RevisionResponse>(url);
    for (const page of payload.query?.pages || []) {
      const revision = page.revisions?.[0]?.revid;
      if (page.title && revision) revisions.set(page.title, String(revision));
    }
  } catch {
    // Revision attribution is best effort. The provider page and fetch time are
    // still retained if Fandom's revision endpoint is temporarily unavailable.
  }
  return revisions;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const user = await authenticatedUser(req);
  const input = await req.json().catch(() => ({})) as {
    opponentTeamId?: string;
    leaguepediaName?: string;
  };
  if (!user || !input.opponentTeamId) {
    return json({ error: "Authentication is required." }, 401);
  }

  const admin = serviceClient();
  const { data: team, error: teamError } = await admin
    .from("opponent_teams")
    .select("id,tenant_id,name,leaguepedia_name,leaguepedia_last_synced_at")
    .eq("id", input.opponentTeamId)
    .maybeSingle();
  if (teamError || !team || !await managerMembership(user.id, team.tenant_id)) {
    return json({ error: "Owner or admin access is required." }, 403);
  }

  const requestedName = cleanName(input.leaguepediaName);
  const leaguepediaName = requestedName || cleanName(team.leaguepedia_name);
  if (!leaguepediaName) {
    return json({ error: "Add the team's exact Leaguepedia name before importing." }, 400);
  }

  if (requestedName && requestedName !== team.leaguepedia_name) {
    const { error } = await admin.from("opponent_teams").update({
      leaguepedia_name: requestedName,
      updated_at: new Date().toISOString(),
    }).eq("id", team.id).eq("tenant_id", team.tenant_id);
    if (error) return json({ error: "The Leaguepedia team name could not be saved." }, 400);
  }

  const { data: claim, error: claimError } = await admin.rpc("claim_leaguepedia_draft_sync", {
    p_opponent_team_id: team.id,
    p_cooldown_minutes: 30,
  });
  if (claimError) return json({ error: "Draft import could not be started." }, 400);
  if (!claim?.claimed) {
    return json({
      cached: true,
      reason: claim?.reason || "cooldown",
      retryAt: claim?.retry_at || null,
      lastSyncedAt: claim?.last_synced_at || team.leaguepedia_last_synced_at,
    });
  }

  try {
    const cargo = new URL(LEAGUEPEDIA_API);
    cargo.search = new URLSearchParams({
      action: "cargoquery",
      format: "json",
      formatversion: "2",
      limit: String(MAX_GAMES),
      tables: "PicksAndBansS7=PB,MatchSchedule=MS,Tournaments=T",
      join_on: "PB.MatchId=MS.MatchId,PB.OverviewPage=T.OverviewPage",
      fields: [
        "PB.GameId=GameId", "PB.MatchId=MatchId", "PB.Team1=Team1", "PB.Team2=Team2",
        "PB.Winner=Winner", "PB.OverviewPage=OverviewPage", "PB._pageName=SourcePage",
        "MS.Patch=Patch", "MS.DateTime_UTC=Date", "T.Name=Tournament",
        ...Array.from({ length: 5 }, (_, index) => `PB.Team1Pick${index + 1}=Team1Pick${index + 1}`),
        ...Array.from({ length: 5 }, (_, index) => `PB.Team2Pick${index + 1}=Team2Pick${index + 1}`),
        ...Array.from({ length: 5 }, (_, index) => `PB.Team1Ban${index + 1}=Team1Ban${index + 1}`),
        ...Array.from({ length: 5 }, (_, index) => `PB.Team2Ban${index + 1}=Team2Ban${index + 1}`),
      ].join(","),
      where: `(PB.Team1="${cargoString(leaguepediaName)}" OR PB.Team2="${cargoString(leaguepediaName)}") AND PB.IsComplete="1"`,
      order_by: "MS.DateTime_UTC DESC",
    }).toString();

    const payload = await fetchJson<CargoResponse>(cargo);
    if (payload.error) {
      const error = new Error(payload.error.info || payload.error.code || "Leaguepedia query failed.");
      Object.assign(error, { status: payload.error.code === "ratelimited" ? 429 : 502 });
      throw error;
    }

    const rows = (payload.cargoquery || []).map((entry) => entry.title || {});
    const pages = [...new Set(rows.map((row) => cleanName(row.SourcePage)).filter(Boolean))];
    const revisions = await loadRevisions(pages);
    const fetchedAt = new Date().toISOString();
    const normalized = rows.flatMap((row) => {
      const providerGameId = cleanName(row.GameId);
      const sourcePage = cleanName(row.SourcePage) || cleanName(row.OverviewPage);
      const blueTeam = cleanName(row.Team1);
      const redTeam = cleanName(row.Team2);
      if (!providerGameId || !sourcePage || !blueTeam || !redTeam) return [];
      const winner = Number(row.Winner);
      return [{
        tenant_id: team.tenant_id,
        opponent_team_id: team.id,
        provider: "leaguepedia",
        provider_game_id: providerGameId,
        provider_match_id: cleanName(row.MatchId) || null,
        provider_tournament: cleanName(row.Tournament) || cleanName(row.OverviewPage) || null,
        provider_page: sourcePage,
        source_url: providerPageUrl(sourcePage),
        source_revision: revisions.get(sourcePage) || null,
        fetched_at: fetchedAt,
        played_at: asIso(row.Date),
        patch: cleanName(row.Patch) || null,
        blue_team: blueTeam,
        red_team: redTeam,
        winner_side: winner === 1 ? "blue" : winner === 2 ? "red" : null,
        blue_picks: compactList(row, "Team1Pick"),
        red_picks: compactList(row, "Team2Pick"),
        blue_bans: compactList(row, "Team1Ban"),
        red_bans: compactList(row, "Team2Ban"),
        raw_source: row,
        updated_at: fetchedAt,
      }];
    });

    if (normalized.length) {
      const { error } = await admin.from("opponent_external_draft_games").upsert(normalized, {
        onConflict: "tenant_id,provider,provider_game_id",
      });
      if (error) throw error;
    }
    await admin.rpc("finish_leaguepedia_draft_sync", {
      p_opponent_team_id: team.id,
      p_error: null,
    });
    return json({
      cached: false,
      imported: normalized.length,
      attribution: "Leaguepedia / League of Legends Esports Wiki (CC BY-SA 3.0)",
      providerUrl: providerPageUrl(leaguepediaName),
    });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Leaguepedia import failed.";
    await admin.rpc("finish_leaguepedia_draft_sync", {
      p_opponent_team_id: team.id,
      p_error: message,
    });
    const status = Number((reason as { status?: number }).status || 0);
    return json({ error: message }, status === 429 ? 429 : 502);
  }
});
