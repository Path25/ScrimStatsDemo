import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { ArrowRight, Building2, Check } from "lucide-react";
import { Navigate, useNavigate } from "@/lib/router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";

const commonTimezones = ["UTC", "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Warsaw", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Asia/Seoul", "Asia/Tokyo", "Australia/Sydney"];

export default function CreateWorkspace() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { memberships, isLoading: tenantLoading, refreshTenant } = useTenant();
  const suggestedName = typeof user?.user_metadata?.pending_team_name === "string" ? user.user_metadata.pending_team_name : "";
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const [name, setName] = useState(suggestedName);
  const [timezone, setTimezone] = useState(localTimezone);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (suggestedName) setName((current) => current || suggestedName);
  }, [suggestedName]);

  if (authLoading || tenantLoading) return <main className="public-page grid min-h-screen place-items-center text-sm">Preparing your workspace…</main>;
  if (!user) return <Navigate to="/sign-in" replace />;
  if (memberships.length) return <Navigate to={memberships.length > 1 ? "/workspaces" : "/overview"} replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const result = await supabase.rpc("create_self_service_workspace", {
      p_name: name.trim(),
      p_timezone: timezone,
    });
    if (result.error) {
      setPending(false);
      setError("Your workspace could not be created. Check the details and try again.");
      return;
    }
    await refreshTenant();
    setPending(false);
    navigate("/overview", { replace: true });
  }

  return (
    <main className="public-page grid min-h-screen place-items-center px-5 py-10">
      <section className="w-full max-w-2xl rounded-xl border border-[var(--public-rule-strong)] bg-[var(--public-panel)] p-6 sm:p-9">
        <div className="grid h-11 w-11 place-items-center rounded-full border border-[var(--public-accent)]/30 bg-[var(--public-accent)]/10">
          <Building2 className="h-5 w-5 text-[var(--public-accent)]" aria-hidden="true" />
        </div>
        <p className="mt-6 font-mono text-[13px] uppercase tracking-[0.12em] text-[var(--public-accent)]">Final account step</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em]">Create your team workspace.</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[var(--public-muted)]">You will be the workspace owner. Add staff and players from Settings after setup.</p>
        <form onSubmit={(event) => void submit(event)} className="mt-8 grid gap-6">
          <div><Label htmlFor="workspace-name">Team name</Label><Input id="workspace-name" required minLength={2} maxLength={100} autoComplete="organization" value={name} onChange={(event) => setName(event.target.value)} className="public-form-control mt-2" /></div>
          <div>
            <Label htmlFor="workspace-timezone">Team timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="workspace-timezone" className="public-form-control mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>{[...new Set([localTimezone, ...commonTimezones])].map((zone) => <SelectItem key={zone} value={zone}>{zone}</SelectItem>)}</SelectContent>
            </Select>
            <p className="mt-2 text-sm text-[var(--public-muted)]">Used for practice scheduling and reminders.</p>
          </div>
          <div className="grid gap-3 border-y border-[var(--public-rule)] py-5 text-sm text-[var(--public-muted)]">
            {["Free plan active immediately", "Private workspace", "You can upgrade from Settings"].map((item) => <span key={item} className="flex items-center gap-3"><Check className="h-4 w-4 text-[var(--public-accent)]" aria-hidden="true" />{item}</span>)}
          </div>
          {error && <p role="alert" className="text-base text-destructive">{error}</p>}
          <Button type="submit" disabled={pending} className="h-12 bg-[var(--public-action)] text-base font-semibold text-[#07110f] hover:bg-[var(--public-foreground)]">
            {pending ? "Creating workspace…" : "Open ScrimStats"}
            {!pending && <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />}
          </Button>
        </form>
      </section>
    </main>
  );
}
