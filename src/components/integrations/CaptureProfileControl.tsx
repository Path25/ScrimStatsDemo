import { useState } from "react";
import { DatabaseZap, MonitorCheck, ShieldCheck } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DataSurface } from "@/components/workspace/DataSurface";
import { useCaptureProfile } from "@/hooks/useCaptureProfile";
import type { CaptureProfile } from "@/lib/analytics/team-analytics";
import { cn } from "@/lib/utils";

const profiles: Array<{
  id: CaptureProfile;
  title: string;
  description: string;
  detail: string;
  icon: typeof MonitorCheck;
}> = [
  {
    id: "desktop_manual",
    title: "Game Capture + Manual",
    description: "Save custom games from the connected Windows computer, with manual entry as a fallback.",
    detail: "Best for everyday team practice and scrim blocks.",
    icon: MonitorCheck,
  },
  {
    id: "grid_manual",
    title: "GRID + Manual",
    description: "Capture supported tournament-realm series through GRID, with manual review as fallback.",
    detail: "Best for spatial and movement evidence when supplied by GRID.",
    icon: DatabaseZap,
  },
];

export function CaptureProfileControl({ canManage }: { canManage: boolean }) {
  const { profile, isLoading, isUpdating, updateProfile } = useCaptureProfile();
  const [pending, setPending] = useState<CaptureProfile | null>(null);
  const pendingProfile = profiles.find((option) => option.id === pending);

  return (
    <>
      <DataSurface>
        <div className="flex gap-3 border-b border-[var(--workspace-rule)] p-5">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-[var(--workspace-accent)]" />
          <div>
            <h2 className="font-semibold">Game data source</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--workspace-muted)]">
              Choose how future games are added. Manual game entry remains available with either option.
            </p>
          </div>
        </div>
        <div className="grid gap-px bg-[var(--workspace-rule)] lg:grid-cols-2">
          {profiles.map((option) => {
            const Icon = option.icon;
            const active = option.id === profile;
            return (
              <div key={option.id} className={cn("bg-[var(--workspace-surface)] p-5", active && "bg-[color:rgba(17,226,208,.04)]")}>
                <div className="flex items-start justify-between gap-4">
                  <Icon className={cn("h-5 w-5", active ? "text-[var(--workspace-accent)]" : "text-[var(--workspace-subtle)]")} />
                  <span className={cn("ss-mono text-[11px] uppercase tracking-[0.12em]", active ? "text-[var(--workspace-accent)]" : "text-[var(--workspace-subtle)]")}>
                    {active ? "Active" : "Inactive"}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold">{option.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--workspace-muted)]">{option.description}</p>
                <p className="mt-3 text-xs leading-5 text-[var(--workspace-subtle)]">{option.detail}</p>
                {canManage && !active && (
                  <Button className="mt-5" size="sm" variant="outline" disabled={isLoading || isUpdating} onClick={() => setPending(option.id)}>
                    Select profile
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </DataSurface>
      <AlertDialog open={Boolean(pending)} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change future capture to {pendingProfile?.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              Existing games will remain unchanged. Future games will use the selected source.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep current profile</AlertDialogCancel>
            <AlertDialogAction
              disabled={!pending || isUpdating}
              onClick={(event) => {
                event.preventDefault();
                if (!pending) return;
                void updateProfile(pending).then(() => setPending(null));
              }}
            >
              {isUpdating ? "Updating…" : "Confirm profile"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
