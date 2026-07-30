import type { Database } from "@/integrations/supabase/types";

export type WorkspaceRole = Database["public"]["Enums"]["tenant_role"];

export type WorkspaceCapabilities = {
  manageCalendar: boolean;
  manageRoster: boolean;
  manageScrims: boolean;
  manageIntelligence: boolean;
  manageIntegrations: boolean;
  manageMemberships: boolean;
  viewIntelligence: boolean;
  viewPublishedIntelligence: boolean;
};

const readOnly: WorkspaceCapabilities = {
  manageCalendar: false,
  manageRoster: false,
  manageScrims: false,
  manageIntelligence: false,
  manageIntegrations: false,
  manageMemberships: false,
  viewIntelligence: true,
  viewPublishedIntelligence: true,
};

export function getWorkspaceCapabilities(role: string | null | undefined): WorkspaceCapabilities {
  if (role === "owner") {
    return {
      manageCalendar: true,
      manageRoster: true,
      manageScrims: true,
      manageIntelligence: true,
      manageIntegrations: true,
      manageMemberships: true,
      viewPublishedIntelligence: true,
    };
  }

  if (role === "admin") {
    return {
      ...readOnly,
      manageCalendar: true,
      manageRoster: true,
      manageScrims: true,
      manageIntelligence: true,
      manageIntegrations: true,
      manageMemberships: true,
    };
  }

  return readOnly;
}
