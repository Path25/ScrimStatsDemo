import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataSurface } from "@/components/workspace/DataSurface";
import { useRole } from "@/contexts/RoleContext";
import { useTenant } from "@/contexts/TenantContext";
import { useWorkspaceAdministration } from "@/hooks/useWorkspaceAdministration";
import { validateWorkspaceLogo } from "@/lib/workspace-logo";

export function WorkspaceIdentityPanel() {
  const { tenant } = useTenant();
  const { isManager } = useRole();
  const administration = useWorkspaceAdministration();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const nextPreviewUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(nextPreviewUrl);
    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [selectedFile]);

  if (!tenant) return null;

  const displayedLogo = previewUrl || tenant.logo;
  const hasLogo = Boolean(tenant.logo);

  function chooseFile(file: File | null) {
    if (!file) return;
    const validationError = validateWorkspaceLogo(file);
    if (validationError) {
      toast.error(validationError);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setSelectedFile(file);
  }

  function uploadLogo() {
    if (!selectedFile) return;
    administration.saveWorkspaceLogo(selectedFile, {
      onSuccess: () => {
        setSelectedFile(null);
        if (inputRef.current) inputRef.current.value = "";
      },
    });
  }

  return (
    <DataSurface>
      <div className="flex items-start gap-3 border-b border-[var(--workspace-rule)] p-5">
        <ImagePlus className="mt-0.5 h-5 w-5 text-[var(--workspace-accent)]" />
        <div>
          <h2 className="font-semibold">Workspace identity</h2>
          <p className="mt-1 text-sm text-[var(--workspace-muted)]">
            Add a team mark for the workspace sidebar and switcher. Team members can view it; only owners and admins can change it.
          </p>
        </div>
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-[5rem_1fr] sm:items-center">
        <div className="workspace-team-mark grid h-20 w-20 place-items-center overflow-hidden text-lg">
          {displayedLogo ? <img src={displayedLogo} alt="Workspace logo preview" className="h-full w-full object-cover" /> : <span>{tenant.name.slice(0, 2).toUpperCase()}</span>}
        </div>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="workspace-logo">Team logo</Label>
            <Input
              ref={inputRef}
              id="workspace-logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={!isManager || administration.isSaving}
              onChange={(event) => chooseFile(event.target.files?.[0] || null)}
            />
            <p className="text-xs text-[var(--workspace-subtle)]">PNG, JPEG, or WebP only. Maximum 2 MB. SVG is not accepted.</p>
          </div>
          {isManager ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={!selectedFile || administration.isSaving} onClick={uploadLogo}>
                <ImagePlus className="h-4 w-4" />
                {hasLogo ? "Replace logo" : "Save logo"}
              </Button>
              {hasLogo && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={administration.isSaving}
                  onClick={() => administration.removeWorkspaceLogo()}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove logo
                </Button>
              )}
            </div>
          ) : (
            <p className="text-xs text-[var(--workspace-subtle)]">An owner or admin can update this workspace logo.</p>
          )}
        </div>
      </div>
    </DataSurface>
  );
}
