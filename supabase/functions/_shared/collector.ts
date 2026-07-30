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

function serviceRoleKey() {
  const legacyKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacyKey) return legacyKey;

  try {
    return JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}').default ?? null;
  } catch {
    return null;
  }
}

export const serviceClient = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  serviceRoleKey()!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

type ScheduledScrim = {
  id: string;
  opponent_name: string;
  starts_at?: string | null;
  scheduled_time?: string | null;
  ends_at?: string | null;
  format?: string | null;
  status: string;
};

export function eligibleCollectorScrims(scrims: ScheduledScrim[], now = Date.now()) {
  const graceCutoff = now - 90 * 60_000;
  return scrims.filter((scrim) => {
    if (scrim.status === 'in_progress') return true;
    if (scrim.status !== 'scheduled') return false;
    const relevantTime = Date.parse(scrim.ends_at ?? scrim.starts_at ?? scrim.scheduled_time ?? '');
    return Number.isFinite(relevantTime) && relevantTime >= graceCutoff;
  });
}

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

// Collector access is a paid workspace entitlement. Keep this server-side so a
// Free manager cannot bypass the browser gate by invoking a function directly.
export async function collectorEntitled(tenantId: string, db = serviceClient()) {
  const { data, error } = await db.from('tenants')
    .select('subscription_tier, subscription_status, subscription_period_end, subscription_past_due_started_at')
    .eq('id', tenantId)
    .maybeSingle();
  if (error || !data || !['pro', 'elite'].includes(data.subscription_tier)) return false;
  if (['active', 'trialing'].includes(data.subscription_status ?? '')) return true;
  const now = Date.now();
  if (data.subscription_status === 'past_due') {
    const started = Date.parse(data.subscription_past_due_started_at ?? '');
    return Number.isFinite(started) && started + 7 * 24 * 60 * 60_000 > now;
  }
  const periodEnd = Date.parse(data.subscription_period_end ?? '');
  return Number.isFinite(periodEnd) && periodEnd > now;
}

// Discord must be enabled as a released workspace module as well as being an
// Elite entitlement. This is kept below the browser so a direct Function call
// cannot activate an integration that the product still presents as planned.
export async function discordEntitled(tenantId: string) {
  const db = serviceClient();
  const [{ data: tenant, error: tenantError }, { data: feature, error: featureError }] = await Promise.all([
    db.from('tenants').select('subscription_tier').eq('id', tenantId).maybeSingle(),
    db.from('tenant_feature_access')
      .select('release_state, is_enabled')
      .eq('tenant_id', tenantId)
      .eq('module_key', 'discord')
      .maybeSingle(),
  ]);
  return !tenantError
    && !featureError
    && tenant?.subscription_tier === 'elite'
    && feature?.release_state === 'live'
    && feature.is_enabled === true;
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
