import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type OpponentTeam = Database["public"]["Tables"]["opponent_teams"]["Row"];

export function useOpponentTeams(enabled = true) {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["opponent-teams", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("opponent_teams")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: Boolean(tenant?.id) && enabled,
  });

  const createTeam = useMutation({
    mutationFn: async (input: { name: string; region?: string; description?: string }) => {
      if (!tenant?.id || !user?.id) throw new Error("A team workspace is required.");
      const { data, error } = await supabase
        .from("opponent_teams")
        .insert({
          tenant_id: tenant.id,
          created_by: user.id,
          name: input.name.trim(),
          region: input.region?.trim() || null,
          description: input.description?.trim() || null,
          fandom_links: null,
          social_links: null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["opponent-teams", tenant?.id] });
      toast.success("Opponent added to the private workspace");
    },
  });

  const updateTeam = useMutation({
    mutationFn: async (input: {
      id: string;
      name: string;
      region?: string;
      description?: string;
    }) => {
      if (!tenant?.id) throw new Error("A team workspace is required.");
      const { data, error } = await supabase
        .from("opponent_teams")
        .update({
          name: input.name.trim(),
          region: input.region?.trim() || null,
          description: input.description?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .eq("tenant_id", tenant.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["opponent-teams", tenant?.id] });
      void queryClient.invalidateQueries({ queryKey: ["scouting-workspace", tenant?.id] });
      toast.success("Opponent record updated");
    },
  });

  const setArchived = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      if (!tenant?.id) throw new Error("A team workspace is required.");
      const { error } = await supabase
        .from("opponent_teams")
        .update({
          archived_at: archived ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("tenant_id", tenant.id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["opponent-teams", tenant?.id] });
      toast.success(variables.archived ? "Opponent archived" : "Opponent restored");
    },
  });

  return {
    data: (query.data || []).filter((team) => !team.archived_at),
    archivedData: (query.data || []).filter((team) => Boolean(team.archived_at)),
    isLoading: query.isLoading,
    error: query.error,
    createTeam: createTeam.mutateAsync,
    isCreating: createTeam.isPending,
    updateTeam: updateTeam.mutateAsync,
    isUpdating: updateTeam.isPending,
    archiveTeam: (id: string) => setArchived.mutateAsync({ id, archived: true }),
    restoreTeam: (id: string) => setArchived.mutateAsync({ id, archived: false }),
    isArchiving: setArchived.isPending,
  };
}
