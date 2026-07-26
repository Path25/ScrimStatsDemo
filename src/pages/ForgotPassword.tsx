import { useState } from "react";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState(""); const [pending, setPending] = useState(false); const [sent, setSent] = useState(false); const [error, setError] = useState("");
  async function submit(event: React.FormEvent) { event.preventDefault(); setPending(true); setError(""); const result = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${window.location.origin}/reset-password` }); setPending(false); if (result.error) setError(result.error.message); else setSent(true); }
  return <main className="public-page grid min-h-screen place-items-center px-5"><section className="w-full max-w-md rounded-xl border border-[var(--public-rule-strong)] bg-[var(--public-panel)] p-8"><h1 className="text-3xl font-semibold">Reset your password</h1><p className="mt-3 text-[var(--public-muted)]">We will send a secure recovery link if the account exists.</p>{sent ? <><p className="mt-6 text-sm text-[var(--public-accent)]">Check your email for the recovery link.</p><Button asChild variant="outline" className="mt-5 w-full"><Link to="/sign-in">Return to sign in</Link></Button></> : <form className="mt-6 grid gap-4" onSubmit={(event) => void submit(event)}><div><Label htmlFor="recovery-email">Email</Label><Input id="recovery-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2" /></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button disabled={pending}>{pending ? "Sending…" : "Send recovery link"}</Button></form>}</section></main>;
}
