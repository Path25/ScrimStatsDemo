import type { Database } from "@/integrations/supabase/types";

export type WorkspaceRole = Database["public"]["Enums"]["tenant_role"];

export type WorkspaceCapabilities = {
  manageCalendar: boolean;
  manageRoster: boolean;
  manageScrims: boolean;
  manageIntelligence: boolean;
  manageIntegrations: boolean;
  manageMemberships: boolean;
  managePracticeDevelopment: boolean;
  viewIntelligence: boolean;
  viewPracticeDevelopment: boolean;
  viewPublishedIntelligence: boolean;
};

const readOnly: WorkspaceCapabilities = {
  manageCalendar: false,
  manageRoster: false,
  manageScrims: false,
  manageIntelligence: false,
  manageIntegrations: false,
  manageMemberships: false,
  managePracticeDevelopment: false,
  viewIntelligence: true,
  viewPracticeDevelopment: false,
  viewPublishedIntelligence: true,
};

const practiceDevelopmentReadOnly: WorkspaceCapabilities = {
  ...readOnly,
  viewPracticeDevelopment: true,
};

export function getWorkspaceCapabilities(role: string | null | undefined): WorkspaceCapabilities {
  if (role === "owner") {
    return {
      ...readOnly,
      manageCalendar: true,
      manageRoster: true,
      manageScrims: true,
      manageIntelligence: true,
      manageIntegrations: true,
      manageMemberships: true,
      managePracticeDevelopment: true,
      viewPracticeDevelopment: true,
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
      managePracticeDevelopment: true,
      viewPracticeDevelopment: true,
    };
  }

  if (role === "member" || role === "viewer") {
    return practiceDevelopmentReadOnly;
  }

  return readOnly;
}
