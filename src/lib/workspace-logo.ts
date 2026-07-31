export const workspaceLogoBucket = "workspace-logos";
export const workspaceLogoSettingKey = "workspace_logo_path";
export const workspaceLogoMaxBytes = 2 * 1024 * 1024;

const allowedWorkspaceLogoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function workspaceLogoPath(tenantId: string, version = crypto.randomUUID()) {
  return `${tenantId}/logo/${version}`;
}

export function workspaceLogoPathFromSettings(settings: Record<string, unknown>) {
  const value = settings[workspaceLogoSettingKey];
  return typeof value === "string" && (/^[0-9a-f-]{36}\/logo$/i.test(value) || /^[0-9a-f-]{36}\/logo\/[0-9a-f-]{36}$/i.test(value))
    ? value
    : undefined;
}

export function validateWorkspaceLogo(file: File) {
  if (!allowedWorkspaceLogoTypes.has(file.type)) {
    return "Choose a PNG, JPEG, or WebP image. SVG and other file types are not accepted.";
  }
  if (file.size === 0 || file.size > workspaceLogoMaxBytes) {
    return "Choose an image smaller than 2 MB.";
  }
  return null;
}
