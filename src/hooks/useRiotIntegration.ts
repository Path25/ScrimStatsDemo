import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";

type RiotKeyKind = "development" | "personal" | "production";
type RiotActionResponse = {
  integration: {
    tenant_id: string;
    key_kind: RiotKeyKind;
    key_hint: string;
    status: string;
    last_tested_at: string | null;
    last_success_at: string | null;
    last_error_code: string | null;
    last_error_message: string | null;
    updated_at: string;
  } | null;
};

export function useRiotIntegration() {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const queryKey = ["riot-integration", tenant?.id];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!tenant?.id) return null;
      const { data, error } = await supabase
        .from("tenant_riot_integrations")
        .select("tenant_id,key_kind,key_hint,status,last_tested_at,last_success_at,last_error_code,last_error_message,updated_at")
        .eq("tenant_id", tenant.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(tenant?.id),
  });

  const invoke = useMutation({
    mutationFn: async (input: {
      action: "save" | "test" | "remove";
      apiKey?: string;
      keyKind?: RiotKeyKind;
    }) => {
      if (!tenant?.id) throw new Error("A team workspace is required.");
      const { data, error } = await supabase.functions.invoke<RiotActionResponse>(
        "riot-integration",
        { body: { tenantId: tenant.id, ...input } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(queryKey, data?.integration ?? null);
      toast.success(
        variables.action === "remove"
          ? "Riot credential removed"
          : variables.action === "test"
            ? "Riot connection verified"
            : "Riot credential encrypted and connected",
      );
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Riot integration request failed");
    },
  });

  return {
    ...query,
    save: (apiKey: string, keyKind: RiotKeyKind) =>
      invoke.mutateAsync({ action: "save", apiKey, keyKind }),
    test: () => invoke.mutateAsync({ action: "test" }),
    remove: () => invoke.mutateAsync({ action: "remove" }),
    mutating: invoke.isPending,
  };
}
