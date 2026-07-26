import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const collectorCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-collector-device-id',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...collectorCorsHeaders, 'Content-Type': 'application/json' },
});

export const serviceClient = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function randomSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export async function authenticatedUser(req: Request) {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const anon = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await anon.auth.getUser();
  return error ? null : data.user;
}

export async function managerMembership(userId: string, tenantId: string) {
  const { data } = await serviceClient().from('tenant_users')
    .select('role').eq('user_id', userId).eq('tenant_id', tenantId).maybeSingle();
  return data?.role && ['owner', 'admin'].includes(data.role) ? data.role : null;
}

export async function deviceFromRequest(req: Request) {
  const deviceId = req.headers.get('x-collector-device-id');
  const credential = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!deviceId || !credential) return null;
  const { data } = await serviceClient().from('collector_devices')
    .select('id, tenant_id, status, credential_hash').eq('id', deviceId).maybeSingle();
  if (!data || data.status !== 'active' || data.credential_hash !== await sha256(credential)) return null;
  return data;
}
