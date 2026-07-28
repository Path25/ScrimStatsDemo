import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { collectorCorsHeaders, collectorEntitled, eligibleCollectorScrims, json, randomSecret, serviceClient, sha256 } from '../_shared/collector.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: collectorCorsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  const body = await req.json().catch(() => null);
  if (!body?.pairing_code || !body?.device_label) return json({ error: 'pairing_code and device_label are required.' }, 400);
  const db = serviceClient();
  const { data: pairing } = await db.from('collector_pairing_codes').select('*')
    .eq('code_hash', await sha256(body.pairing_code)).is('redeemed_at', null).is('revoked_at', null).maybeSingle();
  if (!pairing || new Date(pairing.expires_at).getTime() < Date.now()) return json({ error: 'This pairing code is invalid or has expired.' }, 401);
  if (!await collectorEntitled(pairing.tenant_id, db)) {
    return json({ error: 'Game Capture is available with Pro or Elite.', code: 'collector_plan_required' }, 403);
  }
  const credential = randomSecret();
  const { data: device, error } = await db.from('collector_devices').insert({
    tenant_id: pairing.tenant_id, label: String(body.device_label).slice(0, 100), credential_hash: await sha256(credential),
    created_by: pairing.created_by, app_version: typeof body.app_version === 'string' ? body.app_version.slice(0, 50) : null,
  }).select('id, tenant_id, label').single();
  if (error) return json({ error: error.message }, 400);
  await db.from('collector_pairing_codes').update({ redeemed_at: new Date().toISOString(), redeemed_by_device_id: device.id }).eq('id', pairing.id).is('redeemed_at', null);
  const [{ data: scrims }, { data: players }] = await Promise.all([
    db.from('scrims').select('id, opponent_name, starts_at, scheduled_time, ends_at, format, status')
      .eq('tenant_id', pairing.tenant_id).in('status', ['scheduled', 'in_progress']).order('starts_at').limit(20),
    db.from('players').select('id, riot_id, riot_tag_line, region')
      .eq('tenant_id', pairing.tenant_id).eq('is_active', true)
      .not('riot_id', 'is', null).not('riot_tag_line', 'is', null),
  ]);
  return json({
    device_id: device.id,
    credential,
    tenant_id: device.tenant_id,
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
});
