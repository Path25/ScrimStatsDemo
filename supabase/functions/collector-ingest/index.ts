import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { collectorCorsHeaders, deviceFromRequest, eligibleCollectorScrims, json, serviceClient } from '../_shared/collector.ts';

type Participant = { riot_id?: string; riot_tag_line?: string; region?: string; summoner_name?: string; champion_name?: string; role?: string; is_our_team?: boolean; player_id?: string; identity_status?: string; kills?: number; deaths?: number; assists?: number; cs?: number; gold?: number; level?: number; damage_dealt?: number; damage_taken?: number; vision_score?: number; items?: unknown; runes?: unknown; summoner_spells?: unknown; is_bot?: boolean; advanced_stats?: unknown };
type CaptureQuality = { classification?: 'standard_5v5' | 'nonstandard_custom' | 'incomplete_capture'; flags?: string[]; roster_coverage?: number; our_participants?: number; enemy_participants?: number; bots_present?: boolean };
type FinalSnapshot = { local_game_id: string; schema_version: number; identity_resolution_status?: string; started_at?: string; ended_at?: string; duration_seconds?: number; result?: 'win' | 'loss' | 'draw'; side?: 'blue' | 'red'; our_team_kills?: number; enemy_team_kills?: number; our_team_gold?: number; enemy_team_gold?: number; objectives?: unknown; draft?: unknown; champion_select?: unknown; post_game?: unknown; capture_features?: { champion_select?: boolean; post_game?: boolean }; capture_quality?: CaptureQuality; game_context?: { mode?: string; map_name?: string; map_number?: number; map_terrain?: string; patch?: string }; participants?: Participant[]; timeline?: unknown[] };

function number(value: unknown) { return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null; }

const sensitiveKey = /(?:jwt|token|password|credential|secret|mucjwtdto|chatdetails)/i;

export function sanitizeProviderValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeProviderValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !sensitiveKey.test(key))
    .map(([key, nested]) => [key, sanitizeProviderValue(nested)]));
}

function safeEvent(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const event = value as Record<string, unknown>;
  if (typeof event.event_id !== 'string') return null;
  const allowed = ['event_id', 'sequence', 'occurred_at', 'event_type', 'occurred_seconds', 'team', 'actor_name', 'victim_name', 'objective_type', 'map_object'];
  return Object.fromEntries(allowed.flatMap((key) => key in event ? [[key, sanitizeProviderValue(event[key])]] : []));
}

function captureClassification(value: unknown) {
  return value === 'standard_5v5' || value === 'nonstandard_custom' || value === 'incomplete_capture'
    ? value
    : null;
}

function inferCaptureQuality(snapshot: FinalSnapshot, postGameCaptured: boolean): CaptureQuality {
  const participants = snapshot.participants ?? [];
  const ours = participants.filter((participant) => Boolean(participant.is_our_team));
  const enemy = participants.filter((participant) => !participant.is_our_team);
  const botsPresent = participants.some((participant) => participant.is_bot === true);
  const rosterCoverage = ours.filter((participant) => Boolean(participant.player_id)).length;
  const incomplete = !postGameCaptured || !ours.length || !enemy.length || !snapshot.result || !snapshot.duration_seconds;
  const nonstandard = ours.length !== 5 || enemy.length !== 5 || botsPresent;
  return {
    classification: incomplete ? 'incomplete_capture' : nonstandard ? 'nonstandard_custom' : 'standard_5v5',
    flags: [
      !postGameCaptured ? 'missing_post_game' : null,
      ours.length !== 5 || enemy.length !== 5 ? 'non_5v5' : null,
      botsPresent ? 'bots_present' : null,
      rosterCoverage < ours.length ? 'incomplete_roster_match' : null,
      !snapshot.result ? 'missing_result' : null,
      !snapshot.duration_seconds ? 'missing_duration' : null,
    ].filter((flag): flag is string => Boolean(flag)),
    roster_coverage: rosterCoverage,
    our_participants: ours.length,
    enemy_participants: enemy.length,
    bots_present: botsPresent,
  };
}

function canonicalBans(draft: unknown, ourSide?: 'blue' | 'red') {
  if (!draft || typeof draft !== 'object' || Array.isArray(draft)) return { our_bans: [], enemy_bans: [] };
  const bans = Array.isArray((draft as { bans?: unknown }).bans) ? (draft as { bans: unknown[] }).bans : [];
  const safeBans = bans.flatMap((value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
    const row = value as Record<string, unknown>;
    if (typeof row.champion !== 'string') return [];
    return [{ champion: row.champion, champion_id: number(row.champion_id), order: number(row.order), team: row.team }];
  });
  return {
    our_bans: safeBans.filter((ban) => ban.team === ourSide).map(({ team: _team, ...ban }) => ban),
    enemy_bans: safeBans.filter((ban) => ban.team !== ourSide).map(({ team: _team, ...ban }) => ban),
  };
}

function hasObjectiveEvidence(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).some((rows) => Array.isArray(rows) && rows.length > 0);
}

function hasDraftEvidence(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const draft = value as { picks?: unknown; bans?: unknown };
  return (Array.isArray(draft.picks) && draft.picks.length > 0) || (Array.isArray(draft.bans) && draft.bans.length > 0);
}

function competitiveRole(value: unknown) {
  if (typeof value !== 'string') return null;
  const roles: Record<string, 'top' | 'jungle' | 'mid' | 'adc' | 'support'> = {
    TOP: 'top',
    JUNGLE: 'jungle',
    MIDDLE: 'mid',
    MID: 'mid',
    BOTTOM: 'adc',
    BOT: 'adc',
    ADC: 'adc',
    UTILITY: 'support',
    SUPPORT: 'support',
  };
  return roles[value.trim().toUpperCase()] ?? null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: collectorCorsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  const device = await deviceFromRequest(req);
  if (!device) return json({ error: 'Invalid collector credential.' }, 401);
  const body = await req.json().catch(() => null);
  if (!body?.action) return json({ error: 'action is required.' }, 400);
  const db = serviceClient();
  const touch = () => db.from('collector_devices').update({ last_seen_at: new Date().toISOString(), app_version: body.app_version ?? null }).eq('id', device.id);

  if (body.action === 'heartbeat') { await touch(); return json({ ok: true, server_time: new Date().toISOString() }); }
  const { data: captureSetting } = await db
    .from('tenant_capture_settings')
    .select('profile')
    .eq('tenant_id', device.tenant_id)
    .maybeSingle();
  if ((captureSetting?.profile ?? 'desktop_manual') !== 'desktop_manual') {
    return json({ error: 'Game Capture is not enabled for this workspace.', code: 'capture_profile_inactive' }, 409);
  }
  if (body.action === 'configuration') {
    const [{ data: scrims }, { data: players }] = await Promise.all([
      db.from('scrims').select('id, opponent_name, starts_at, scheduled_time, ends_at, format, status')
        .eq('tenant_id', device.tenant_id).in('status', ['scheduled', 'in_progress']).order('starts_at').limit(20),
      db.from('players').select('id, riot_id, riot_tag_line, region')
        .eq('tenant_id', device.tenant_id).eq('is_active', true)
        .not('riot_id', 'is', null).not('riot_tag_line', 'is', null),
    ]);
    await touch();
    return json({
      scrims: eligibleCollectorScrims(scrims ?? []).map((scrim) => ({
        ...scrim,
        scheduled_time: scrim.starts_at ?? scrim.scheduled_time,
      })),
      roster: (players ?? []).map((player) => ({
        playerId: player.id,
        riotId: player.riot_id,
        tagLine: player.riot_tag_line,
        region: player.region,
      })),
    });
  }
  if (body.action === 'start') {
    if (!body.scrim_id || !body.client_session_id || !body.local_game_id) return json({ error: 'scrim_id, client_session_id and local_game_id are required.' }, 400);
    const { data: scrim } = await db.from('scrims').select('id').eq('id', body.scrim_id).eq('tenant_id', device.tenant_id).maybeSingle();
    if (!scrim) return json({ error: 'The selected scrim does not belong to this collector team.' }, 403);
    const { data: existing } = await db.from('collector_capture_sessions').select('id, status').eq('device_id', device.id).eq('client_session_id', body.client_session_id).maybeSingle();
    if (existing) return json({ capture_session_id: existing.id, status: existing.status, idempotent: true });
    const { data, error } = await db.from('collector_capture_sessions').insert({ tenant_id: device.tenant_id, device_id: device.id, scrim_id: scrim.id, client_session_id: body.client_session_id, local_game_id: body.local_game_id, schema_version: body.schema_version ?? 1 }).select('id, status').single();
    await touch();
    return error ? json({ error: error.message }, 400) : json({ capture_session_id: data.id, status: data.status });
  }
  if (!body.capture_session_id) return json({ error: 'capture_session_id is required.' }, 400);
  const { data: session } = await db.from('collector_capture_sessions').select('*').eq('id', body.capture_session_id).eq('device_id', device.id).eq('tenant_id', device.tenant_id).maybeSingle();
  if (!session) return json({ error: 'Capture session not found for this device.' }, 404);
  if (session.status === 'completed') return json({ capture_session_id: session.id, game_id: session.game_id, idempotent: true });

  if (body.action === 'events') {
    const events = Array.isArray(body.events) ? body.events.slice(0, 500) : [];
    if (!events.length) return json({ error: 'events is required.' }, 400);
    const rows = events.map(safeEvent).filter((event): event is Record<string, unknown> => Boolean(event))
      .map((event) => ({ capture_session_id: session.id, event_id: event.event_id as string, sequence: Number.isInteger(event.sequence) ? event.sequence as number : 0, occurred_at: event.occurred_at ?? null, event_type: event.event_type ?? null, payload: event }));
    const { error } = await db.from('collector_capture_events').upsert(rows, { onConflict: 'capture_session_id,event_id', ignoreDuplicates: true });
    await db.from('collector_capture_sessions').update({ last_seen_at: new Date().toISOString(), last_sequence: Math.max(session.last_sequence, ...rows.map((row) => row.sequence)) }).eq('id', session.id);
    await touch();
    return error ? json({ error: error.message }, 400) : json({ accepted: rows.length });
  }
  if (body.action !== 'complete' || !body.snapshot) return json({ error: 'Expected events or complete action.' }, 400);
  const snapshot = body.snapshot as FinalSnapshot;
  if (!snapshot.local_game_id || !Array.isArray(snapshot.participants) || snapshot.participants.length < 1) return json({ error: 'A final snapshot with at least one participant is required.' }, 400);
  const { data: existingGame } = await db.from('scrim_games').select('id, game_number')
    .eq('scrim_id', session.scrim_id).eq('external_game_id', snapshot.local_game_id)
    .order('created_at', { ascending: true }).limit(1).maybeSingle();
  const { data: latest } = existingGame
    ? { data: existingGame }
    : await db.from('scrim_games').select('game_number').eq('scrim_id', session.scrim_id).order('game_number', { ascending: false }).limit(1).maybeSingle();
  const captureFeatures = snapshot.capture_features;
  const championSelectCaptured = Boolean(captureFeatures?.champion_select ?? snapshot.champion_select);
  const postGameCaptured = Boolean(captureFeatures?.post_game ?? snapshot.post_game);
  const quality = snapshot.capture_quality ?? inferCaptureQuality(snapshot, postGameCaptured);
  const gameRecord = { scrim_id: session.scrim_id, game_number: existingGame?.game_number ?? (latest?.game_number ?? 0) + 1, status: 'completed', external_game_id: snapshot.local_game_id, desktop_session_id: session.client_session_id, game_start_time: snapshot.started_at ?? session.started_at, game_end_time: snapshot.ended_at ?? new Date().toISOString(), duration_seconds: number(snapshot.duration_seconds), result: snapshot.result ?? null, side: snapshot.side ?? null, our_team_kills: number(snapshot.our_team_kills), enemy_team_kills: number(snapshot.enemy_team_kills), our_team_gold: number(snapshot.our_team_gold), enemy_team_gold: number(snapshot.enemy_team_gold), objectives: sanitizeProviderValue(snapshot.objectives ?? {}), bans: canonicalBans(snapshot.draft, snapshot.side), game_classification: captureClassification(quality.classification), quality_flags: Array.isArray(quality.flags) ? quality.flags.filter((flag): flag is string => typeof flag === 'string').slice(0, 20) : [], roster_coverage: number(quality.roster_coverage) ?? 0, external_game_data: { source: 'desktop_collector', schema_version: snapshot.schema_version, captured_at: new Date().toISOString(), draft: sanitizeProviderValue(snapshot.draft ?? null), timeline: Array.isArray(snapshot.timeline) ? snapshot.timeline.map(safeEvent).filter(Boolean) : [], game_context: sanitizeProviderValue(snapshot.game_context ?? {}), capture_features: { champion_select: championSelectCaptured, post_game: postGameCaptured }, capture_quality: sanitizeProviderValue(quality) } };
  const gameWrite = existingGame
    ? await db.from('scrim_games').update(gameRecord).eq('id', existingGame.id).select('id').single()
    : await db.from('scrim_games').insert(gameRecord).select('id').single();
  const { data: game, error: gameError } = gameWrite;
  if (gameError || !game) return json({ error: gameError?.message ?? 'Could not save game.' }, 400);
  const participants = snapshot.participants.map((player) => {
    const isOurTeam = Boolean(player.is_our_team);
    return {
      tenant_id: session.tenant_id,
      scrim_game_id: game.id,
      summoner_name: player.riot_id || player.summoner_name || 'Unknown player',
      riot_id: player.riot_id ?? null,
      riot_tag_line: player.riot_tag_line ?? null,
      region: player.region ?? null,
      player_id: player.player_id ?? null,
      identity_status: player.player_id ? 'matched' : isOurTeam ? (player.identity_status ?? 'unresolved') : 'ignored',
      identity_source: player.player_id ? 'collector' : null,
      champion_name: player.champion_name ?? null,
      role: competitiveRole(player.role),
      is_our_team: isOurTeam,
      kills: number(player.kills),
      deaths: number(player.deaths),
      assists: number(player.assists),
      cs: number(player.cs),
      gold: number(player.gold),
      level: number(player.level),
      damage_dealt: number(player.damage_dealt),
      damage_taken: number(player.damage_taken),
      vision_score: number(player.vision_score),
      items: player.items ?? [],
      runes: player.runes ?? {},
      summoner_spells: player.summoner_spells ?? {},
      is_bot: Boolean(player.is_bot),
      advanced_stats: sanitizeProviderValue(player.advanced_stats ?? {}),
    };
  });
  await db.from('scrim_participants').delete().eq('scrim_game_id', game.id);
  const { error: participantsError } = await db.from('scrim_participants').insert(participants);
  if (participantsError) return json({ error: participantsError.message }, 400);
  const normalizedEvents = Array.isArray(snapshot.timeline)
    ? snapshot.timeline.map(safeEvent).filter((event): event is Record<string, unknown> => Boolean(event))
    : [];
  if (normalizedEvents.length) {
    const eventRows = normalizedEvents.map((event) => ({
      tenant_id: session.tenant_id,
      scrim_game_id: game.id,
      event_id: event.event_id as string,
      sequence: Number.isInteger(event.sequence) ? event.sequence as number : 0,
      occurred_seconds: typeof event.occurred_seconds === 'number' ? event.occurred_seconds : null,
      event_type: typeof event.event_type === 'string' ? event.event_type : 'Unknown',
      team: event.team === 'our' || event.team === 'enemy' ? event.team : 'neutral',
      actor_name: typeof event.actor_name === 'string' ? event.actor_name : null,
      victim_name: typeof event.victim_name === 'string' ? event.victim_name : null,
      objective_type: typeof event.objective_type === 'string' ? event.objective_type : null,
      map_object: typeof event.map_object === 'string' ? event.map_object : null,
    }));
    const { error: eventError } = await db.from('scrim_game_events').upsert(eventRows, { onConflict: 'scrim_game_id,event_id' });
    if (eventError) return json({ error: eventError.message }, 400);
  }
  const draftCaptured = hasDraftEvidence(snapshot.draft);
  if (draftCaptured) {
    const { data: existingDraft } = await db.from('game_drafts').select('id').eq('scrim_game_id', game.id)
      .order('created_at', { ascending: true }).limit(1).maybeSingle();
    const draftRecord = {
      scrim_game_id: game.id,
      draft_mode: 'client',
      our_team_side: snapshot.side ?? null,
      draft_data: snapshot.draft,
      session_id: session.client_session_id,
      completed_at: snapshot.ended_at ?? new Date().toISOString(),
    };
    const { error: draftError } = existingDraft
      ? await db.from('game_drafts').update(draftRecord).eq('id', existingDraft.id)
      : await db.from('game_drafts').insert(draftRecord);
    if (draftError) return json({ error: draftError.message }, 400);
  }
  const capabilities = [
    snapshot.result ? 'result' : null,
    draftCaptured ? 'draft' : null,
    championSelectCaptured ? 'champion_select' : null,
    postGameCaptured ? 'post_game_stats' : null,
    'participant_stats',
    Array.isArray(snapshot.timeline) && snapshot.timeline.length ? 'timeline' : null,
    hasObjectiveEvidence(snapshot.objectives) ? 'objectives' : null,
  ].filter((value): value is string => Boolean(value));
  const { error: evidenceError } = await db.from('scrim_game_evidence').upsert({
    tenant_id: session.tenant_id,
    scrim_game_id: game.id,
    provider: 'desktop_collector',
    provider_record_id: snapshot.local_game_id,
    payload_version: `desktop-v${snapshot.schema_version ?? 1}`,
    captured_at: snapshot.ended_at ?? new Date().toISOString(),
    capabilities,
    metadata: { device_id: device.id, capture_session_id: session.id, champion_select_captured: championSelectCaptured, post_game_captured: postGameCaptured },
  }, { onConflict: 'scrim_game_id' });
  if (evidenceError) return json({ error: evidenceError.message }, 400);
  await db.from('collector_capture_sessions').update({ status: 'completed', game_id: game.id, completed_at: new Date().toISOString(), last_seen_at: new Date().toISOString() }).eq('id', session.id);
  await touch();
  return json({ capture_session_id: session.id, game_id: game.id, status: 'completed' });
});
