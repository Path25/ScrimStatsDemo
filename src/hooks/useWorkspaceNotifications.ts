import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type WorkspaceNotification = Database["public"]["Tables"]["workspace_notifications"]["Row"];
export type NotificationPreference = Database["public"]["Tables"]["notification_preferences"]["Row"];

export function useWorkspaceNotifications() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["workspace-notifications", tenant?.id, user?.id],
    enabled: Boolean(tenant?.id && user?.id),
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspace_notifications")
        .select("*")
        .eq("tenant_id", tenant!.id)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });
  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workspace_notifications").update({ read_at: new Date().toISOString() }).eq("id", id).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["workspace-notifications"] }),
  });
  return { notifications: query.data || [], unread: (query.data || []).filter((item) => !item.read_at).length, isLoading: query.isLoading, error: query.error, markRead: markRead.mutateAsync };
}

export function useNotificationPreferences() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["notification-preferences", tenant?.id, user?.id],
    enabled: Boolean(tenant?.id && user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.from("notification_preferences").select("*").eq("tenant_id", tenant!.id).eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const save = useMutation({
    mutationFn: async (input: Pick<NotificationPreference, "email_enabled" | "in_app_enabled" | "schedule_enabled" | "coaching_enabled" | "integration_enabled" | "reminder_24h" | "reminder_2h">) => {
      const { error } = await supabase.from("notification_preferences").upsert({ tenant_id: tenant!.id, user_id: user!.id, ...input, updated_at: new Date().toISOString() }, { onConflict: "tenant_id,user_id" });
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notification-preferences"] }),
  });
  return { preferences: query.data, isLoading: query.isLoading, error: query.error, save: save.mutateAsync, isSaving: save.isPending };
}
