import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  workspaceLogoBucket,
  workspaceLogoPath,
  workspaceLogoPathFromSettings,
  workspaceLogoSettingKey,
  validateWorkspaceLogo,
} from "@/lib/workspace-logo";

type TenantRole = Database["public"]["Enums"]["tenant_role"];

function message(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useWorkspaceAdministration() {
  const { tenant, refreshTenant } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["workspace-administration", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const [membersResult, invitationsResult] = await Promise.all([
        supabase
          .from("tenant_users")
          .select("id, user_id, role, joined_at, created_at")
          .eq("tenant_id", tenant!.id)
          .order("created_at"),
        supabase
          .from("team_invitations")
          .select("id, email, role, token, player_id, created_at, expires_at, accepted_at, delivery_status, delivery_error, last_sent_at, revoked_at")
          .eq("tenant_id", tenant!.id)
          .is("accepted_at", null)
          .is("revoked_at", null)
          .order("created_at", { ascending: false }),
      ]);
      if (membersResult.error) throw membersResult.error;
      if (invitationsResult.error) throw invitationsResult.error;

      const userIds = (membersResult.data || []).map((member) => member.user_id);
      const profilesResult = userIds.length
        ? await supabase
            .from("profiles")
            .select("id, email, display_name")
            .in("id", userIds)
        : { data: [], error: null };
      if (profilesResult.error) throw profilesResult.error;
      const profiles = new Map((profilesResult.data || []).map((profile) => [profile.id, profile]));

      return {
        members: (membersResult.data || []).map((member) => ({
          ...member,
          profile: profiles.get(member.user_id) || null,
        })),
        invitations: invitationsResult.data || [],
      };
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ membershipId, role }: { membershipId: string; role: TenantRole }) => {
      const { error } = await supabase
        .from("tenant_users")
        .update({ role })
        .eq("id", membershipId)
        .eq("tenant_id", tenant!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workspace-administration"] });
      toast.success("Member access updated.");
    },
    onError: (error) => toast.error(message(error, "Member access could not be updated")),
  });

  const removeMutation = useMutation({
    mutationFn: async ({ membershipId, userId }: { membershipId: string; userId: string }) => {
      if (userId === user?.id) throw new Error("You cannot revoke your own active membership.");
      const { error } = await supabase
        .from("tenant_users")
        .delete()
        .eq("id", membershipId)
        .eq("tenant_id", tenant!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workspace-administration"] });
      void queryClient.invalidateQueries({ queryKey: ["players"] });
      toast.success("Workspace access revoked.");
    },
    onError: (error) => toast.error(message(error, "Workspace access could not be revoked")),
  });

  const invitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase.functions.invoke("team-invitations", { body: { action: "revoke", tenant_id: tenant!.id, invitation_id: invitationId } });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workspace-administration"] });
      void queryClient.invalidateQueries({ queryKey: ["players"] });
      toast.success("Invitation revoked.");
    },
    onError: (error) => toast.error(message(error, "Invitation could not be cancelled")),
  });

  const resendInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase.functions.invoke("team-invitations", { body: { action: "resend", tenant_id: tenant!.id, invitation_id: invitationId } });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workspace-administration"] });
      toast.success("Invitation email resent.");
    },
    onError: (error) => toast.error(message(error, "Invitation could not be resent")),
  });

  const preferencesMutation = useMutation({
    mutationFn: async ({
      timezone,
    }: {
      timezone: string;
    }) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
      } catch {
        throw new Error("Choose a valid IANA timezone.");
      }
      const settings = {
        ...tenant!.settings,
        timezone,
      };
      const { error } = await supabase
        .from("tenants")
        .update({ settings })
        .eq("id", tenant!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshTenant();
      toast.success("Workspace preferences saved.");
    },
    onError: (error) => toast.error(message(error, "Preferences could not be saved")),
  });

  const passwordMutation = useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Password updated."),
    onError: (error) => toast.error(message(error, "Password could not be updated")),
  });

  const workspaceLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!tenant) throw new Error("Choose a workspace before uploading a logo.");
      const validationError = validateWorkspaceLogo(file);
      if (validationError) throw new Error(validationError);

      const path = workspaceLogoPath(tenant.id);
      const previousPath = workspaceLogoPathFromSettings(tenant.settings);
      const { error: uploadError } = await supabase.storage
        .from(workspaceLogoBucket)
        .upload(path, file, { upsert: false, cacheControl: "3600", contentType: file.type });
      if (uploadError) throw uploadError;

      const settings = { ...tenant.settings, [workspaceLogoSettingKey]: path };
      delete settings.logo_url;
      const { error: settingsError } = await supabase
        .from("tenants")
        .update({ settings })
        .eq("id", tenant.id);
      if (settingsError) {
        const { error: cleanupError } = await supabase.storage.from(workspaceLogoBucket).remove([path]);
        if (cleanupError) {
          throw new Error("The logo was not saved and its temporary upload could not be cleaned up. Please contact support.");
        }
        throw settingsError;
      }

      if (!previousPath || previousPath === path) return { cleanupError: null };
      const { error: cleanupError } = await supabase.storage.from(workspaceLogoBucket).remove([previousPath]);
      return { cleanupError };
    },
    onSuccess: async ({ cleanupError }) => {
      await refreshTenant();
      if (cleanupError) {
        toast.warning("Workspace logo saved, but the previous image could not be removed. Please contact support.");
        return;
      }
      toast.success("Workspace logo saved.");
    },
    onError: (error) => toast.error(message(error, "Workspace logo could not be saved.")),
  });

  const removeWorkspaceLogoMutation = useMutation({
    mutationFn: async () => {
      if (!tenant) throw new Error("Choose a workspace before removing a logo.");
      const path = workspaceLogoPathFromSettings(tenant.settings);
      const settings = { ...tenant.settings };
      delete settings[workspaceLogoSettingKey];
      delete settings.logo_url;
      const { error: settingsError } = await supabase
        .from("tenants")
        .update({ settings })
        .eq("id", tenant.id);
      if (settingsError) throw settingsError;

      if (!path) return { cleanupError: null };
      const { error: cleanupError } = await supabase.storage.from(workspaceLogoBucket).remove([path]);
      return { cleanupError };
    },
    onSuccess: async ({ cleanupError }) => {
      await refreshTenant();
      toast.success("Workspace logo removed.");
      if (cleanupError) toast.error("The logo is no longer displayed, but its stored asset could not be removed. Please retry.");
    },
    onError: (error) => toast.error(message(error, "Workspace logo could not be removed.")),
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateRole: roleMutation.mutate,
    removeMember: removeMutation.mutate,
    cancelInvitation: invitationMutation.mutate,
    resendInvitation: resendInvitationMutation.mutate,
    savePreferences: preferencesMutation.mutate,
    changePassword: passwordMutation.mutate,
    saveWorkspaceLogo: workspaceLogoMutation.mutate,
    removeWorkspaceLogo: removeWorkspaceLogoMutation.mutate,
    isSaving:
      roleMutation.isPending ||
      removeMutation.isPending ||
      invitationMutation.isPending ||
      resendInvitationMutation.isPending ||
      preferencesMutation.isPending ||
      passwordMutation.isPending ||
      workspaceLogoMutation.isPending ||
      removeWorkspaceLogoMutation.isPending,
  };
}
