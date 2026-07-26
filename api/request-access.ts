import { createHmac, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const json = (response: VercelResponse, status: number, body: unknown) => { response.setHeader("cache-control", "no-store"); return response.status(status).json(body); };

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") return json(response, 405, { error: "method_not_allowed" });
  const correlationId = randomUUID(); const body = (request.body || {}) as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const teamName = typeof body.teamName === "string" ? body.teamName.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (typeof body.website === "string" && body.website.trim()) return json(response, 202, { accepted: true });
  if (!emailPattern.test(email) || !name || !teamName || name.length > 80 || teamName.length > 100 || message.length > 1000) return json(response, 400, { error: "invalid_request_details" });
  const url = process.env.VITE_SUPABASE_URL; const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error(JSON.stringify({ level: "error", event: "access_request_unconfigured", correlation_id: correlationId })); return json(response, 503, { error: "service_unavailable", reference: correlationId }); }
  const forwarded = String(request.headers["x-forwarded-for"] || request.socket.remoteAddress || "unknown").split(",")[0].trim();
  const fingerprint = createHmac("sha256", process.env.REQUEST_ACCESS_RATE_SALT || key).update(forwarded).digest("hex");
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const windowStart = new Date(Math.floor(Date.now() / 900_000) * 900_000).toISOString();
  const existingLimit = await supabase.from("access_request_rate_limits").select("attempts").eq("fingerprint", fingerprint).eq("window_started_at", windowStart).maybeSingle();
  if (existingLimit.error) return json(response, 503, { error: "service_unavailable", reference: correlationId });
  const attempts = (existingLimit.data?.attempts || 0) + 1;
  await supabase.from("access_request_rate_limits").upsert({ fingerprint, window_started_at: windowStart, attempts, updated_at: new Date().toISOString() });
  if (attempts > 5) { response.setHeader("retry-after", "900"); return json(response, 429, { error: "too_many_requests" }); }
  const recent = await supabase.from("access_requests").select("updated_at").eq("email", email).maybeSingle();
  if (recent.data && Date.now() - new Date(recent.data.updated_at).getTime() < 1_800_000) return json(response, 202, { accepted: true });
  const result = await supabase.from("access_requests").upsert({ email, contact_name: name, team_name: teamName, message: message || null, source: "public_site", status: "new", updated_at: new Date().toISOString() }, { onConflict: "email" });
  if (result.error) { console.error(JSON.stringify({ level: "error", event: "access_request_save_failed", correlation_id: correlationId, code: result.error.code })); return json(response, 503, { error: "service_unavailable", reference: correlationId }); }
  console.info(JSON.stringify({ level: "info", event: "access_request_received", correlation_id: correlationId }));
  return json(response, 202, { accepted: true });
}
