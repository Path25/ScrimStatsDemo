import {
  authenticatedUser,
  json,
  managerMembership,
  serviceClient,
} from "../_shared/collector.ts";

type Input = {
  action?: "save" | "test" | "remove";
  tenantId?: string;
  apiKey?: string;
  keyKind?: "development" | "personal" | "production";
};

async function testKey(apiKey: string) {
  const response = await fetch(
    "https://euw1.api.riotgames.com/lol/status/v4/platform-data",
    { headers: { "X-Riot-Token": apiKey } },
  );
  if (!response.ok) {
    const error = new Error(
      response.status === 401 || response.status === 403
        ? "Riot rejected this API key."
        : response.status === 429
          ? "This Riot API key is currently rate limited."
          : "Riot could not validate this API key.",
    );
    Object.assign(error, { status: response.status });
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const user = await authenticatedUser(req);
  if (!user) return json({ error: "Authentication is required." }, 401);
  const input = await req.json().catch(() => ({})) as Input;
  if (!input.tenantId || !input.action) {
    return json({ error: "Tenant and action are required." }, 400);
  }
  if (!await managerMembership(user.id, input.tenantId)) {
    return json({ error: "Owner or admin access is required." }, 403);
  }

  const admin = serviceClient();
  try {
    if (input.action === "remove") {
      const { error } = await admin.rpc("remove_tenant_riot_api_key", {
        p_tenant_id: input.tenantId,
      });
      if (error) throw error;
      return json({ integration: null });
    }

    let apiKey = input.apiKey?.trim();
    if (input.action === "test" && !apiKey) {
      const { data, error } = await admin.rpc("get_tenant_riot_api_key", {
        p_tenant_id: input.tenantId,
      });
      if (error) throw error;
      apiKey = data || undefined;
    }
    if (!apiKey) return json({ error: "A Riot API key is required." }, 400);

    await testKey(apiKey);
    if (input.action === "test") {
      await admin.from("tenant_riot_integrations").update({
        status: "active",
        last_tested_at: new Date().toISOString(),
        last_success_at: new Date().toISOString(),
        last_error_code: null,
        last_error_message: null,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }).eq("tenant_id", input.tenantId);
    } else {
      const { error } = await admin.rpc("store_tenant_riot_api_key", {
        p_tenant_id: input.tenantId,
        p_api_key: apiKey,
        p_key_kind: input.keyKind || "development",
        p_actor_id: user.id,
      });
      if (error) throw error;
    }

    const { data: integration, error: readError } = await admin
      .from("tenant_riot_integrations")
      .select("tenant_id,key_kind,key_hint,status,last_tested_at,last_success_at,last_error_code,last_error_message,updated_at")
      .eq("tenant_id", input.tenantId)
      .maybeSingle();
    if (readError) throw readError;
    return json({ integration });
  } catch (reason) {
    const status = Number((reason as { status?: number }).status || 0);
    await admin.from("tenant_riot_integrations").update({
      status: status === 429 ? "rate_limited" : "invalid",
      last_tested_at: new Date().toISOString(),
      last_error_code: status ? String(status) : "validation_failed",
      last_error_message: reason instanceof Error
        ? reason.message.slice(0, 240)
        : "Riot validation failed.",
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }).eq("tenant_id", input.tenantId);
    return json({
      error: reason instanceof Error ? reason.message : "Riot validation failed.",
    }, status === 429 ? 429 : 400);
  }
});
