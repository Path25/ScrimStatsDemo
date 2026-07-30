import { useEffect, useMemo, useState } from "react";
import { Bot, CheckCircle2, Clock3, MessageSquareText, PlugZap, RefreshCw, ShieldAlert, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataSurface } from "@/components/workspace/DataSurface";
import { WorkspaceState } from "@/components/workspace/WorkspaceState";
import { discordEventTypes, type DiscordChannel, type DiscordEventType, useDiscordIntegration } from "@/hooks/useDiscordIntegration";

const eventLabels: Record<DiscordEventType, string> = {
  schedule_created: "New practice blocks",
  schedule_changed: "Schedule changes",
  schedule_cancelled: "Cancellations",
  practice_reminder: "Practice reminders",
};

function toggle(events: DiscordEventType[], event: DiscordEventType, checked: boolean) {
  return checked ? [...new Set([...events, event])] : events.filter((value) => value !== event);
}

export function DiscordScheduleIntegration() {
  const discord = useDiscordIntegration();
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [events, setEvents] = useState<DiscordEventType[]>([]);
  const installation = discord.data?.installation;
  const subscriptions = useMemo(() => discord.data?.subscriptions ?? [], [discord.data?.subscriptions]);

  useEffect(() => {
    if (!subscriptions.length) return;
    const channelId = subscriptions[0].channel_id;
    setSelectedChannelId(channelId);
    setEvents(subscriptions.filter((subscription) => subscription.channel_id === channelId).map((subscription) => subscription.event_type));
  }, [installation?.id, subscriptions]);

  const selectedChannel = useMemo(() => channels.find((channel) => channel.id === selectedChannelId), [channels, selectedChannelId]);

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
              <span className={`ss-mono border px-2 py-1 text-[11px] uppercase tracking-[0.16em] ${installation ? "border-[var(--workspace-success)]/35 bg-[var(--workspace-success)]/10 text-[var(--workspace-success)]" : "border-[#8994ff]/35 bg-[#8994ff]/10 text-[#aeb5ff]"}`}>{installation ? "Connected" : "Setup required"}</span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--workspace-muted)]">Discord carries selected schedule changes and practice reminders back to ScrimStats. It never relays scouting, review, player, or credential content.</p>
          </div>
        </div>
      </div>

      {!installation ? (
        <div className="p-5"><div className="flex items-start gap-3 border-l-2 border-[var(--workspace-awaiting)] pl-4"><PlugZap className="mt-0.5 h-5 w-5 text-[var(--workspace-awaiting)]" aria-hidden="true" /><div><p className="font-medium">Connect your team server</p><p className="mt-1 text-sm leading-6 text-[var(--workspace-muted)]">Choose the Discord server where approved schedule prompts should appear. You can select a channel and prompt types after connection.</p><Button className="mt-4" disabled={discord.isMutating} onClick={() => void discord.beginInstall().catch(() => undefined)}><PlugZap className="h-4 w-4" />Connect Discord</Button></div></div></div>
      ) : (
        <div className="grid gap-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--workspace-rule)] pb-5"><div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-[var(--workspace-success)]" aria-hidden="true" /><div><p className="font-medium">{installation.guild_name || "Connected Discord server"}</p><p className="mt-1 text-xs text-[var(--workspace-subtle)]">Schedule prompts are limited to channels you select below.</p></div></div><Button variant="outline" disabled={discord.isMutating} onClick={() => void discord.disconnect().catch(() => undefined)}><Trash2 className="h-4 w-4" />Disconnect</Button></div>
          <div className="grid gap-3"><div className="flex flex-wrap items-center justify-between gap-2"><Label htmlFor="discord-channel">Delivery channel</Label><Button variant="ghost" size="sm" disabled={discord.isMutating} onClick={() => void loadChannels().catch(() => undefined)}><RefreshCw className="h-4 w-4" />Refresh channels</Button></div><Select value={selectedChannelId} onValueChange={setSelectedChannelId} disabled={discord.isMutating || !channels.length}><SelectTrigger id="discord-channel"><SelectValue placeholder={channels.length ? "Choose a Discord channel" : "Refresh channels to choose one"} /></SelectTrigger><SelectContent>{channels.map((channel) => <SelectItem key={channel.id} value={channel.id}>#{channel.name}</SelectItem>)}</SelectContent></Select>{!channels.length && <p className="text-xs text-[var(--workspace-subtle)]">Load the channels available to the connected Discord bot before saving delivery prompts.</p>}</div>
          <fieldset className="grid gap-3"><legend className="text-sm font-medium">Send prompts for</legend><div className="grid gap-2 sm:grid-cols-2">{discordEventTypes.map((event) => <label key={event} className="flex min-h-10 items-center gap-3 border border-[var(--workspace-rule)] px-3 text-sm"><Checkbox checked={events.includes(event)} disabled={discord.isMutating} onCheckedChange={(checked) => setEvents((current) => toggle(current, event, checked === true))} />{eventLabels[event]}</label>)}</div></fieldset>
          <div className="flex flex-wrap items-center gap-3"><Button disabled={discord.isMutating || !selectedChannel || events.length === 0} onClick={() => selectedChannel && void discord.configure({ channelId: selectedChannel.id, channelName: selectedChannel.name, eventTypes: events }).catch(() => undefined)}><MessageSquareText className="h-4 w-4" />Save schedule prompts</Button>{subscriptions.length > 0 && <p className="text-xs text-[var(--workspace-subtle)]">{subscriptions.length} selected prompt{subscriptions.length === 1 ? "" : "s"} active.</p>}</div>
          <div className="flex gap-3 border-l-2 border-[var(--workspace-rule-strong)] pl-4 text-sm leading-6 text-[var(--workspace-muted)]"><Clock3 className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />Practice reminders and schedule changes link teammates back to ScrimStats. Message delivery is tracked separately from this configuration.</div>
        </div>
      )}
    </DataSurface>
  );
}
