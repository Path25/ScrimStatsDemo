import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";

const allowedOrigin = Deno.env.get("APP_ORIGIN") || "https://scrimstats.gg";
const cors = { "Access-Control-Allow-Origin": allowedOrigin, "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", Vary: "Origin" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character] || character));

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!url || !serviceKey || !resendKey) return json({ error: "Invitation delivery is not configured" }, 503);
  const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const token = authorization.slice(7);
  const { data: authData, error: authError } = await service.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "Session is invalid" }, 401);
  const input = await request.json() as { action?: string; tenant_id?: string; invitation_id?: string; email?: string; role?: string; player_id?: string | null };
  const action = input.action || "create";
  if (!input.tenant_id) return json({ error: "Workspace is required" }, 400);
  const { data: membership } = await service.from("tenant_users").select("role").eq("tenant_id", input.tenant_id).eq("user_id", authData.user.id).maybeSingle();
  if (!membership || !["owner", "admin"].includes(membership.role)) return json({ error: "Owner or admin access is required" }, 403);

  if (action === "revoke") {
    if (!input.invitation_id) return json({ error: "Invitation is required" }, 400);
    const { error } = await service.from("team_invitations").update({ revoked_at: new Date().toISOString(), delivery_status: "revoked" }).eq("id", input.invitation_id).eq("tenant_id", input.tenant_id).is("accepted_at", null);
    if (error) return json({ error: error.message }, 400);
    return json({ revoked: true });
  }

  const normalizedEmail = input.email?.trim().toLowerCase();
  let invitation: { id: string; email: string; token: string; role: string; expires_at: string; player_id: string | null } | null = null;
  if (action === "resend") {
    if (!input.invitation_id) return json({ error: "Invitation is required" }, 400);
    const result = await service.from("team_invitations").select("id,email,token,role,expires_at,player_id").eq("id", input.invitation_id).eq("tenant_id", input.tenant_id).is("accepted_at", null).is("revoked_at", null).maybeSingle();
    if (result.error || !result.data) return json({ error: "Invitation is unavailable" }, 404);
    invitation = result.data;
  } else {
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return json({ error: "A valid email is required" }, 400);
    if (!input.role || !["admin", "member", "viewer"].includes(input.role)) return json({ error: "A valid role is required" }, 400);
    if (input.player_id) {
      const { data: player } = await service.from("players").select("id").eq("id", input.player_id).eq("tenant_id", input.tenant_id).is("archived_at", null).maybeSingle();
      if (!player) return json({ error: "Roster profile is unavailable" }, 400);
    }
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const existing = await service.from("team_invitations").select("id").eq("tenant_id", input.tenant_id).eq("email", normalizedEmail).is("accepted_at", null).is("revoked_at", null).maybeSingle();
    const write = existing.data
      ? await service.from("team_invitations").update({ role: input.role, player_id: input.player_id || null, token: invitationToken, expires_at: expiresAt, invited_by: authData.user.id, delivery_status: "pending", delivery_error: null }).eq("id", existing.data.id).select("id,email,token,role,expires_at,player_id").single()
      : await service.from("team_invitations").insert({ tenant_id: input.tenant_id, email: normalizedEmail, role: input.role, player_id: input.player_id || null, token: invitationToken, expires_at: expiresAt, invited_by: authData.user.id, delivery_status: "pending" }).select("id,email,token,role,expires_at,player_id").single();
    if (write.error || !write.data) return json({ error: write.error?.message || "Invitation could not be created" }, 400);
    invitation = write.data;
    if (input.player_id) await service.from("players").update({ membership_state: "invited" }).eq("id", input.player_id).eq("tenant_id", input.tenant_id);
  }

  const redirectTo = `${allowedOrigin}/accept-invite?token=${encodeURIComponent(invitation.token)}`;
  let link = await service.auth.admin.generateLink({ type: "invite", email: invitation.email, options: { redirectTo } });
  if (link.error) link = await service.auth.admin.generateLink({ type: "magiclink", email: invitation.email, options: { redirectTo } });
  if (link.error || !link.data.properties?.action_link) {
    await service.from("team_invitations").update({ delivery_status: "failed", delivery_error: link.error?.message || "Authentication link could not be created" }).eq("id", invitation.id);
    return json({ error: "Secure account link could not be created" }, 502);
  }
  const { data: tenant } = await service.from("tenants").select("name").eq("id", input.tenant_id).single();
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${resendKey}`, "content-type": "application/json" }, body: JSON.stringify({ from: "ScrimStats <noreply@email.scrimstats.gg>", to: [invitation.email], subject: `Join ${tenant?.name || "your team"} on ScrimStats`, html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px"><h1 style="font-size:24px">Your private team workspace is ready</h1><p>${escapeHtml(authData.user.email || "A team manager")} invited you to join <strong>${escapeHtml(tenant?.name || "a ScrimStats team")}</strong> as ${escapeHtml(invitation.role)}.</p><p><a href="${link.data.properties.action_link}" style="display:inline-block;background:#11e2d0;color:#06100f;padding:12px 18px;text-decoration:none;font-weight:700">Set up secure access</a></p><p style="color:#667085;font-size:13px">This link expires on ${new Date(invitation.expires_at).toUTCString()}.</p></div>` }) });
  if (!response.ok) {
    const detail = await response.text();
    await service.from("team_invitations").update({ delivery_status: "failed", delivery_error: detail.slice(0, 500), last_sent_at: new Date().toISOString() }).eq("id", invitation.id);
    return json({ error: "Invitation email could not be delivered", invitation_id: invitation.id }, 502);
  }
  await service.from("team_invitations").update({ delivery_status: "sent", delivery_error: null, last_sent_at: new Date().toISOString() }).eq("id", invitation.id);
  return json({ invitation_id: invitation.id, token: invitation.token, setup_url: link.data.properties.action_link, expires_at: invitation.expires_at });
});
