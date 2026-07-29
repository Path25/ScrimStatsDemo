import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type OpsData = {
  operator: { display_name: string | null };
  requests: Array<{ id: string; contact_name: string; email: string; team_name: string; message: string | null; status: string; created_at: string }>;
  tenants: Array<{ id: string; name: string; slug: string; created_at: string; settings: Record<string, unknown> | null }>;
  invitations: Array<{ id: string; tenant_id: string; email: string; role: string; delivery_status: string; delivery_error: string | null; expires_at: string }>;
  deliveries: Array<{ id: string; tenant_id: string; recipient_email: string | null; template_key: string; status: string; attempts: number; last_error: string | null; created_at: string }>;
  checklists: Array<{ id: string; tenant_id: string; label: string; status: string; note: string | null }>;
  supportCases: Array<{ id: string; tenant_id: string | null; subject: string; description: string; priority: string; status: string; created_at: string }>;
};

export type FunnelPeriod = "last_30_days" | "last_90_days";
export type FunnelScorecard = {
  instrumentation_started_at: string;
  period: { key: FunnelPeriod; starts_at: string; ends_at: string };
  milestones: Array<{ key: "account_registered" | "workspace_created" | "first_scheduled_block" | "first_recorded_game" | "workspace_activated" | "first_paid_upgrade"; count: number }>;
};

async function invoke(body: Record<string, unknown>) {
  const result = await supabase.functions.invoke("pilot-ops", { body });
  if (result.error) throw result.error;
  return result.data;
}

export function usePilotOperations() {
  const client = useQueryClient();
  const query = useQuery<OpsData>({ queryKey: ["pilot-operations"], queryFn: () => invoke({ action: "list" }), retry: false, staleTime: 15_000 });
  const mutation = useMutation({
    mutationFn: invoke,
    onSuccess: () => { void client.invalidateQueries({ queryKey: ["pilot-operations"] }); toast.success("Pilot operation completed."); },
    onError: () => toast.error("The operation failed. Check operator access and try again."),
  });
  return { ...query, perform: mutation.mutate, isSaving: mutation.isPending };
}

export function useFounderFunnelScorecard(period: FunnelPeriod) {
  return useQuery<FunnelScorecard>({
    queryKey: ["founder-funnel-scorecard", period],
    queryFn: () => invoke({ action: "funnel_scorecard", period }),
    retry: false,
    staleTime: 15_000,
  });
}
