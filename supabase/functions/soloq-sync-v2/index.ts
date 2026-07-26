import { authenticatedUser, json, managerMembership, serviceClient } from '../_shared/collector.ts';

type SyncMode = 'coordinate' | 'work' | 'manual';

interface SyncRequest {
  mode?: SyncMode;
  playerId?: string;
}

interface SyncJob {
  id: string;
  run_id: string;
  tenant_id: string;
  player_id: string;
  attempts: number;
}

interface RiotLeagueEntry {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

interface RiotObjective { first?: boolean; kills?: number }
interface RiotTeam {
  teamId: number;
  win: boolean;
  bans?: Array<{ championId: number; pickTurn: number }>;
  objectives?: Record<string, RiotObjective>;
}

interface RiotParticipant {
  puuid: string;
  summonerName?: string;
  riotIdGameName?: string;
  riotIdTagline?: string;
  teamId: number;
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
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
}

interface RiotMatch {
  metadata: { matchId: string };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameVersion?: string;
    queueId: number;
    participants: RiotParticipant[];
    teams?: RiotTeam[];
  };
}

class RiotError extends Error {
  constructor(public status: number, public retryAfterSeconds: number | null) {
    super(`Riot API returned ${status}`);
  }
}

const platformToRegion: Record<string, string> = {
  br1: 'americas', la1: 'americas', la2: 'americas', na1: 'americas',
  eun1: 'europe', euw1: 'europe', tr1: 'europe', ru: 'europe',
  jp1: 'asia', kr: 'asia',
  oc1: 'sea', ph2: 'sea', sg2: 'sea', th2: 'sea', tw2: 'sea', vn2: 'sea',
};

function normalizePlatform(value: string | null) {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'eune' || normalized === 'eune1') return 'eun1';
  if (normalized === 'euw') return 'euw1';
  if (normalized === 'na') return 'na1';
  if (normalized === 'oce') return 'oc1';
  return normalized;
}

function parseRetryAfter(value: string | null) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(1, Math.ceil(seconds));
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(1, Math.ceil((date - Date.now()) / 1000));
}

async function riotFetch<T>(url: string, apiKey: string): Promise<T> {
  const response = await fetch(url, { headers: { 'X-Riot-Token': apiKey } });
  if (!response.ok) {
    throw new RiotError(response.status, parseRetryAfter(response.headers.get('Retry-After')));
  }
  return await response.json() as T;
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function dateInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function normalizedContext(match: RiotMatch) {
  return {
    participants: match.info.participants.map((participant) => ({
      puuid: participant.puuid,
      riotName: participant.riotIdGameName || participant.summonerName || 'Unknown player',
      riotTag: participant.riotIdTagline || null,
      teamId: participant.teamId,
      championId: participant.championId,
      championName: participant.championName,
      role: participant.teamPosition || participant.individualPosition || null,
      win: Boolean(participant.win),
      kills: Math.max(0, participant.kills || 0),
      deaths: Math.max(0, participant.deaths || 0),
      assists: Math.max(0, participant.assists || 0),
      cs: Math.max(0, (participant.totalMinionsKilled || 0) + (participant.neutralMinionsKilled || 0)),
      gold: Math.max(0, participant.goldEarned || 0),
      damage: Math.max(0, participant.totalDamageDealtToChampions || 0),
      vision: Math.max(0, participant.visionScore || 0),
      items: [
        participant.item0, participant.item1, participant.item2, participant.item3,
        participant.item4, participant.item5, participant.item6,
      ].filter((item) => Number.isInteger(item) && item > 0),
    })),
    teams: (match.info.teams || []).map((team) => ({
      teamId: team.teamId,
      win: Boolean(team.win),
      bans: (team.bans || [])
        .filter((ban) => Number.isInteger(ban.championId) && ban.championId > 0)
        .map((ban) => ({ championId: ban.championId, pickTurn: ban.pickTurn })),
      objectives: Object.fromEntries(Object.entries(team.objectives || {}).map(([key, objective]) => [
        key,
        { first: Boolean(objective?.first), kills: Math.max(0, objective?.kills || 0) },
      ])),
    })),
  };
}

async function setSyncState(job: SyncJob, values: Record<string, unknown>) {
  const admin = serviceClient();
  await admin.from('soloq_sync_state').upsert({
    tenant_id: job.tenant_id,
    player_id: job.player_id,
    updated_at: new Date().toISOString(),
    ...values,
  }, { onConflict: 'player_id' });
}

async function finishJob(
  job: SyncJob,
  status: 'pending' | 'succeeded' | 'skipped' | 'rate_limited' | 'failed',
  errorCode: string | null = null,
  errorMessage: string | null = null,
  availableAt: string | null = null,
) {
  const admin = serviceClient();
  await admin.from('soloq_sync_jobs').update({
    status,
    attempts: status === 'rate_limited' ? Math.max(0, job.attempts - 1) : job.attempts,
    available_at: availableAt || new Date().toISOString(),
    locked_at: null,
    locked_by: null,
    last_error_code: errorCode,
    last_error_message: errorMessage?.slice(0, 240) || null,
    completed_at: ['succeeded', 'skipped', 'failed'].includes(status) ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq('id', job.id);
  await admin.rpc('refresh_soloq_run_progress', { p_run_id: job.run_id });
}

async function syncJob(job: SyncJob) {
  const admin = serviceClient();
  const { data: player } = await admin.from('players')
    .select('id, tenant_id, summoner_name, riot_id, riot_tag_line, region, puuid, archived_at, is_active')
    .eq('id', job.player_id).eq('tenant_id', job.tenant_id).maybeSingle();

  if (!player || player.archived_at || player.is_active === false) {
    await setSyncState(job, { status: 'unavailable', error_code: 'roster_inactive', error_message: 'Player is no longer active.' });
    await finishJob(job, 'skipped', 'roster_inactive', 'Player is no longer active.');
    return { playerId: job.player_id, status: 'skipped' };
  }

  const platform = normalizePlatform(player.region);
  const regional = platformToRegion[platform];
  const riotName = (player.riot_id || player.summoner_name || '').split('#')[0]?.trim();
  const riotTag = (player.riot_id?.split('#')[1] || player.riot_tag_line || '').replace(/^#/, '').trim();
  if (!platform || !regional || !riotName || !riotTag) {
    const message = 'Player requires a Riot ID, tagline, and supported server.';
    await setSyncState(job, { status: 'invalid_identity', error_code: 'invalid_identity', error_message: message });
    await finishJob(job, 'skipped', 'invalid_identity', message);
    return { playerId: job.player_id, status: 'invalid_identity' };
  }

  const { data: apiKey } = await admin.rpc('get_tenant_riot_api_key', { p_tenant_id: player.tenant_id });
  if (!apiKey) {
    const message = 'This workspace has not configured a valid Riot API credential.';
    await setSyncState(job, { status: 'failed', error_code: 'missing_workspace_key', error_message: message });
    await finishJob(job, 'failed', 'missing_workspace_key', message);
    return { playerId: job.player_id, status: 'missing_workspace_key' };
  }

  await setSyncState(job, {
    status: 'syncing', last_attempt_at: new Date().toISOString(),
    error_code: null, error_message: null,
  });

  try {
    const { data: tenant } = await admin.from('tenants').select('settings')
      .eq('id', player.tenant_id).maybeSingle();
    const configuredTimezone = typeof tenant?.settings === 'object' && tenant.settings
      ? String((tenant.settings as Record<string, unknown>).timezone || 'UTC')
      : 'UTC';
    let workspaceTimezone = configuredTimezone;
    try {
      new Intl.DateTimeFormat('en', { timeZone: workspaceTimezone }).format();
    } catch {
      workspaceTimezone = 'UTC';
    }
    let puuid = player.puuid;
    if (!puuid) {
      const account = await riotFetch<{ puuid: string }>(
        `https://${regional}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(riotName)}/${encodeURIComponent(riotTag)}`,
        apiKey,
      );
      puuid = account.puuid;
    }

    const leagueEntries = await riotFetch<RiotLeagueEntry[]>(
      `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`,
      apiKey,
    );
    const solo = leagueEntries.find((entry) => entry.queueType === 'RANKED_SOLO_5x5');
    const matchIds = await riotFetch<string[]>(
      `https://${regional}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?queue=420&start=0&count=20`,
      apiKey,
    );

    const { data: cachedRows } = matchIds.length
      ? await admin.from('soloq_recent_matches').select('match_id, match_context')
          .eq('tenant_id', player.tenant_id).eq('player_id', player.id).in('match_id', matchIds)
      : { data: [] };
    const cached = new Set((cachedRows || []).flatMap((row) => {
      const context = row.match_context as { participants?: unknown[] } | null;
      return context?.participants?.length ? [row.match_id] : [];
    }));
    const uncachedIds = matchIds.filter((matchId) => !cached.has(matchId));
    const matches: RiotMatch[] = [];
    for (const matchId of uncachedIds) {
      matches.push(await riotFetch<RiotMatch>(
        `https://${regional}.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(matchId)}`,
        apiKey,
      ));
    }

    const normalizedMatches = matches.flatMap((match) => {
      const participant = match.info.participants.find((entry) => entry.puuid === puuid);
      if (!participant) return [];
      return [{
        tenant_id: player.tenant_id,
        player_id: player.id,
        match_id: match.metadata.matchId,
        played_at: new Date(match.info.gameCreation).toISOString(),
        game_duration_seconds: Math.max(1, match.info.gameDuration),
        queue_id: match.info.queueId,
        game_version: match.info.gameVersion || null,
        champion_id: participant.championId,
        champion_name: participant.championName,
        team_position: participant.teamPosition || participant.individualPosition || null,
        win: participant.win,
        kills: Math.max(0, participant.kills),
        deaths: Math.max(0, participant.deaths),
        assists: Math.max(0, participant.assists),
        cs: Math.max(0, participant.totalMinionsKilled + participant.neutralMinionsKilled),
        gold_earned: Math.max(0, participant.goldEarned),
        damage_to_champions: Math.max(0, participant.totalDamageDealtToChampions),
        vision_score: Math.max(0, participant.visionScore),
        items: [
          participant.item0, participant.item1, participant.item2, participant.item3,
          participant.item4, participant.item5, participant.item6,
        ].filter((item) => item > 0),
        match_context: normalizedContext(match),
        synced_at: new Date().toISOString(),
      }];
    });

    if (normalizedMatches.length) {
      const { error } = await admin.from('soloq_recent_matches').upsert(normalizedMatches, {
        onConflict: 'player_id,match_id',
      });
      if (error) throw error;
    }

    const now = new Date().toISOString();
    if (solo) {
      const { error } = await admin.from('soloq_daily_snapshots').upsert({
        tenant_id: player.tenant_id,
        player_id: player.id,
        snapshot_date: dateInTimezone(new Date(), workspaceTimezone),
        queue_type: solo.queueType,
        tier: solo.tier,
        division: solo.rank,
        league_points: solo.leaguePoints,
        wins: solo.wins,
        losses: solo.losses,
        captured_at: now,
      }, { onConflict: 'player_id,snapshot_date,queue_type' });
      if (error) throw error;
    }

    const rankLabel = !solo ? null : ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(solo.tier)
      ? solo.tier
      : `${solo.tier} ${solo.rank}`;
    const writes = await Promise.all([
      admin.from('players').update({
        puuid, rank: rankLabel, lp: solo?.leaguePoints ?? null,
        last_soloq_sync: now, updated_at: now,
      }).eq('id', player.id).eq('tenant_id', player.tenant_id),
      admin.from('tenant_riot_integrations').update({
        status: 'active', last_success_at: now, last_error_code: null,
        last_error_message: null, updated_at: now,
      }).eq('tenant_id', player.tenant_id),
    ]);
    const writeError = writes.find((result) => result.error)?.error;
    if (writeError) throw writeError;

    await setSyncState(job, {
      status: solo ? 'ready' : 'unranked',
      last_success_at: now,
      next_allowed_at: new Date(Date.now() + 15 * 60_000).toISOString(),
      error_code: solo ? null : 'unranked',
      error_message: solo ? null : 'No current ranked Solo/Duo entry is available.',
    });
    await finishJob(job, 'succeeded');
    return { playerId: player.id, status: solo ? 'ready' : 'unranked', fetchedMatches: normalizedMatches.length };
  } catch (reason) {
    const riot = reason instanceof RiotError ? reason : null;
    const status = riot?.status || 0;
    const message = reason instanceof Error ? reason.message : 'Solo Queue synchronization failed.';

    if (status === 404) {
      await setSyncState(job, { status: 'invalid_identity', error_code: '404', error_message: message });
      await finishJob(job, 'skipped', '404', message);
      return { playerId: player.id, status: 'invalid_identity' };
    }

    if (status === 401 || status === 403) {
      const { data: pausedJobs } = await admin.from('soloq_sync_jobs').select('run_id')
        .eq('tenant_id', player.tenant_id).in('status', ['pending', 'rate_limited']);
      await admin.from('tenant_riot_integrations').update({
        status: 'invalid', last_tested_at: new Date().toISOString(),
        last_error_code: String(status), last_error_message: message.slice(0, 240),
        updated_at: new Date().toISOString(),
      }).eq('tenant_id', player.tenant_id);
      await admin.from('soloq_sync_jobs').update({
        status: 'failed', completed_at: new Date().toISOString(),
        last_error_code: String(status), last_error_message: 'Workspace Riot credential is invalid.',
        updated_at: new Date().toISOString(),
      }).eq('tenant_id', player.tenant_id).in('status', ['pending', 'rate_limited']);
      await setSyncState(job, { status: 'failed', error_code: String(status), error_message: 'Workspace Riot credential is invalid.' });
      await finishJob(job, 'failed', String(status), message);
      for (const runId of new Set((pausedJobs || []).map((pausedJob) => pausedJob.run_id))) {
        if (runId !== job.run_id) await admin.rpc('refresh_soloq_run_progress', { p_run_id: runId });
      }
      return { playerId: player.id, status: 'credential_invalid' };
    }

    if (status === 429) {
      const retrySeconds = Math.min(Math.max(riot?.retryAfterSeconds || 60, 5), 3600);
      const availableAt = new Date(Date.now() + retrySeconds * 1000).toISOString();
      await admin.from('tenant_riot_integrations').update({
        status: 'rate_limited', last_tested_at: new Date().toISOString(),
        last_error_code: '429', last_error_message: `Riot requested a ${retrySeconds}s pause.`,
        updated_at: new Date().toISOString(),
      }).eq('tenant_id', player.tenant_id);
      await admin.from('soloq_sync_jobs').update({ available_at: availableAt, updated_at: new Date().toISOString() })
        .eq('tenant_id', player.tenant_id).in('status', ['pending', 'rate_limited']);
      await setSyncState(job, { status: 'rate_limited', error_code: '429', error_message: message, next_allowed_at: availableAt });
      await finishJob(job, 'rate_limited', '429', message, availableAt);
      return { playerId: player.id, status: 'rate_limited', retryAt: availableAt };
    }

    const retryable = status >= 500 || status === 0;
    if (retryable && job.attempts < 3) {
      const availableAt = new Date(Date.now() + Math.pow(2, job.attempts) * 60_000).toISOString();
      await setSyncState(job, { status: 'queued', error_code: status ? String(status) : 'transient', error_message: message, next_allowed_at: availableAt });
      await finishJob(job, 'pending', status ? String(status) : 'transient', message, availableAt);
      return { playerId: player.id, status: 'retrying', retryAt: availableAt };
    }

    await setSyncState(job, { status: 'failed', error_code: status ? String(status) : 'sync_failed', error_message: message });
    await finishJob(job, 'failed', status ? String(status) : 'sync_failed', message);
    return { playerId: player.id, status: 'failed' };
  }
}

async function authorizedWorker(req: Request) {
  const secret = req.headers.get('x-soloq-worker-secret');
  if (!secret) return false;
  const { data } = await serviceClient().rpc('verify_soloq_worker_secret', { p_secret: secret });
  return data === true;
}

async function processAvailableJobs(limit = 2) {
  const admin = serviceClient();
  const workerId = `edge-${crypto.randomUUID()}`;
  const { data: jobs, error } = await admin.rpc('claim_soloq_sync_jobs', {
    p_worker_id: workerId,
    p_limit: limit,
  });
  if (error) throw error;
  const results = [];
  for (let index = 0; index < (jobs || []).length; index += 1) {
    if (index > 0) await sleep(2_000);
    results.push(await syncJob(jobs[index] as SyncJob));
  }
  return results;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({ ok: true });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const input = await req.json().catch(() => ({})) as SyncRequest;
  const mode = input.mode || (input.playerId ? 'manual' : null);
  if (!mode) return json({ error: 'A synchronization mode is required.' }, 400);

  try {
    if (mode === 'coordinate' || mode === 'work') {
      if (!await authorizedWorker(req)) return json({ error: 'Unauthorized' }, 401);
      if (mode === 'coordinate') {
        const { data, error } = await serviceClient().rpc('coordinate_soloq_daily_runs');
        if (error) throw error;
        return json({ createdRuns: data || 0 });
      }
      return json({ results: await processAvailableJobs(2) });
    }

    const user = await authenticatedUser(req);
    if (!user || !input.playerId) return json({ error: 'Authentication is required.' }, 401);
    const admin = serviceClient();
    const { data: player } = await admin.from('players')
      .select('id, tenant_id').eq('id', input.playerId).is('archived_at', null).maybeSingle();
    if (!player || !await managerMembership(user.id, player.tenant_id)) {
      return json({ error: 'Owner or admin access is required.' }, 403);
    }

    const { data: integration } = await admin.from('tenant_riot_integrations')
      .select('status').eq('tenant_id', player.tenant_id).maybeSingle();
    if (!integration || integration.status === 'invalid') {
      return json({ error: 'Configure a valid workspace Riot API key in Integrations first.' }, 409);
    }

    const { data: run, error: runError } = await admin.from('soloq_sync_runs').insert({
      tenant_id: player.tenant_id,
      run_kind: 'manual',
      timezone: 'UTC',
      requested_by: user.id,
      total_jobs: 1,
    }).select('id').single();
    if (runError) throw runError;
    const { error: jobError } = await admin.from('soloq_sync_jobs').insert({
      run_id: run.id,
      tenant_id: player.tenant_id,
      player_id: player.id,
      priority: 100,
    });
    if (jobError) throw jobError;
    await setSyncState({ id: '', run_id: run.id, tenant_id: player.tenant_id, player_id: player.id, attempts: 0 }, {
      status: 'queued', error_code: null, error_message: null,
    });

    const results = await processAvailableJobs(1);
    return json({ queued: true, runId: run.id, results }, results.length ? 200 : 202);
  } catch (reason) {
    console.error('soloq-sync-v2', reason);
    return json({ error: reason instanceof Error ? reason.message : 'Solo Queue synchronization failed.' }, 500);
  }
});
