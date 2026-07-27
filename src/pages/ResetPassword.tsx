import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPassword() {
  const [password, setPassword] = useState(""); const [confirmation, setConfirmation] = useState(""); const [pending, setPending] = useState(false); const [error, setError] = useState(""); const [complete, setComplete] = useState(false);
  async function submit(event: React.FormEvent) { event.preventDefault(); if (password.length < 8 || password !== confirmation) return setError("Use at least eight characters and make sure both passwords match."); setPending(true); const result = await supabase.auth.updateUser({ password }); setPending(false); if (result.error) setError("Your password could not be updated. Request a new recovery link and try again."); else { setComplete(true); setTimeout(() => window.location.assign("/overview"), 700); } }
  return <main className="public-page grid min-h-screen place-items-center px-5"><section className="w-full max-w-md rounded-xl border border-[var(--public-rule-strong)] bg-[var(--public-panel)] p-8"><h1 className="text-3xl font-semibold">Choose a new password</h1>{complete ? <p className="mt-5 text-[var(--public-accent)]">Password updated. Opening your workspace…</p> : <form className="mt-6 grid gap-4" onSubmit={(event) => void submit(event)}><div><Label htmlFor="new-recovery-password">New password</Label><Input id="new-recovery-password" type="password" minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2" /></div><div><Label htmlFor="confirm-recovery-password">Confirm password</Label><Input id="confirm-recovery-password" type="password" minLength={8} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2" /></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button disabled={pending}>{pending ? "Updating…" : "Update password"}</Button></form>}</section></main>;
}
