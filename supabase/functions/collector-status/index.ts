import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { authenticatedUser, collectorCorsHeaders, collectorEntitled, json, managerMembership, serviceClient } from '../_shared/collector.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: collectorCorsHeaders });
  const user = await authenticatedUser(req);
  if (!user) return json({ error: 'Authentication required.' }, 401);
  const query = new URL(req.url).searchParams;
  const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
  const tenantId = query.get('tenant_id') ?? body.tenant_id;
  const scrimId = query.get('scrim_id') ?? body.scrim_id;
  if (!tenantId || !await managerMembership(user.id, tenantId)) return json({ error: 'Not allowed.' }, 403);
  const db = serviceClient();
  if (!await collectorEntitled(tenantId, db)) {
    return json({ error: 'Game Capture is available with Pro or Elite.', code: 'collector_plan_required' }, 403);
  }
  const { data: devices } = await db.from('collector_devices').select('id, label, status, app_version, last_seen_at, created_at')
    .eq('tenant_id', tenantId).order('last_seen_at', { ascending: false, nullsFirst: false });
  let sessions: unknown[] = [];
  if (scrimId) {
    const { data } = await db.from('collector_capture_sessions').select('id, device_id, scrim_id, status, last_seen_at, started_at, completed_at, game_id')
      .eq('tenant_id', tenantId).eq('scrim_id', scrimId).order('started_at', { ascending: false }).limit(5);
    sessions = data ?? [];
  }
  return json({ devices: devices ?? [], sessions, server_time: new Date().toISOString() });
});
