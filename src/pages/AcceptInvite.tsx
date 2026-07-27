import { useState } from "react";
import { CheckCircle2, KeyRound } from "lucide-react";
import { Link, useSearchParams } from "@/lib/router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function AcceptInvite() {
  const { user, isLoading } = useAuth();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const existing = params.get("mode") === "existing";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);

  async function accept(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setError("");
    if (!existing) {
      if (password.length < 8 || password !== confirmation) { setError("Use at least eight characters and make sure both passwords match."); setPending(false); return; }
      const updated = await supabase.auth.updateUser({ password });
      if (updated.error) { setError("Your password could not be saved. Please try again."); setPending(false); return; }
    }
    const result = await supabase.rpc("accept_team_invitation", { invitation_token: token });
    const payload = result.data && typeof result.data === "object" ? result.data as { success?: boolean; error?: string } : null;
    if (result.error || payload?.success === false) { setError("This invitation could not be accepted. It may be expired, revoked, or linked to another email address."); setPending(false); return; }
    setComplete(true); setPending(false); setTimeout(() => window.location.assign("/overview"), 700);
  }

  return <main className="public-page grid min-h-screen place-items-center px-5"><section className="w-full max-w-lg rounded-xl border border-[var(--public-rule-strong)] bg-[var(--public-panel)] p-7 sm:p-9">{complete ? <div className="text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-[var(--public-accent)]" /><h1 className="mt-5 text-3xl font-semibold">Workspace access confirmed</h1><p className="mt-3 text-[var(--public-muted)]">Opening your team workspace…</p></div> : isLoading ? <p>Checking secure access…</p> : !token ? <><h1 className="text-2xl font-semibold">Invitation link is incomplete</h1><p className="mt-3 text-[var(--public-muted)]">Ask your team manager to resend the invitation.</p></> : !user ? <><KeyRound className="h-7 w-7 text-[var(--public-accent)]" /><h1 className="mt-5 text-3xl font-semibold">Sign in to accept</h1><p className="mt-3 text-[var(--public-muted)]">Use the same email address that received the invitation.</p><Button asChild className="mt-6 w-full"><Link to={`/sign-in?invite=${encodeURIComponent(token)}`}>Continue to sign in</Link></Button></> : <form onSubmit={(event) => void accept(event)}><KeyRound className="h-7 w-7 text-[var(--public-accent)]" /><h1 className="mt-5 text-3xl font-semibold">Join your team workspace</h1><p className="mt-3 text-[var(--public-muted)]">Signed in as {user.email}. The invitation email must match this account.</p>{!existing && <div className="mt-6 grid gap-4"><div><Label htmlFor="invite-password">Create password</Label><Input id="invite-password" type="password" minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2" /></div><div><Label htmlFor="invite-confirm">Confirm password</Label><Input id="invite-confirm" type="password" minLength={8} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2" /></div></div>}{error && <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>}<Button type="submit" disabled={pending} className="mt-6 w-full">{pending ? "Confirming…" : "Accept invitation"}</Button></form>}</section></main>;
}
