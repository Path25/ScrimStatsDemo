import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bot, CheckCircle2, ExternalLink, RefreshCw, Unplug } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { DataSurface } from "@/components/workspace/DataSurface";
import { WorkspaceState } from "@/components/workspace/WorkspaceState";
import {
  discordEventOptions,
  useDiscordIntegration,
} from "@/hooks/useDiscordIntegration";

export function DiscordScheduleIntegration() {
  const [searchParams, setSearchParams] = useSearchParams();
  const discord = useDiscordIntegration();
  const installation = discord.data?.installation;
  const subscriptions = useMemo(
    () => discord.data?.subscriptions || [],
    [discord.data?.subscriptions],
  );
  const refetchIntegration = discord.refetch;
  const [channelId, setChannelId] = useState("");
  const [eventTypes, setEventTypes] = useState<string[]>([]);

  const savedChannelId = subscriptions[0]?.channel_id || "";
  const savedEventTypes = useMemo(
    () => subscriptions.filter((item) => item.enabled).map((item) => item.event_type),
    [subscriptions],
  );

  useEffect(() => {
    setChannelId(savedChannelId);
    setEventTypes(savedEventTypes);
  }, [savedChannelId, savedEventTypes]);

  const callbackStatus = searchParams.get("discord");
  useEffect(() => {
    if (!callbackStatus) return;
    void refetchIntegration();
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("discord");
      return next;
    }, { replace: true });
  }, [callbackStatus, refetchIntegration, setSearchParams]);

  async function install() {
    const authorizeUrl = await discord.beginInstallation();
    window.location.assign(authorizeUrl);
  }

  function toggleEvent(eventType: string) {
    setEventTypes((current) =>
      current.includes(eventType)
        ? current.filter((item) => item !== eventType)
        : [...current, eventType],
    );
  }

  async function save() {
    const channel = discord.channels.find((item) => item.id === channelId);
    if (!channel) return;
    await discord.configure({
      channelId,
      channelName: channel.name,
      eventTypes,
    });
  }

  if (discord.isLoading) {
    return (
      <WorkspaceState
        icon={Bot}
        title="Loading Discord connection…"
        description="Checking installation and delivery state."
      />
    );
  }

  if (discord.error) {
    return (
      <WorkspaceState
        icon={AlertTriangle}
        title="Discord integration unavailable"
        description="The Discord database contract or Edge Functions have not been deployed yet."
      />
    );
  }

  if (!installation || installation.status !== "active") {
    return (
      <DataSurface className="p-5">
        <div className="flex items-start gap-3">
          <Bot className="mt-0.5 h-5 w-5 text-[#8994ff]" />
          <div className="flex-1">
            <h3 className="font-semibold">Install the ScrimStats Discord application</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--workspace-muted)]">
              Add the bot to one team server, then choose an approved text channel and the scheduling events it may receive.
            </p>
            {callbackStatus && callbackStatus !== "connected" && (
              <p className="mt-3 text-sm text-[var(--workspace-destructive)]">
                Discord returned “{callbackStatus}”. Start a fresh installation and try again.
              </p>
            )}
            <Button className="mt-5" onClick={() => void install()} disabled={discord.installing}>
              {discord.installing ? "Opening Discord…" : "Install Discord application"}
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DataSurface>
    );
  }

  return (
    <DataSurface>
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--workspace-rule)] p-5 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--workspace-success)]" />
          <div>
            <h3 className="font-semibold">{installation.guild_name || "Connected Discord server"}</h3>
            <p className="mt-1 text-sm text-[var(--workspace-muted)]">
              Installation active. ScrimStats remains the source of truth.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void discord.disconnect()}
          disabled={discord.disconnecting}
        >
          <Unplug className="h-4 w-4" /> Disconnect
        </Button>
      </div>

      <div className="grid gap-6 p-5">
        <div className="grid gap-2">
          <label htmlFor="discord-channel" className="text-sm font-medium">
            Approved notification channel
          </label>
          <div className="flex gap-2">
            <select
              id="discord-channel"
              value={channelId}
              onChange={(event) => setChannelId(event.target.value)}
              className="h-10 flex-1 border border-input bg-background px-3 text-sm"
            >
              <option value="">Select a text channel</option>
              {discord.channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  #{channel.name}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="icon"
              aria-label="Reload Discord channels"
              onClick={() => void discord.refetchChannels()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          {discord.channelsError && (
            <p className="text-sm text-destructive">Channels could not be loaded. Confirm the bot remains in the server.</p>
          )}
        </div>

        <fieldset>
          <legend className="text-sm font-medium">Allowed reminders</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {discordEventOptions.map((event) => (
              <label key={event.key} className="flex cursor-pointer items-center gap-3 border border-[var(--workspace-rule)] px-3 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={eventTypes.includes(event.key)}
                  onChange={() => toggleEvent(event.key)}
                />
                {event.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex justify-end">
          <Button
            onClick={() => void save()}
            disabled={!channelId || !eventTypes.length || discord.configuring}
          >
            {discord.configuring ? "Saving…" : "Save Discord reminders"}
          </Button>
        </div>
      </div>

      {(discord.data?.events.length || 0) > 0 && (
        <div className="border-t border-[var(--workspace-rule)]">
          <div className="border-b border-[var(--workspace-rule)] px-5 py-3">
            <p className="workspace-eyebrow">Recent delivery state</p>
          </div>
          <div className="divide-y divide-[var(--workspace-rule)]">
            {discord.data?.events.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                <span>{event.event_type.replaceAll("_", " ")}</span>
                <span className="ss-mono text-xs uppercase text-[var(--workspace-subtle)]">
                  {event.status}
                  {event.attempt_count ? ` · ${event.attempt_count} retries` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </DataSurface>
  );
}
