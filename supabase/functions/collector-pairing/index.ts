import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { authenticatedUser, collectorCorsHeaders, json, managerMembership, randomSecret, serviceClient, sha256 } from '../_shared/collector.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: collectorCorsHeaders });
  const user = await authenticatedUser(req);
  if (!user) return json({ error: 'Authentication required.' }, 401);
  const body = await req.json().catch(() => null);
  if (!body?.tenant_id) return json({ error: 'tenant_id is required.' }, 400);
  const role = await managerMembership(user.id, body.tenant_id);
  if (!role) return json({ error: 'A team manager must connect this computer.' }, 403);
  const db = serviceClient();

  if (body.action === 'create') {
    const { data: captureSetting } = await db
      .from('tenant_capture_settings')
      .select('profile')
      .eq('tenant_id', body.tenant_id)
      .maybeSingle();
    if ((captureSetting?.profile ?? 'desktop_manual') !== 'desktop_manual') {
      return json({ error: 'Game Capture is not enabled for this workspace.' }, 409);
    }
    const code = randomSecret();
    const { data, error } = await db.from('collector_pairing_codes').insert({
      tenant_id: body.tenant_id, code_hash: await sha256(code), created_by: user.id,
      expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
    }).select('id, expires_at').single();
    if (error) return json({ error: error.message }, 400);
    return json({ pairing_code: code, pairing_id: data.id, expires_at: data.expires_at });
  }
  if (body.action === 'revoke' && body.device_id) {
    const { error } = await db.from('collector_devices').update({ status: 'revoked', revoked_at: new Date().toISOString() })
      .eq('id', body.device_id).eq('tenant_id', body.tenant_id);
    return error ? json({ error: error.message }, 400) : json({ ok: true });
  }
  return json({ error: 'Unsupported action.' }, 400);
});
