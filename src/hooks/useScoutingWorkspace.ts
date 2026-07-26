import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";

export function useScoutingWorkspace(opponentTeamId?: string, enabled = true) {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = ["scouting-workspace", tenant?.id, opponentTeamId];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      if (!tenant?.id || !opponentTeamId) return null;
      const [team, players, evidence, tendencies, briefs, practiceBlocks, tendencyLinks, briefLinks] = await Promise.all([
        supabase
          .from("opponent_teams")
          .select("*")
          .eq("tenant_id", tenant.id)
          .eq("id", opponentTeamId)
          .maybeSingle(),
        supabase
          .from("opponent_players")
          .select("*")
          .eq("opponent_team_id", opponentTeamId)
          .order("role"),
        supabase
          .from("scouting_evidence")
          .select("*")
          .eq("tenant_id", tenant.id)
          .eq("opponent_team_id", opponentTeamId)
          .order("observed_at", { ascending: false }),
        supabase
          .from("scouting_tendencies")
          .select("*")
          .eq("tenant_id", tenant.id)
          .eq("opponent_team_id", opponentTeamId)
          .eq("status", "active")
          .order("updated_at", { ascending: false }),
        supabase
          .from("preparation_briefs")
          .select("*")
          .eq("tenant_id", tenant.id)
          .eq("opponent_team_id", opponentTeamId)
          .order("updated_at", { ascending: false }),
        supabase
          .from("scrims")
          .select("id, opponent_name, starts_at, status, data_source, opponent_team_id")
          .eq("tenant_id", tenant.id)
          .order("starts_at", { ascending: false })
          .limit(50),
        supabase
          .from("scouting_tendency_evidence")
          .select("tendency_id, evidence_id")
          .eq("tenant_id", tenant.id),
        supabase
          .from("preparation_brief_evidence")
          .select("brief_id, evidence_id")
          .eq("tenant_id", tenant.id),
      ]);
      const firstError = [
        team.error,
        players.error,
        evidence.error,
        tendencies.error,
        briefs.error,
        practiceBlocks.error,
        tendencyLinks.error,
        briefLinks.error,
      ].find(Boolean);
      if (firstError) throw firstError;
      const blockIds = (practiceBlocks.data || []).map((block) => block.id);
      const games = blockIds.length
        ? await supabase
            .from("scrim_games")
            .select("id, scrim_id, game_number, status, result, side, desktop_session_id")
            .in("scrim_id", blockIds)
            .order("game_number")
        : { data: [], error: null };
      if (games.error) throw games.error;
      return {
        team: team.data,
        players: players.data || [],
        evidence: evidence.data || [],
        tendencies: tendencies.data || [],
        briefs: briefs.data || [],
        practiceBlocks: practiceBlocks.data || [],
        games: games.data || [],
        tendencyLinks: tendencyLinks.data || [],
        briefLinks: briefLinks.data || [],
      };
    },
    enabled: Boolean(tenant?.id && opponentTeamId) && enabled,
  });

  const addEvidence = useMutation({
    mutationFn: async (input: {
      title: string;
      observation: string;
      evidenceType: string;
      confidence: number;
      sampleContext?: string;
      sourceKind?: "manual" | "scrim" | "collector";
      scrimId?: string;
      scrimGameId?: string;
      observedAt?: string;
    }) => {
      if (!tenant?.id || !user?.id || !opponentTeamId) throw new Error("Opponent context is required.");
      const { error } = await supabase.from("scouting_evidence").insert({
        tenant_id: tenant.id,
        opponent_team_id: opponentTeamId,
        created_by: user.id,
        source_kind: input.sourceKind || "manual",
        evidence_type: input.evidenceType,
        title: input.title.trim(),
        observation: input.observation.trim(),
        confidence: input.confidence,
        sample_context: input.sampleContext?.trim() || null,
        scrim_id: input.scrimId || null,
        scrim_game_id: input.scrimGameId || null,
        observed_at: input.observedAt || new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: (_, input) => {
      void queryClient.invalidateQueries({ queryKey: key });
      toast.success(
        input.sourceKind === "collector"
          ? "Collector evidence linked"
          : input.sourceKind === "scrim"
            ? "Practice evidence linked"
            : "Manual observation added",
      );
    },
  });

  const addPlayer = useMutation({
    mutationFn: async (input: {
      name: string;
      role?: string;
      notes?: string;
      riotId?: string;
      region?: string;
    }) => {
      if (!opponentTeamId) throw new Error("Opponent context is required.");
      const { error } = await supabase.from("opponent_players").insert({
        opponent_team_id: opponentTeamId,
        summoner_name: input.name.trim(),
        role: input.role || null,
        notes: input.notes?.trim() || null,
        riot_id: input.riotId?.trim() || null,
        region: input.region?.trim() || null,
        external_links: null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      toast.success("Opponent roster updated");
    },
  });

  const updatePlayer = useMutation({
    mutationFn: async (input: {
      id: string;
      name: string;
      role?: string;
      notes?: string;
      riotId?: string;
      region?: string;
      isActive?: boolean;
    }) => {
      if (!opponentTeamId) throw new Error("Opponent context is required.");
      const { error } = await supabase
        .from("opponent_players")
        .update({
          summoner_name: input.name.trim(),
          role: input.role || null,
          notes: input.notes?.trim() || null,
          riot_id: input.riotId?.trim() || null,
          region: input.region?.trim() || null,
          is_active: input.isActive ?? true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .eq("opponent_team_id", opponentTeamId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      toast.success("Opponent roster entry updated");
    },
  });

  const setPlayerActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (!opponentTeamId) throw new Error("Opponent context is required.");
      const { error } = await supabase
        .from("opponent_players")
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("opponent_team_id", opponentTeamId);
      if (error) throw error;
    },
    onSuccess: (_, input) => {
      void queryClient.invalidateQueries({ queryKey: key });
      toast.success(input.isActive ? "Opponent player restored" : "Opponent player archived");
    },
  });

  const supersedeEvidence = useMutation({
    mutationFn: async (input: {
      id: string;
      title: string;
      observation: string;
      evidenceType: string;
      confidence: number;
      sampleContext?: string;
      reason?: string;
    }) => {
      if (!tenant?.id) throw new Error("Workspace context is required.");
      const { error } = await supabase.rpc("supersede_scouting_evidence", {
        p_tenant_id: tenant.id,
        p_evidence_id: input.id,
        p_title: input.title.trim(),
        p_observation: input.observation.trim(),
        p_evidence_type: input.evidenceType,
        p_confidence: input.confidence,
        p_sample_context: input.sampleContext?.trim() || undefined,
        p_reason: input.reason?.trim() || undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      toast.success("Evidence revised with the previous version retained");
    },
  });

  const addTendency = useMutation({
    mutationFn: async (input: {
      title: string;
      summary: string;
      category: string;
      confidence: number;
      evidenceIds?: string[];
    }) => {
      if (!tenant?.id || !user?.id || !opponentTeamId) throw new Error("Opponent context is required.");
      const { error } = await supabase.rpc("create_scouting_tendency", {
        p_tenant_id: tenant.id,
        p_opponent_team_id: opponentTeamId,
        p_title: input.title.trim(),
        p_summary: input.summary.trim(),
        p_category: input.category,
        p_confidence: input.confidence,
        p_evidence_ids: input.evidenceIds || [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      toast.success("Tendency added");
    },
  });

  const createBrief = useMutation({
    mutationFn: async (input: {
      title: string;
      scheduledFor?: string;
      summary?: string;
      evidenceIds?: string[];
    }) => {
      if (!tenant?.id || !user?.id || !opponentTeamId) throw new Error("Opponent context is required.");
      const { error } = await supabase.rpc("create_preparation_brief", {
        p_tenant_id: tenant.id,
        p_opponent_team_id: opponentTeamId,
        p_title: input.title.trim(),
        p_scheduled_for: input.scheduledFor || undefined,
        p_summary: input.summary?.trim() || "",
        p_evidence_ids: input.evidenceIds || [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      toast.success("Draft match plan created");
    },
  });

  return {
    ...query,
    addEvidence: addEvidence.mutateAsync,
    addingEvidence: addEvidence.isPending,
    addPlayer: addPlayer.mutateAsync,
    addingPlayer: addPlayer.isPending,
    updatePlayer: updatePlayer.mutateAsync,
    updatingPlayer: updatePlayer.isPending,
    setPlayerActive: setPlayerActive.mutateAsync,
    settingPlayerActive: setPlayerActive.isPending,
    supersedeEvidence: supersedeEvidence.mutateAsync,
    supersedingEvidence: supersedeEvidence.isPending,
    addTendency: addTendency.mutateAsync,
    addingTendency: addTendency.isPending,
    createBrief: createBrief.mutateAsync,
    creatingBrief: createBrief.isPending,
  };
}
