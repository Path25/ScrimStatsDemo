import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import type { CaptureProfile } from "@/lib/analytics/team-analytics";

export function useCaptureProfile() {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["capture-profile", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return "desktop_manual" as CaptureProfile;
      const { data, error } = await supabase
        .from("tenant_capture_settings")
        .select("profile")
        .eq("tenant_id", tenant.id)
        .maybeSingle();
      if (error) throw error;
      return (data?.profile || "desktop_manual") as CaptureProfile;
    },
    enabled: Boolean(tenant?.id),
  });
  const update = useMutation({
    mutationFn: async (profile: CaptureProfile) => {
      if (!tenant?.id) throw new Error("A workspace is required.");
      const { data, error } = await supabase.rpc("set_workspace_capture_profile", {
        p_tenant_id: tenant.id,
        p_profile: profile,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capture-profile", tenant?.id] });
      queryClient.invalidateQueries({ queryKey: ["team-analytics-v3", tenant?.id] });
      toast.success("Capture profile updated for future games");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Capture profile could not be updated"),
  });
  return {
    profile: query.data || "desktop_manual",
    isLoading: query.isLoading,
    error: query.error,
    updateProfile: update.mutateAsync,
    isUpdating: update.isPending,
  };
}
