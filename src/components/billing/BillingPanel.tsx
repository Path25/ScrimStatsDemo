import { useState } from "react";
import { Check, CreditCard, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DataSurface } from "@/components/workspace/DataSurface";
import { useRole } from "@/contexts/RoleContext";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { planNames, type SubscriptionPlan } from "@/lib/plan-entitlements";
import { collectorGraceEndsAt } from "@/lib/collector-entitlement";

const plans: Array<{ id: SubscriptionPlan; price: string; description: string; features: string[] }> = [
  { id: "free", price: "$0", description: "The essential weekly team workflow.", features: ["Overview and roster", "Calendar and availability", "Scrim blocks and coaching actions"] },
  { id: "pro", price: "$9.99", description: "Preparation, capture, and improvement intelligence.", features: ["Everything in Free", "Solo Queue and team analytics", "Scouting and Draft workspace", "Game Capture workflow"] },
  { id: "elite", price: "$19.99", description: "The complete ScrimStats workspace.", features: ["Everything in Pro", "Discord automation when released"] },
];

async function functionMessage(error: unknown, fallback: string) {
  const response = (error as { context?: Response } | null)?.context;
  if (response) {
    try { const body = await response.clone().json() as { error?: string }; if (body.error) return body.error; } catch { /* use fallback */ }
  }
  return error instanceof Error && error.message !== "Edge Function returned a non-2xx status code" ? error.message : fallback;
}

export function BillingPanel() {
  const { tenant } = useTenant();
  const { isManager } = useRole();
  const [busy, setBusy] = useState<SubscriptionPlan | "portal" | null>(null);
  if (!tenant) return null;
  const graceEndsAt = tenant.subscriptionStatus === 'past_due' ? collectorGraceEndsAt(tenant.subscriptionPastDueStartedAt) : null;

  async function openCheckout(plan: "pro" | "elite") {
    setBusy(plan);
    const { data, error } = await supabase.functions.invoke("create-checkout", { body: { tenant_id: tenant!.id, plan } });
    setBusy(null);
    if (error || !data?.url) { toast.error(await functionMessage(error, "Checkout could not be started.")); return; }
    window.location.assign(data.url);
  }

  async function openPortal() {
    setBusy("portal");
    const { data, error } = await supabase.functions.invoke("customer-portal", { body: { tenant_id: tenant!.id } });
    setBusy(null);
    if (error || !data?.url) { toast.error(await functionMessage(error, "Billing portal could not be opened.")); return; }
    window.location.assign(data.url);
  }

  return (
    <DataSurface id="billing">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--workspace-rule)] p-5">
        <div className="flex gap-3"><CreditCard className="mt-0.5 h-5 w-5 text-[var(--workspace-accent)]" /><div><h2 className="font-semibold">Plans and billing</h2><p className="mt-1 text-sm text-[var(--workspace-muted)]">Billing belongs to this workspace, not an individual team member.</p></div></div>
        <div className="text-right"><p className="workspace-eyebrow text-[var(--workspace-subtle)]">Current plan</p><p className="mt-1 font-semibold">{planNames[tenant.subscriptionTier]} <span className="text-xs font-normal capitalize text-[var(--workspace-muted)]">· {tenant.subscriptionStatus.replaceAll("_", " ")}</span></p></div>
      </div>
      {isManager && graceEndsAt && tenant.collectorEntitled && <div className="border-b border-amber-400/30 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">Payment needed — Game Capture remains available until {graceEndsAt.toLocaleString()}. Update payment details in Billing to avoid losing capture access.</div>}
      <div className="grid gap-4 p-5 lg:grid-cols-3">
        {plans.map((plan) => {
          const current = tenant.subscriptionTier === plan.id;
          return <div key={plan.id} className={`flex min-h-64 flex-col border p-5 ${current ? "border-[var(--workspace-accent)] bg-[color:rgba(17,226,208,.04)]" : "border-[var(--workspace-rule)]"}`}>
            <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-semibold">{planNames[plan.id]}</h3><p className="mt-1 text-sm text-[var(--workspace-muted)]">{plan.description}</p></div>{current && <span className="ss-mono text-xs uppercase text-[var(--workspace-accent)]">Current</span>}</div>
            <p className="mt-5 text-3xl font-semibold">{plan.price}<span className="text-sm font-normal text-[var(--workspace-muted)]">{plan.id === "free" ? "" : "/month"}</span></p>
            <ul className="mt-5 space-y-2">{plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm text-[var(--workspace-muted)]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--workspace-accent)]" />{feature}</li>)}</ul>
            <div className="mt-auto pt-6">
              {current ? <Button className="w-full" variant="outline" disabled>Current plan</Button>
                : tenant.subscriptionTier !== "free" ? <Button className="w-full" variant="outline" disabled={!isManager || busy !== null} onClick={() => void openPortal()}>Change in billing portal <ExternalLink className="h-4 w-4" /></Button>
                : plan.id === "free" ? <Button className="w-full" variant="outline" disabled>Included</Button>
                : <Button className="w-full" disabled={!isManager || busy !== null} onClick={() => void openCheckout(plan.id as "pro" | "elite")}>{busy === plan.id ? "Opening…" : `Choose ${planNames[plan.id]}`}</Button>}
            </div>
          </div>;
        })}
      </div>
      {tenant.subscriptionTier !== "free" && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--workspace-rule)] px-5 py-4"><p className="text-sm text-[var(--workspace-muted)]">Invoices, payment method, plan changes and cancellation are handled securely by Stripe.</p><Button variant="outline" disabled={!isManager || busy !== null} onClick={() => void openPortal()}>Manage billing <ExternalLink className="h-4 w-4" /></Button></div>}
      {!isManager && <p className="border-t border-[var(--workspace-rule)] px-5 py-4 text-xs text-[var(--workspace-subtle)]">An owner or admin manages this workspace subscription.</p>}
    </DataSurface>
  );
}
