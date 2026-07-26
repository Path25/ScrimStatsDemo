import { Check, Circle } from "lucide-react";

import { DataSurface } from "@/components/workspace/DataSurface";
import type { ReviewCheck } from "@/lib/scrim-review";

export function ReviewChecklist({ checks }: { checks: ReviewCheck[] }) {
  return (
    <DataSurface>
      <div className="border-b border-[var(--workspace-rule)] px-5 py-4">
        <p className="workspace-eyebrow">Review progress</p>
        <h2 className="mt-2 font-semibold">Completion checklist</h2>
      </div>
      <div className="divide-y divide-[var(--workspace-rule)]">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center gap-3 px-5 py-3.5">
            <span
              className={
                check.complete
                  ? "grid h-6 w-6 place-items-center bg-emerald-400/10 text-emerald-300"
                  : "grid h-6 w-6 place-items-center bg-white/[0.035] text-[var(--workspace-subtle)]"
              }
            >
              {check.complete ? <Check className="h-4 w-4" /> : <Circle className="h-3.5 w-3.5" />}
            </span>
            <span className="min-w-0 flex-1 text-sm font-medium">{check.label}</span>
            <span className="ss-mono text-xs text-[var(--workspace-subtle)]">{check.detail}</span>
          </div>
        ))}
      </div>
    </DataSurface>
  );
}
