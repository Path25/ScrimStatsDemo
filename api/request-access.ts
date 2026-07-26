import { createClient } from '@supabase/supabase-js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(request: { method?: string; body?: unknown }, response: { status: (code: number) => { json: (body: unknown) => void } }) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });
  const body = (request.body || {}) as Record<string, unknown>;
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const teamName = typeof body.teamName === 'string' ? body.teamName.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const honeypot = typeof body.website === 'string' ? body.website.trim() : '';
  if (honeypot) return response.status(200).json({ accepted: true });
  if (!emailPattern.test(email) || !name || !teamName || name.length > 80 || teamName.length > 100 || message.length > 1000) return response.status(400).json({ error: 'Invalid request details' });
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return response.status(500).json({ error: 'Request access is not configured' });
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await supabase.from('access_requests').upsert({ email, contact_name: name, team_name: teamName, message: message || null, source: 'public_site' }, { onConflict: 'email' });
  if (error) return response.status(500).json({ error: 'Request access could not be saved' });
  return response.status(201).json({ accepted: true });
}
