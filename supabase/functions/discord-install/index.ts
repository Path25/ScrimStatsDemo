import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import {
  authenticatedUser,
  collectorCorsHeaders,
  discordEntitled,
  json,
  managerMembership,
  randomSecret,
  serviceClient,
  sha256,
} from "../_shared/collector.ts";

const discordApi = "https://discord.com/api/v10";
const defaultAppOrigin = "https://scrimstats.gg";
const approvedAppOrigins = new Set([
  defaultAppOrigin,
  "https://www.scrimstats.gg",
  "https://staging.scrimstats.gg",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
]);

function returnOrigin(request: Request) {
  const origin = request.headers.get("origin") || "";
  return approvedAppOrigins.has(origin) ? origin : defaultAppOrigin;
}

function appRedirect(origin: string, status: string) {
  return new URL(`/integrations?discord=${encodeURIComponent(status)}`, origin).toString();
}

function callbackUrl() {
  return `${Deno.env.get("SUPABASE_URL")}/functions/v1/discord-install`;
}

async function startInstall(request: Request) {
  const user = await authenticatedUser(request);
  if (!user) return json({ error: "Authentication required." }, 401);

  const body = await request.json().catch(() => ({}));
  const tenantId = typeof body.tenant_id === "string" ? body.tenant_id : "";
  if (!tenantId || !(await managerMembership(user.id, tenantId))) {
    return json({ error: "Owner or admin access is required." }, 403);
  }
  if (!(await discordEntitled(tenantId))) return json({ error: "Discord automation is unavailable for this workspace." }, 403);

  const clientId = Deno.env.get("DISCORD_CLIENT_ID");
  if (!clientId) return json({ error: "Discord installation is not configured." }, 503);

  const state = randomSecret();
  const returnUrl = returnOrigin(request);
  const db = serviceClient();
  await db
    .from("discord_oauth_states")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .is("consumed_at", null);

  const { error } = await db.from("discord_oauth_states").insert({
    tenant_id: tenantId,
    user_id: user.id,
    state_hash: await sha256(state),
    return_url: returnUrl,
    expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
  });
  if (error) return json({ error: "Unable to begin Discord installation." }, 500);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl(),
    response_type: "code",
    scope: "bot applications.commands",
    permissions: "19456",
    state,
    integration_type: "0",
  });
  return json({ authorize_url: `https://discord.com/oauth2/authorize?${params}` });
}

async function finishInstall(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return Response.redirect(appRedirect(defaultAppOrigin, "invalid"), 302);

  const clientId = Deno.env.get("DISCORD_CLIENT_ID");
  const clientSecret = Deno.env.get("DISCORD_CLIENT_SECRET");
  if (!clientId || !clientSecret) return Response.redirect(appRedirect(defaultAppOrigin, "unconfigured"), 302);

  const db = serviceClient();
  const stateHash = await sha256(state);
  const { data: oauthState } = await db
    .from("discord_oauth_states")
    .select("id, tenant_id, user_id, return_url, expires_at, consumed_at")
    .eq("state_hash", stateHash)
    .maybeSingle();

  if (
    !oauthState
    || oauthState.consumed_at
    || new Date(oauthState.expires_at).getTime() <= Date.now()
  ) {
    return Response.redirect(appRedirect(oauthState?.return_url || defaultAppOrigin, "expired"), 302);
  }

  const tokenResponse = await fetch(`${discordApi}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl(),
    }),
  });
  const tokenBody = await tokenResponse.json().catch(() => ({}));
  const guildId = typeof tokenBody.guild?.id === "string" ? tokenBody.guild.id : "";
  if (!tokenResponse.ok || !guildId) return Response.redirect(appRedirect(oauthState.return_url, "failed"), 302);

  const consumedAt = new Date().toISOString();
  const { data: claimedState } = await db
    .from("discord_oauth_states")
    .update({ consumed_at: consumedAt })
    .eq("id", oauthState.id)
    .is("consumed_at", null)
    .select("id")
    .maybeSingle();
  if (!claimedState) return Response.redirect(appRedirect(oauthState.return_url, "expired"), 302);

  // The browser is redirected away from Discord during OAuth. Re-check the
  // initiating user's current workspace role after the one-time state is
  // claimed so a removed manager cannot finish an earlier installation flow.
  if (
    !(await discordEntitled(oauthState.tenant_id))
    || !(await managerMembership(oauthState.user_id, oauthState.tenant_id))
  ) {
    return Response.redirect(appRedirect(oauthState.return_url, "unavailable"), 302);
  }

  let guildName = typeof tokenBody.guild?.name === "string" ? tokenBody.guild.name : null;
  const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
  if (botToken && !guildName) {
    const guildResponse = await fetch(`${discordApi}/guilds/${guildId}`, {
      headers: { Authorization: `Bot ${botToken}` },
    });
    const guild = await guildResponse.json().catch(() => ({}));
    guildName = typeof guild.name === "string" ? guild.name : null;
  }

  const { error } = await db.from("discord_installations").upsert(
    {
      tenant_id: oauthState.tenant_id,
      guild_id: guildId,
      guild_name: guildName,
      status: "active",
      installed_by: oauthState.user_id,
      installed_at: consumedAt,
      updated_at: consumedAt,
    },
    { onConflict: "tenant_id" },
  );
  return Response.redirect(appRedirect(oauthState.return_url, error ? "failed" : "connected"), 302);
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: collectorCorsHeaders });
  }
  if (request.method === "POST") return startInstall(request);
  if (request.method === "GET") return finishInstall(request);
  return json({ error: "Method not allowed." }, 405);
});
