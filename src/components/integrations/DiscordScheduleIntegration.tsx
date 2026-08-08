import { useEffect, useMemo, useState } from "react";
import { Bot, CheckCircle2, Clock3, MessageSquareText, PlugZap, RefreshCw, ShieldAlert, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataSurface } from "@/components/workspace/DataSurface";
import { WorkspaceState } from "@/components/workspace/WorkspaceState";
import { discordEventTypes, type DiscordChannel, type DiscordDeliveryHealthState, type DiscordEventType, type DiscordRole, useDiscordIntegration } from "@/hooks/useDiscordIntegration";

const eventLabels: Record<DiscordEventType, string> = {
  schedule_created: "New practice blocks",
  schedule_changed: "Schedule changes",
  schedule_cancelled: "Cancellations",
  practice_reminder: "Practice reminders",
};

const healthPresentation: Record<DiscordDeliveryHealthState, { label: string; description: string; tone: string }> = {
  setup_required: { label: "Setup required", description: "No Discord server is connected to this workspace.", tone: "border-[var(--workspace-awaiting)]/35 bg-[var(--workspace-awaiting)]/10 text-[var(--workspace-awaiting)]" },
  connected: { label: "Connected - prompts off", description: "The server is connected, but no schedule prompts are configured.", tone: "border-[#8994ff]/35 bg-[#8994ff]/10 text-[#aeb5ff]" },
  configured: { label: "Configured - pilot access", description: "Schedule prompts are configured for this approved pilot workspace. Delivery status is tracked separately.", tone: "border-[#8994ff]/35 bg-[#8994ff]/10 text-[#aeb5ff]" },
  queued: { label: "Queued - awaiting delivery", description: "A schedule prompt is queued. This is not delivery confirmation.", tone: "border-[var(--workspace-awaiting)]/35 bg-[var(--workspace-awaiting)]/10 text-[var(--workspace-awaiting)]" },
  retrying: { label: "Retrying delivery", description: "The latest attempt failed and is retained for a bounded retry.", tone: "border-[var(--workspace-awaiting)]/35 bg-[var(--workspace-awaiting)]/10 text-[var(--workspace-awaiting)]" },
  failed: { label: "Delivery needs attention", description: "The latest prompt exhausted its retries. Its evidence has been retained for support review.", tone: "border-[var(--workspace-danger)]/35 bg-[var(--workspace-danger)]/10 text-[var(--workspace-danger)]" },
  delivered: { label: "Last delivery recorded", description: "A provider receipt exists for the latest prompt. This does not confirm how Discord rendered it.", tone: "border-[var(--workspace-success)]/35 bg-[var(--workspace-success)]/10 text-[var(--workspace-success)]" },
  disconnected: { label: "Disconnected", description: "Discord prompts are disabled for this workspace. Historical evidence is retained.", tone: "border-[var(--workspace-rule-strong)] bg-[var(--workspace-surface)] text-[var(--workspace-subtle)]" },
};

function toggle<T extends string>(events: T[], event: T, checked: boolean) {
  return checked ? [...new Set([...events, event])] : events.filter((value) => value !== event);
}

export function DiscordScheduleIntegration() {
  const discord = useDiscordIntegration();
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [events, setEvents] = useState<DiscordEventType[]>([]);
  const [roles, setRoles] = useState<DiscordRole[]>([]);
  const [permittedRoleIds, setPermittedRoleIds] = useState<string[]>([]);
  const installation = discord.data?.installation;
  const subscriptions = useMemo(() => discord.data?.subscriptions ?? [], [discord.data?.subscriptions]);
  const deliveryConfigured = subscriptions.length > 0;
  const permittedRoles = useMemo(() => discord.data?.permitted_roles ?? [], [discord.data?.permitted_roles]);
  const deliveryHealthState: DiscordDeliveryHealthState = discord.data?.delivery_health?.state
    ?? (installation ? (deliveryConfigured ? "configured" : "connected") : "setup_required");
  const deliveryHealth = healthPresentation[deliveryHealthState];

  useEffect(() => {
    if (!subscriptions.length) return;
    const channelId = subscriptions[0].channel_id;
    setSelectedChannelId(channelId);
    setEvents(subscriptions.filter((subscription) => subscription.channel_id === channelId).map((subscription) => subscription.event_type));
  }, [installation?.id, subscriptions]);

  useEffect(() => setPermittedRoleIds(permittedRoles.map((role) => role.role_id)), [installation?.id, permittedRoles]);

  const selectedChannel = useMemo(() => channels.find((channel) => channel.id === selectedChannelId), [channels, selectedChannelId]);
  const loadRoles = async () => setRoles(await discord.loadRoles());

  if (discord.isLoading) return <WorkspaceState icon={Bot} title="Loading Discord delivery…" description="Checking this workspace's Discord connection." />;
  if (discord.error) return <WorkspaceState icon={ShieldAlert} title="Discord delivery unavailable" description="The Discord connection could not be checked. Try again, or contact support if the problem continues." />;

  const loadChannels = async () => {
    const nextChannels = await discord.loadChannels();
    setChannels(nextChannels);
    if (!selectedChannelId && nextChannels[0]) setSelectedChannelId(nextChannels[0].id);
  };

  return (
    <DataSurface className="overflow-hidden">
      <div className="border-b border-[var(--workspace-rule)] p-5">
        <div className="flex items-start gap-3">
          <Bot className="mt-0.5 h-5 w-5 text-[#8994ff]" aria-hidden="true" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">Discord delivery</h3>
              <span className={`ss-mono border px-2 py-1 text-[11px] uppercase tracking-[0.16em] ${deliveryHealth.tone}`}>{deliveryHealth.label}</span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--workspace-muted)]">Discord carries selected schedule changes and practice reminders back to ScrimStats. It never relays scouting, review, player, or credential content.</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--workspace-muted)]">{deliveryHealth.description}</p>
            <p className="mt-2 max-w-2xl border-l-2 border-[var(--workspace-awaiting)] pl-3 text-xs leading-5 text-[var(--workspace-subtle)]">Pilot access. Discord delivery is available only to named Elite pilot workspaces. This is not general availability.</p>
          </div>
        </div>
      </div>

      {!installation ? (
        <div className="p-5"><div className="flex items-start gap-3 border-l-2 border-[var(--workspace-awaiting)] pl-4"><PlugZap className="mt-0.5 h-5 w-5 text-[var(--workspace-awaiting)]" aria-hidden="true" /><div><p className="font-medium">Connect your team server</p><p className="mt-1 text-sm leading-6 text-[var(--workspace-muted)]">Choose the Discord server where approved schedule prompts should appear. You can select a channel and prompt types after connection.</p><Button className="mt-4" disabled={discord.isMutating} onClick={() => void discord.beginInstall().catch(() => undefined)}><PlugZap className="h-4 w-4" />Connect Discord</Button></div></div></div>
      ) : (
        <div className="grid gap-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--workspace-rule)] pb-5"><div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-[var(--workspace-success)]" aria-hidden="true" /><div><p className="font-medium">{installation.guild_name || "Connected Discord server"}</p><p className="mt-1 text-xs text-[var(--workspace-subtle)]">{deliveryConfigured ? "Schedule prompts are saved for this workspace's approved pilot channels." : "Server connected - choose a channel and prompts for this approved pilot workspace."}</p></div></div><Button variant="outline" disabled={discord.isMutating} onClick={() => void discord.disconnect().catch(() => undefined)}><Trash2 className="h-4 w-4" />Disconnect</Button></div>
          <div className="grid gap-3"><div className="flex flex-wrap items-center justify-between gap-2"><Label htmlFor="discord-channel">Delivery channel</Label><Button variant="ghost" size="sm" disabled={discord.isMutating} onClick={() => void loadChannels().catch(() => undefined)}><RefreshCw className="h-4 w-4" />Refresh channels</Button></div><Select value={selectedChannelId} onValueChange={setSelectedChannelId} disabled={discord.isMutating || !channels.length}><SelectTrigger id="discord-channel"><SelectValue placeholder={channels.length ? "Choose a Discord channel" : "Refresh channels to choose one"} /></SelectTrigger><SelectContent>{channels.map((channel) => <SelectItem key={channel.id} value={channel.id}>#{channel.name}</SelectItem>)}</SelectContent></Select>{!channels.length && <p className="text-xs text-[var(--workspace-subtle)]">Load the channels available to the connected Discord bot before saving delivery prompts.</p>}</div>
          <fieldset className="grid gap-3 border-t border-[var(--workspace-rule)] pt-5"><div className="flex flex-wrap items-center justify-between gap-2"><legend className="text-sm font-medium">Who can use /scrim</legend><Button variant="ghost" size="sm" disabled={discord.isMutating} onClick={() => void loadRoles().catch(() => undefined)}><RefreshCw className="h-4 w-4" />Load Discord roles</Button></div><p className="text-sm leading-6 text-[var(--workspace-muted)]">Only members with a selected Discord role can create a practice block. Clear every role and save to disable the command. The command remains unavailable for this schedule-delivery pilot unless separately approved.</p>{roles.length > 0 ? <div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">{roles.map((role) => <label key={role.id} className="flex min-h-10 items-center gap-3 border border-[var(--workspace-rule)] px-3 text-sm"><Checkbox checked={permittedRoleIds.includes(role.id)} disabled={discord.isMutating} onCheckedChange={(checked) => setPermittedRoleIds((current) => toggle(current, role.id, checked === true))} />{role.name}</label>)}</div> : <p className="text-xs text-[var(--workspace-subtle)]">Load roles to set the permitted staff group. Saved roles: {permittedRoles.length || "none"}.</p>}<div><Button disabled={discord.isMutating || roles.length === 0} onClick={() => void discord.configurePermittedRoles(roles.filter((role) => permittedRoleIds.includes(role.id)).map(({ id, name }) => ({ id, name }))).catch(() => undefined)}><ShieldAlert className="h-4 w-4" />Save /scrim roles</Button></div></fieldset>
          <fieldset className="grid gap-3"><legend className="text-sm font-medium">Send prompts for</legend><div className="grid gap-2 sm:grid-cols-2">{discordEventTypes.map((event) => <label key={event} className="flex min-h-10 items-center gap-3 border border-[var(--workspace-rule)] px-3 text-sm"><Checkbox checked={events.includes(event)} disabled={discord.isMutating} onCheckedChange={(checked) => setEvents((current) => toggle(current, event, checked === true))} />{eventLabels[event]}</label>)}</div></fieldset>
          <div className="flex flex-wrap items-center gap-3"><Button disabled={discord.isMutating || !selectedChannel || events.length === 0} onClick={() => selectedChannel && void discord.configure({ channelId: selectedChannel.id, channelName: selectedChannel.name, eventTypes: events }).catch(() => undefined)}><MessageSquareText className="h-4 w-4" />Save schedule prompts</Button>{subscriptions.length > 0 && <p className="text-xs text-[var(--workspace-subtle)]">{subscriptions.length} prompt type{subscriptions.length === 1 ? "" : "s"} configured for pilot access.</p>}</div>
          <div className="flex gap-3 border-l-2 border-[var(--workspace-rule-strong)] pl-4 text-sm leading-6 text-[var(--workspace-muted)]"><Clock3 className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />Practice reminders and schedule changes link teammates back to ScrimStats. Message delivery is tracked separately from this configuration.</div>
        </div>
      )}
    </DataSurface>
  );
}
