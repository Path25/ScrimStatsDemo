import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const safe = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);

Deno.serve(async (request) => {
  const supplied = request.headers.get("x-worker-secret") || "";
  const expected = Deno.env.get("NOTIFICATION_WORKER_SECRET") || Deno.env.get("SOLOQ_WORKER_SECRET");
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  let authorized = Boolean(expected && supplied && supplied === expected);
  if (!authorized && supplied) {
    const verification = await supabase.rpc("verify_soloq_worker_secret", { p_secret: supplied });
    authorized = verification.data === true && !verification.error;
  }
  if (!authorized) return json(401, { error: "unauthorized" });
  const now = new Date().toISOString();
  const { data: reminders, error: reminderError } = await supabase.from("notification_reminders").select("*").eq("status", "pending").lte("scheduled_for", now).order("scheduled_for").limit(50);
  if (reminderError) return json(500, { error: "reminder_query_failed" });

  for (const reminder of reminders || []) {
    let title = "Team reminder"; let body = "A team item is due."; let href = "/overview";
    if (reminder.scrim_id) {
      const { data: scrim } = await supabase.from("scrims").select("id, opponent_name, starts_at, status, archived_at").eq("id", reminder.scrim_id).maybeSingle();
      if (!scrim || scrim.archived_at || ["cancelled", "completed"].includes(scrim.status || "")) { await supabase.from("notification_reminders").update({ status: "cancelled" }).eq("id", reminder.id); continue; }
      title = reminder.reminder_kind === "scrim_24h" ? "Scrim in 24 hours" : "Scrim in two hours";
      body = `${scrim.opponent_name} starts ${new Date(scrim.starts_at).toLocaleString("en-GB", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" })} UTC.`;
      href = `/scrims/${scrim.id}`;
    } else if (reminder.coaching_action_id) {
      const { data: action } = await supabase.from("coaching_actions").select("id, title, status").eq("id", reminder.coaching_action_id).maybeSingle();
      if (!action || ["complete", "dismissed"].includes(action.status)) { await supabase.from("notification_reminders").update({ status: "cancelled" }).eq("id", reminder.id); continue; }
      title = reminder.reminder_kind === "action_overdue" ? "Coaching action overdue" : "Coaching action due"; body = action.title; href = "/actions";
    }
    const dedupe = `reminder:${reminder.id}`;
    const queued = await supabase.rpc("queue_workspace_notification", { p_tenant_id: reminder.tenant_id, p_user_id: reminder.user_id, p_category: reminder.scrim_id ? "schedule" : "coaching_action", p_title: title, p_body: body, p_href: href, p_dedupe_key: dedupe, p_template_key: reminder.reminder_kind, p_payload: { reminder_id: reminder.id } });
    if (!queued.error) await supabase.from("notification_reminders").update({ status: "queued" }).eq("id", reminder.id);
  }

  const { data: deliveries, error: deliveryError } = await supabase.from("notification_deliveries").select("*").in("status", ["pending", "failed"]).lte("available_at", now).lt("attempts", 3).order("available_at").limit(20);
  if (deliveryError) return json(500, { error: "delivery_query_failed" });
  let delivered = 0; let failed = 0;
  for (const delivery of deliveries || []) {
    const claimed = await supabase.from("notification_deliveries").update({ status: "processing", locked_at: now, attempts: delivery.attempts + 1, updated_at: now }).eq("id", delivery.id).in("status", ["pending", "failed"]).select("id").maybeSingle();
    if (!claimed.data) continue;
    try {
      const payload = delivery.payload as Record<string, unknown>;
      const destination = new URL(String(payload.href || "/overview"), Deno.env.get("APP_ORIGIN") || "https://scrimstats.gg").toString();
      const result = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "content-type": "application/json" }, body: JSON.stringify({ from: Deno.env.get("NOTIFICATION_FROM") || "ScrimStats <team@scrimstats.gg>", to: [delivery.recipient_email], subject: String(payload.title || "ScrimStats update"), html: `<div style="font-family:Inter,Arial,sans-serif;background:#090e13;color:#eef4f6;padding:32px"><h1 style="font-size:22px">${safe(payload.title)}</h1><p style="color:#aebac1;line-height:1.6">${safe(payload.body)}</p><a href="${safe(destination)}" style="color:#11e2d0">Open ScrimStats</a></div>` }) });
      if (!result.ok) throw new Error(`email_provider_${result.status}`);
      await supabase.from("notification_deliveries").update({ status: "delivered", delivered_at: new Date().toISOString(), locked_at: null, last_error: null, updated_at: new Date().toISOString() }).eq("id", delivery.id); delivered++;
      if (payload.reminder_id) await supabase.from("notification_reminders").update({ status: "sent" }).eq("id", String(payload.reminder_id));
    } catch (error) {
      const terminal = delivery.attempts + 1 >= 3;
      await supabase.from("notification_deliveries").update({ status: "failed", available_at: terminal ? new Date(Date.now() + 86_400_000).toISOString() : new Date(Date.now() + 5 * 60_000 * (delivery.attempts + 1)).toISOString(), locked_at: null, last_error: error instanceof Error ? error.message.slice(0, 300) : "delivery_failed", updated_at: new Date().toISOString() }).eq("id", delivery.id); failed++;
    }
  }
  console.log(JSON.stringify({ event: "notification_worker_complete", reminders: reminders?.length || 0, delivered, failed, correlation_id: crypto.randomUUID() }));
  return json(200, { reminders: reminders?.length || 0, delivered, failed });
});
