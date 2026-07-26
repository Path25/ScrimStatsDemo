import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";

export const discordEventOptions = [
  { key: "schedule_created", label: "Schedule created" },
  { key: "schedule_changed", label: "Schedule changed" },
  { key: "schedule_cancelled", label: "Schedule cancelled" },
  { key: "practice_reminder", label: "Upcoming practice reminder" },
  { key: "availability_reminder", label: "Roster availability reminder" },
  { key: "collector_reminder", label: "Collector readiness reminder" },
] as const;

type DiscordChannel = {
  id: string;
  name: string;
  position: number;
};

type ChannelResponse = {
  guild: { id: string; name: string | null };
  channels: DiscordChannel[];
};

export function useDiscordIntegration(enabled = true) {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const key = ["discord-integration", tenant?.id];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      if (!tenant?.id) {
        return { installation: null, subscriptions: [], events: [], attempts: [] };
      }
      const [installation, subscriptions, events, attempts] = await Promise.all([
        supabase
          .from("discord_installations")
          .select("*")
          .eq("tenant_id", tenant.id)
          .maybeSingle(),
        supabase
          .from("discord_channel_subscriptions")
          .select("*")
          .eq("tenant_id", tenant.id)
          .order("event_type"),
        supabase
          .from("integration_events")
          .select("*")
          .eq("tenant_id", tenant.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("integration_delivery_attempts")
          .select("*")
          .eq("tenant_id", tenant.id)
          .order("attempted_at", { ascending: false })
          .limit(20),
      ]);
      const firstError = [
        installation.error,
        subscriptions.error,
        events.error,
        attempts.error,
      ].find(Boolean);
      if (firstError) throw firstError;
      return {
        installation: installation.data,
        subscriptions: subscriptions.data || [],
        events: events.data || [],
        attempts: attempts.data || [],
      };
    },
    enabled: Boolean(tenant?.id) && enabled,
  });

  const channels = useQuery({
    queryKey: ["discord-channels", tenant?.id, query.data?.installation?.guild_id],
    queryFn: async () => {
      if (!tenant?.id) return null;
      const { data, error } = await supabase.functions.invoke<ChannelResponse>(
        "discord-channels",
        { body: { tenant_id: tenant.id } },
      );
      if (error) throw error;
      return data;
    },
    enabled:
      Boolean(tenant?.id && query.data?.installation?.status === "active")
      && enabled,
  });

  const beginInstallation = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error("A team workspace is required.");
      const { data, error } = await supabase.functions.invoke<{ authorize_url: string }>(
        "discord-install",
        { body: { tenant_id: tenant.id } },
      );
      if (error || !data?.authorize_url) {
        throw error || new Error("Discord installation could not be started.");
      }
      return data.authorize_url;
    },
  });

  const configure = useMutation({
    mutationFn: async (input: {
      channelId: string;
      channelName: string;
      eventTypes: string[];
    }) => {
      if (!tenant?.id) throw new Error("A team workspace is required.");
      const { error } = await supabase.rpc("configure_discord_channel", {
        p_tenant_id: tenant.id,
        p_channel_id: input.channelId,
        p_channel_name: input.channelName,
        p_event_types: input.eventTypes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      toast.success("Discord reminder settings saved");
    },
  });

  const disconnect = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error("A team workspace is required.");
      const { error } = await supabase.rpc("disconnect_discord_installation", {
        p_tenant_id: tenant.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.removeQueries({ queryKey: ["discord-channels", tenant?.id] });
      toast.success("Discord disconnected");
    },
  });

  return {
    ...query,
    channels: channels.data?.channels || [],
    channelsLoading: channels.isLoading,
    channelsError: channels.error,
    refetchChannels: channels.refetch,
    beginInstallation: beginInstallation.mutateAsync,
    installing: beginInstallation.isPending,
    configure: configure.mutateAsync,
    configuring: configure.isPending,
    disconnect: disconnect.mutateAsync,
    disconnecting: disconnect.isPending,
  };
}
