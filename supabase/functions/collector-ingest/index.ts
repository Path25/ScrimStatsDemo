import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { collectorCorsHeaders, deviceFromRequest, json, serviceClient } from '../_shared/collector.ts';

type Participant = { riot_id?: string; riot_tag_line?: string; region?: string; summoner_name?: string; champion_name?: string; role?: string; is_our_team?: boolean; player_id?: string; identity_status?: string; kills?: number; deaths?: number; assists?: number; cs?: number; gold?: number; level?: number; damage_dealt?: number; damage_taken?: number; vision_score?: number; items?: unknown; runes?: unknown; summoner_spells?: unknown };
type FinalSnapshot = { local_game_id: string; schema_version: number; identity_resolution_status?: string; started_at?: string; ended_at?: string; duration_seconds?: number; result?: 'win' | 'loss' | 'draw'; side?: 'blue' | 'red'; our_team_kills?: number; enemy_team_kills?: number; our_team_gold?: number; enemy_team_gold?: number; objectives?: unknown; draft?: unknown; participants?: Participant[]; timeline?: unknown[] };

function number(value: unknown) { return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null; }

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
    return json({ error: 'Desktop capture is inactive for this workspace.', code: 'capture_profile_inactive' }, 409);
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
    const rows = events.filter((event: unknown) => event && typeof event === 'object' && typeof (event as { event_id?: unknown }).event_id === 'string')
      .map((event: { event_id: string; sequence?: number; occurred_at?: string; event_type?: string }) => ({ capture_session_id: session.id, event_id: event.event_id, sequence: Number.isInteger(event.sequence) ? event.sequence : 0, occurred_at: event.occurred_at ?? null, event_type: event.event_type ?? null, payload: event }));
    const { error } = await db.from('collector_capture_events').upsert(rows, { onConflict: 'capture_session_id,event_id', ignoreDuplicates: true });
    await db.from('collector_capture_sessions').update({ last_seen_at: new Date().toISOString(), last_sequence: Math.max(session.last_sequence, ...rows.map((row) => row.sequence)) }).eq('id', session.id);
    await touch();
    return error ? json({ error: error.message }, 400) : json({ accepted: rows.length });
  }
  if (body.action !== 'complete' || !body.snapshot) return json({ error: 'Expected events or complete action.' }, 400);
  const snapshot = body.snapshot as FinalSnapshot;
  if (!snapshot.local_game_id || !Array.isArray(snapshot.participants) || snapshot.participants.length < 2) return json({ error: 'A final snapshot with participants is required.' }, 400);
  const { data: latest } = await db.from('scrim_games').select('game_number').eq('scrim_id', session.scrim_id).order('game_number', { ascending: false }).limit(1).maybeSingle();
  const gameRecord = { scrim_id: session.scrim_id, game_number: (latest?.game_number ?? 0) + 1, status: 'completed', external_game_id: snapshot.local_game_id, desktop_session_id: session.client_session_id, game_start_time: snapshot.started_at ?? session.started_at, game_end_time: snapshot.ended_at ?? new Date().toISOString(), duration_seconds: number(snapshot.duration_seconds), result: snapshot.result ?? null, side: snapshot.side ?? null, our_team_kills: number(snapshot.our_team_kills), enemy_team_kills: number(snapshot.enemy_team_kills), our_team_gold: number(snapshot.our_team_gold), enemy_team_gold: number(snapshot.enemy_team_gold), objectives: snapshot.objectives ?? {}, bans: (snapshot.draft as { bans?: unknown } | undefined)?.bans ?? {}, external_game_data: { source: 'desktop_collector', schema_version: snapshot.schema_version, captured_at: new Date().toISOString(), draft: snapshot.draft ?? null, timeline: snapshot.timeline ?? [] } };
  const { data: game, error: gameError } = await db.from('scrim_games').insert(gameRecord).select('id').single();
  if (gameError || !game) return json({ error: gameError?.message ?? 'Could not save game.' }, 400);
  const participants = snapshot.participants.map((player) => ({
    tenant_id: session.tenant_id,
    scrim_game_id: game.id,
    summoner_name: player.riot_id || player.summoner_name || 'Unknown player',
    riot_id: player.riot_id ?? null,
    riot_tag_line: player.riot_tag_line ?? null,
    region: player.region ?? null,
    player_id: player.player_id ?? null,
    identity_status: player.identity_status ?? (player.player_id ? 'matched' : 'unresolved'),
    identity_source: player.player_id ? 'collector' : null,
    champion_name: player.champion_name ?? null,
    role: player.role ?? null,
    is_our_team: Boolean(player.is_our_team),
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
  }));
  const { error: participantsError } = await db.from('scrim_participants').insert(participants);
  if (participantsError) return json({ error: participantsError.message }, 400);
  const capabilities = [
    snapshot.result ? 'result' : null,
    snapshot.draft ? 'draft' : null,
    'participant_stats',
    Array.isArray(snapshot.timeline) && snapshot.timeline.length ? 'timeline' : null,
    snapshot.objectives && typeof snapshot.objectives === 'object' ? 'objectives' : null,
  ].filter((value): value is string => Boolean(value));
  const { error: evidenceError } = await db.from('scrim_game_evidence').insert({
    tenant_id: session.tenant_id,
    scrim_game_id: game.id,
    provider: 'desktop_collector',
    provider_record_id: snapshot.local_game_id,
    payload_version: `desktop-v${snapshot.schema_version ?? 1}`,
    captured_at: snapshot.ended_at ?? new Date().toISOString(),
    capabilities,
    metadata: { device_id: device.id, capture_session_id: session.id },
  });
  if (evidenceError) return json({ error: evidenceError.message }, 400);
  await db.from('collector_capture_sessions').update({ status: 'completed', game_id: game.id, completed_at: new Date().toISOString(), last_seen_at: new Date().toISOString() }).eq('id', session.id);
  await touch();
  return json({ capture_session_id: session.id, game_id: game.id, status: 'completed' });
});
