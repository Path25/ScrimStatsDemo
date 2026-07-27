import { ShieldCheck } from "lucide-react";

import { DataSurface } from "@/components/workspace/DataSurface";

export function HowCaptureWorks() {
  return (
    <DataSurface className="p-6">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 text-[var(--workspace-accent)]" />
        <div className="w-full">
          <p className="workspace-eyebrow text-[var(--workspace-subtle)]">How it works</p>
          <ol className="mt-4 grid gap-4 text-sm leading-6 text-[var(--workspace-muted)] md:grid-cols-3">
            <li>
              <strong className="block text-[var(--workspace-foreground)]">1. Choose your block</strong>
              Select the scrim block before champion select.
            </li>
            <li>
              <strong className="block text-[var(--workspace-foreground)]">2. Play normally</strong>
              Champion select and each custom game are detected automatically.
            </li>
            <li>
              <strong className="block text-[var(--workspace-foreground)]">3. Leave both apps open</strong>
              The game is saved after the League post-game screen appears.
            </li>
          </ol>
          <p className="mt-5 border-t border-[var(--workspace-rule)] pt-4 text-xs leading-5 text-[var(--workspace-subtle)]">
            ScrimStats saves League game information while capture is active. It does not record your
            screen, microphone, or other applications.
          </p>
        </div>
      </div>
    </DataSurface>
  );
}
