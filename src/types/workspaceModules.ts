export type WorkspaceModuleKey =
  | "operations"
  | "analytics"
  | "scouting"
  | "draft_preparation"
  | "collector"
  | "discord";

export type WorkspaceReleaseState = "planned" | "beta" | "live";

export interface WorkspaceModuleAccess {
  key: WorkspaceModuleKey;
  state: WorkspaceReleaseState;
  enabled: boolean;
}

export const defaultWorkspaceModules: Record<WorkspaceModuleKey, WorkspaceModuleAccess> = {
  operations: { key: "operations", state: "live", enabled: true },
  analytics: { key: "analytics", state: "beta", enabled: true },
  scouting: { key: "scouting", state: "beta", enabled: true },
  draft_preparation: { key: "draft_preparation", state: "planned", enabled: true },
  collector: { key: "collector", state: "live", enabled: true },
  discord: { key: "discord", state: "planned", enabled: true },
};
