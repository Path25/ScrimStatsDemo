import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const headers = { "content-type": "application/json", "cache-control": "no-store" };
const respond = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });

Deno.serve(async (request) => {
  if (request.method !== "POST") return respond(405, { error: "method_not_allowed" });
  const url = Deno.env.get("SUPABASE_URL")!; const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return respond(401, { error: "authentication_required" });
  const { data: authData } = await admin.auth.getUser(token);
  const user = authData.user;
  if (!user) return respond(401, { error: "authentication_required" });
  const { data: operator } = await admin.from("platform_operators").select("user_id, display_name, is_active").eq("user_id", user.id).eq("is_active", true).maybeSingle();
  if (!operator) return respond(403, { error: "operator_access_required" });
  const body = await request.json().catch(() => ({})); const action = String(body.action || "list");

  try {
    if (action === "list") {
      const [requests, tenants, invitations, deliveries, checklists, cases] = await Promise.all([
        admin.from("access_requests").select("id, contact_name, email, team_name, message, source, status, created_at, updated_at").order("created_at", { ascending: false }).limit(100),
        admin.from("tenants").select("id, name, slug, subscription_status, settings, created_at").order("created_at", { ascending: false }).limit(100),
        admin.from("team_invitations").select("id, tenant_id, email, role, delivery_status, delivery_error, last_sent_at, expires_at, accepted_at, revoked_at").order("created_at", { ascending: false }).limit(100),
        admin.from("notification_deliveries").select("id, tenant_id, recipient_email, template_key, status, attempts, last_error, created_at, delivered_at").order("created_at", { ascending: false }).limit(100),
        admin.from("pilot_onboarding_items").select("*").order("updated_at", { ascending: false }).limit(250),
        admin.from("support_cases").select("*").order("created_at", { ascending: false }).limit(100),
      ]);
      const failure = [requests, tenants, invitations, deliveries, checklists, cases].find((result) => result.error)?.error;
      if (failure) throw failure;
      return respond(200, { operator, requests: requests.data, tenants: tenants.data, invitations: invitations.data, deliveries: deliveries.data, checklists: checklists.data, supportCases: cases.data });
    }
    if (action === "update_request") {
      if (!["new", "contacted", "approved", "declined", "failed"].includes(body.status)) return respond(400, { error: "invalid_status" });
      const result = await admin.from("access_requests").update({ status: body.status, updated_at: new Date().toISOString() }).eq("id", body.id).select("id").single(); if (result.error) throw result.error;
    } else if (action === "update_checklist") {
      if (!["pending", "in_progress", "complete", "blocked", "not_applicable"].includes(body.status)) return respond(400, { error: "invalid_status" });
      const result = await admin.from("pilot_onboarding_items").update({ status: body.status, note: body.note || null, completed_at: body.status === "complete" ? new Date().toISOString() : null, completed_by: body.status === "complete" ? user.id : null, updated_at: new Date().toISOString() }).eq("id", body.id).select("id, tenant_id").single(); if (result.error) throw result.error;
    } else if (action === "update_support") {
      if (!["open", "investigating", "waiting_on_team", "resolved", "closed"].includes(body.status)) return respond(400, { error: "invalid_status" });
      const result = await admin.from("support_cases").update({ status: body.status, assigned_operator_id: user.id, resolution: body.resolution || null, resolved_at: ["resolved", "closed"].includes(body.status) ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("id", body.id).select("id, tenant_id").single(); if (result.error) throw result.error;
    } else if (action === "provision") {
      const name = String(body.name || "").trim(); const ownerEmail = String(body.owner_email || "").trim().toLowerCase();
      const slug = String(body.slug || name).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (!name || !ownerEmail || !slug) return respond(400, { error: "name_owner_and_slug_required" });
      const result = await admin.rpc("provision_pilot_workspace", { p_name: name, p_slug: slug, p_owner_email: ownerEmail, p_request_id: body.request_id || null });
      if (result.error) throw result.error;
      const provisioned = result.data as { tenant_id: string; invitation_id?: string; token?: string; owner_user_id?: string };
      if (provisioned.invitation_id && provisioned.token) {
        const redirectTo = `${Deno.env.get("APP_ORIGIN") || "https://scrimstats.gg"}/accept-invite?token=${encodeURIComponent(provisioned.token)}`;
        const link = await admin.auth.admin.generateLink({ type: "invite", email: ownerEmail, options: { redirectTo } });
        if (link.error) throw link.error;
        const sent = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "content-type": "application/json" }, body: JSON.stringify({ from: "ScrimStats <team@scrimstats.gg>", to: [ownerEmail], subject: `Your ${name} ScrimStats workspace is ready`, html: `<p>Your managed-pilot workspace is ready.</p><p><a href="${link.data.properties.action_link}">Set up your account</a></p><p>This secure link expires in seven days.</p>` }) });
        await admin.from("team_invitations").update({ delivery_status: sent.ok ? "sent" : "failed", delivery_error: sent.ok ? null : `email_provider_${sent.status}`, last_sent_at: new Date().toISOString() }).eq("id", provisioned.invitation_id);
      }
      await admin.from("operator_audit_events").insert({ operator_id: user.id, tenant_id: provisioned.tenant_id, action: "workspace_provisioned", target_type: "tenant", target_id: provisioned.tenant_id, detail: { owner_email: ownerEmail, request_id: body.request_id || null } });
      return respond(200, { success: true, tenant_id: provisioned.tenant_id });
    } else return respond(400, { error: "unsupported_action" });
    await admin.from("operator_audit_events").insert({ operator_id: user.id, tenant_id: body.tenant_id || null, action, target_type: action.includes("request") ? "access_request" : action.includes("support") ? "support_case" : "onboarding_item", target_id: String(body.id || ""), detail: { status: body.status } });
    return respond(200, { success: true });
  } catch (error) {
    const correlationId = crypto.randomUUID(); console.error(JSON.stringify({ event: "pilot_ops_failure", action, operator_id: user.id, correlation_id: correlationId, error: error instanceof Error ? error.message : String(error) }));
    return respond(500, { error: "operation_failed", reference: correlationId });
  }
});
