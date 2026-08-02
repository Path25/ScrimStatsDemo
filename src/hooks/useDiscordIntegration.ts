import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";

export const discordEventTypes = ["schedule_created", "schedule_changed", "schedule_cancelled", "practice_reminder"] as const;
export type DiscordEventType = typeof discordEventTypes[number];

export type DiscordChannel = { id: string; name: string; position: number };
export type DiscordRole = { id: string; name: string; position: number };
export type DiscordStatus = {
  installation: { id: string; guild_id: string; guild_name: string | null; status: string; installed_at: string | null } | null;
  subscriptions: Array<{ channel_id: string; channel_name: string | null; event_type: DiscordEventType; enabled: boolean }>;
  permitted_roles: Array<{ role_id: string; role_name: string | null }>;
};

function message(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function useDiscordIntegration() {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const queryKey = ["discord-integration", tenant?.id];

  const status = useQuery({
    queryKey,
    queryFn: async () => {
      if (!tenant?.id) return null;
      const { data, error } = await supabase.functions.invoke<DiscordStatus>("discord-config", {
        body: { tenant_id: tenant.id, action: "status" },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(tenant?.id),
  });

  const install = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error("A team workspace is required.");
      const { data, error } = await supabase.functions.invoke<{ authorize_url?: string }>("discord-install", {
        body: { tenant_id: tenant.id },
      });
      if (error) throw error;
      if (!data?.authorize_url) throw new Error("Discord installation could not be started.");
      return data.authorize_url;
    },
    onError: (error) => toast.error(message(error, "Discord installation could not be started.")),
  });

  const channels = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error("A team workspace is required.");
      const { data, error } = await supabase.functions.invoke<{ channels?: DiscordChannel[] }>("discord-channels", {
        body: { tenant_id: tenant.id },
      });
      if (error) throw error;
      return data?.channels || [];
    },
    onError: (error) => toast.error(message(error, "Discord channels could not be loaded.")),
  });

  const roles = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error("A team workspace is required.");
      const { data, error } = await supabase.functions.invoke<{ roles?: DiscordRole[] }>("discord-roles", {
        body: { tenant_id: tenant.id },
      });
      if (error) throw error;
      return data?.roles || [];
    },
    onError: (error) => toast.error(message(error, "Discord roles could not be loaded.")),
  });

  const configure = useMutation({
    mutationFn: async (input: { channelId: string; channelName: string; eventTypes: DiscordEventType[] }) => {
      if (!tenant?.id) throw new Error("A team workspace is required.");
      const { error } = await supabase.functions.invoke("discord-config", {
        body: { tenant_id: tenant.id, action: "configure", channel_id: input.channelId, channel_name: input.channelName, event_types: input.eventTypes },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      toast.success("Discord schedule prompts saved.");
    },
    onError: (error) => toast.error(message(error, "Discord schedule prompts could not be saved.")),
  });

  const disconnect = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error("A team workspace is required.");
      const { error } = await supabase.functions.invoke("discord-config", {
        body: { tenant_id: tenant.id, action: "disconnect" },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      toast.success("Discord delivery disconnected.");
    },
    onError: (error) => toast.error(message(error, "Discord delivery could not be disconnected.")),
  });

  const configurePermittedRoles = useMutation({
    mutationFn: async (input: Array<{ id: string; name: string }>) => {
      if (!tenant?.id) throw new Error("A team workspace is required.");
      const { error } = await supabase.functions.invoke("discord-config", {
        body: { tenant_id: tenant.id, action: "set_permitted_roles", roles: input },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      toast.success("Discord command roles saved.");
    },
    onError: (error) => toast.error(message(error, "Discord command roles could not be saved.")),
  });

  return {
    ...status,
    beginInstall: async () => {
      const authorizeUrl = await install.mutateAsync();
      window.location.assign(authorizeUrl);
    },
    loadChannels: () => channels.mutateAsync(),
    loadRoles: () => roles.mutateAsync(),
    configure: (input: { channelId: string; channelName: string; eventTypes: DiscordEventType[] }) => configure.mutateAsync(input),
    configurePermittedRoles: (input: Array<{ id: string; name: string }>) => configurePermittedRoles.mutateAsync(input),
    disconnect: () => disconnect.mutateAsync(),
    isMutating: install.isPending || channels.isPending || roles.isPending || configure.isPending || configurePermittedRoles.isPending || disconnect.isPending,
  };
}
