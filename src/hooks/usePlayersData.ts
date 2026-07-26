import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Player = Database["public"]["Tables"]["players"]["Row"];
type PlayerInsert = Database["public"]["Tables"]["players"]["Insert"];
type PlayerUpdate = Database["public"]["Tables"]["players"]["Update"];

function mutationMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return fallback;
}

/** Live tenant-scoped roster data only. No demo roster is returned on error or an empty workspace. */
export function usePlayersData() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const rosterQuery = useQuery({
    queryKey: ["players", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      if (!tenant?.id) return [] as Player[];
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("is_active", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Player[];
    },
  });

  const createPlayerMutation = useMutation({
    mutationFn: async (playerData: Omit<PlayerInsert, "tenant_id" | "created_by">) => {
      if (!tenant?.id || !user?.id) throw new Error("No active team workspace");
      const { data, error } = await supabase.from("players").insert({ ...playerData, tenant_id: tenant.id, created_by: user.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["players"] }); toast.success("Player added to the roster."); },
    onError: (error: unknown) => toast.error(mutationMessage(error, "Failed to add player")),
  });

  const updatePlayerMutation = useMutation({
    mutationFn: async ({ id, ...updates }: PlayerUpdate & { id: string }) => {
      if (!tenant?.id) throw new Error("No active team workspace");
      const { data, error } = await supabase.from("players").update(updates).eq("id", id).eq("tenant_id", tenant.id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["players"] }); toast.success("Roster profile updated."); },
    onError: (error: unknown) => toast.error(mutationMessage(error, "Failed to update player")),
  });

  const savePlayerProfileMutation = useMutation({
    mutationFn: async ({
      id,
      summonerName,
      riotId,
      tagLine,
      region,
      role,
      champions,
      discordUsername,
      notes,
    }: {
      id: string;
      summonerName: string;
      riotId: string;
      tagLine: string;
      region: string;
      role: string;
      champions: string[];
      discordUsername?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase.rpc("update_roster_player", {
        p_player_id: id,
        p_summoner_name: summonerName,
        p_riot_id: riotId,
        p_riot_tag_line: tagLine,
        p_region: region,
        p_role: role,
        p_main_champions: champions,
        p_discord_username: discordUsername,
        p_notes: notes,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["players"] });
      toast.success("Roster profile updated.");
    },
    onError: (error: unknown) =>
      toast.error(mutationMessage(error, "Failed to update player")),
  });

  const deletePlayerMutation = useMutation({
    mutationFn: async (playerId: string) => {
      if (!tenant?.id) throw new Error("No active team workspace");
      const { error } = await supabase.rpc("set_roster_player_state", {
        p_player_id: playerId,
        p_active: false,
      });
      if (error) throw error;
    },
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["players"] }); toast.success("Player removed from the active roster."); },
    onError: (error: unknown) => toast.error(mutationMessage(error, "Failed to remove player")),
  });

  const reactivatePlayerMutation = useMutation({
    mutationFn: async (playerId: string) => {
      const { error } = await supabase.rpc("set_roster_player_state", {
        p_player_id: playerId,
        p_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["players"] });
      toast.success("Player returned to the active roster.");
    },
    onError: (error: unknown) =>
      toast.error(mutationMessage(error, "Failed to reactivate player")),
  });

  const allPlayers = rosterQuery.data || [];

  return {
    players: allPlayers.filter((player) => player.is_active !== false),
    archivedPlayers: allPlayers.filter((player) => player.is_active === false),
    isLoading: rosterQuery.isLoading,
    error: rosterQuery.error ? mutationMessage(rosterQuery.error, "The roster could not be loaded.") : null,
    refetch: rosterQuery.refetch,
    createPlayer: createPlayerMutation.mutate,
    updatePlayer: updatePlayerMutation.mutate,
    savePlayerProfile: savePlayerProfileMutation.mutate,
    deletePlayer: deletePlayerMutation.mutate,
    reactivatePlayer: reactivatePlayerMutation.mutate,
    isCreating: createPlayerMutation.isPending,
    isUpdating: updatePlayerMutation.isPending || savePlayerProfileMutation.isPending,
    isDeleting: deletePlayerMutation.isPending || reactivatePlayerMutation.isPending,
    pendingPlayerId:
      deletePlayerMutation.variables || reactivatePlayerMutation.variables || null,
  };
}
