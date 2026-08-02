import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import {
  authenticatedUser,
  collectorCorsHeaders,
  discordEntitled,
  json,
  managerMembership,
  serviceClient,
} from "../_shared/collector.ts";

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: collectorCorsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const user = await authenticatedUser(request);
  if (!user) return json({ error: "Authentication required." }, 401);
  const body = await request.json().catch(() => ({}));
  const tenantId = typeof body.tenant_id === "string" ? body.tenant_id : "";
  if (!tenantId || !(await managerMembership(user.id, tenantId))) return json({ error: "Owner or admin access is required." }, 403);
  if (!(await discordEntitled(tenantId))) return json({ error: "Discord automation is unavailable for this workspace." }, 403);

  const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
  if (!botToken) return json({ error: "Discord role discovery is not configured." }, 503);
  const db = serviceClient();
  const { data: installation } = await db.from("discord_installations")
    .select("guild_id").eq("tenant_id", tenantId).eq("status", "active").maybeSingle();
  if (!installation) return json({ error: "No active Discord installation." }, 404);

  const response = await fetch(`https://discord.com/api/v10/guilds/${installation.guild_id}/roles`, {
    headers: { Authorization: `Bot ${botToken}` },
  });
  const roles = await response.json().catch(() => []);
  if (!response.ok || !Array.isArray(roles)) return json({ error: "Discord roles could not be loaded." }, 502);
  return json({ roles: roles.filter((role) => role && role.id !== installation.guild_id && !role.managed)
    .map((role) => ({ id: String(role.id), name: typeof role.name === "string" ? role.name : "unnamed-role", position: typeof role.position === "number" ? role.position : 0 }))
    .sort((left, right) => right.position - left.position) });
});
