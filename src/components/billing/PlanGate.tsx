import type { ReactNode } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Link } from "@/lib/router";

import { Button } from "@/components/ui/button";
import { DataSurface } from "@/components/workspace/DataSurface";
import { useTenant } from "@/contexts/TenantContext";
import { planIncludes, planNames, type SubscriptionPlan } from "@/lib/plan-entitlements";

export function PlanGate({ minimum, feature, children, preview }: { minimum: SubscriptionPlan; feature: string; children: ReactNode; preview?: ReactNode }) {
  const { tenant } = useTenant();
  const current = tenant?.subscriptionTier || "free";
  if (planIncludes(current, minimum) && (feature !== 'collector capture' || tenant?.collectorEntitled)) return <>{children}</>;
  if (preview) return <>{preview}</>;

  return (
    <DataSurface className="mx-auto mt-12 max-w-2xl p-8 text-center">
      <LockKeyhole className="mx-auto h-8 w-8 text-[var(--workspace-accent)]" />
      <p className="workspace-eyebrow mt-5 text-[var(--workspace-subtle)]">{planNames[minimum]} feature</p>
      <h1 className="mt-2 text-2xl font-semibold">Unlock {feature}</h1>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--workspace-muted)]">
        Your {planNames[current]} workspace keeps the core team workflow active. Upgrade when the team is ready to use {feature.toLowerCase()}.
      </p>
      <Button asChild className="mt-6"><Link to="/settings?section=billing">Compare plans <ArrowRight className="h-4 w-4" /></Link></Button>
    </DataSurface>
  );
}
