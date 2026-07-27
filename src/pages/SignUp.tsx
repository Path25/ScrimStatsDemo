import type { FormEvent } from "react";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, UserPlus } from "lucide-react";
import { Link, useNavigate } from "@/lib/router";

import { PublicBodyCopy } from "@/components/public/PublicBodyCopy";
import { PublicHeader } from "@/components/public/PublicHeader";
import { SectionLabel } from "@/components/public/SectionLabel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export default function SignUp() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (password.length < 8 || password !== confirmation) {
      setError("Use at least eight characters and make sure both passwords match.");
      return;
    }
    if (!acceptedTerms) {
      setError("Accept the Terms and Privacy Policy to create an account.");
      return;
    }

    setPending(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/create-workspace`,
        data: {
          display_name: name.trim(),
          pending_team_name: teamName.trim(),
        },
      },
    });
    setPending(false);

    if (signUpError) {
      setError("Your account could not be created. Check the details and try again.");
      return;
    }

    if (data.session) {
      navigate("/create-workspace", { replace: true });
      return;
    }

    setComplete(true);
  }

  return (
    <main className="public-page">
      <PublicHeader action="sign-in" />
      <div className="mx-auto grid min-h-[calc(100vh-76px)] max-w-[1440px] lg:grid-cols-[0.82fr_1.18fr]">
        <section className="order-2 border-t border-[var(--public-rule)] px-5 py-12 lg:order-1 lg:border-r lg:border-t-0 lg:px-9 lg:py-[4.5rem]">
          <Link to="/" className="inline-flex items-center gap-2 text-[15px] text-[var(--public-muted)] transition-colors hover:text-[var(--public-foreground)]">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to ScrimStats
          </Link>
          <div className="mt-12 max-w-lg">
            <SectionLabel>Start with Free</SectionLabel>
            <h1 className="mt-4 text-[clamp(2.625rem,4vw,4rem)] font-semibold leading-[1.04] tracking-[-0.04em]">
              Give the team one place to improve.
            </h1>
            <PublicBodyCopy className="mt-5">
              Create your team workspace, invite the roster, and begin organising practice without entering payment details.
            </PublicBodyCopy>
            <div className="mt-8 space-y-4 border-t border-[var(--public-rule)] pt-6">
              {["Free workspace with core team tools", "Private, invitation-only membership", "Upgrade to Pro or Elite whenever you are ready"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-[15px] text-[var(--public-muted)]">
                  <Check className="h-4 w-4 text-[var(--public-accent)]" aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="order-1 flex items-center px-5 py-10 sm:px-9 lg:order-2 lg:px-16 lg:py-[4.5rem]">
          {complete ? (
            <div className="w-full max-w-xl">
              <div className="grid h-11 w-11 place-items-center rounded-full border border-[var(--public-accent)]/30 bg-[var(--public-accent)]/10">
                <CheckCircle2 className="h-5 w-5 text-[var(--public-accent)]" aria-hidden="true" />
              </div>
              <div className="mt-7"><SectionLabel>Confirm your email</SectionLabel></div>
              <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.03em]">Your workspace is one step away.</h2>
              <PublicBodyCopy className="mt-5 max-w-md">
                Open the confirmation email sent to {email.trim().toLowerCase()}. The link will return you to ScrimStats to create your team workspace.
              </PublicBodyCopy>
              <Button asChild variant="outline" className="mt-8 h-12"><Link to="/sign-in">Return to sign in</Link></Button>
            </div>
          ) : (
            <div className="w-full max-w-xl rounded-xl border border-[var(--public-rule-strong)] bg-[var(--public-panel)] p-6 sm:p-8">
              <UserPlus className="h-6 w-6 text-[var(--public-accent)]" aria-hidden="true" />
              <div className="mt-5"><SectionLabel>Create your account</SectionLabel></div>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.025em]">Start your team workspace.</h2>
              <form onSubmit={(event) => void submit(event)} className="mt-8 grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div><Label htmlFor="signup-name">Your name</Label><Input id="signup-name" required maxLength={80} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="public-form-control mt-2" /></div>
                  <div><Label htmlFor="signup-team">Team name</Label><Input id="signup-team" required minLength={2} maxLength={100} autoComplete="organization" value={teamName} onChange={(event) => setTeamName(event.target.value)} className="public-form-control mt-2" /></div>
                </div>
                <div><Label htmlFor="signup-email">Email</Label><Input id="signup-email" type="email" required maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="public-form-control mt-2" /></div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div><Label htmlFor="signup-password">Password</Label><Input id="signup-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="public-form-control mt-2" /></div>
                  <div><Label htmlFor="signup-confirmation">Confirm password</Label><Input id="signup-confirmation" type="password" required minLength={8} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="public-form-control mt-2" /></div>
                </div>
                <label className="flex items-start gap-3 text-sm leading-6 text-[var(--public-muted)]">
                  <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-1 h-4 w-4 accent-[var(--public-accent)]" />
                  <span>I agree to the <Link to="/terms" className="text-[var(--public-foreground)] underline underline-offset-4">Terms</Link> and <Link to="/privacy" className="text-[var(--public-foreground)] underline underline-offset-4">Privacy Policy</Link>.</span>
                </label>
                {error && <p role="alert" className="text-base text-destructive">{error}</p>}
                <Button type="submit" disabled={pending} className="h-12 bg-[var(--public-action)] text-base font-semibold text-[#07110f] hover:bg-[var(--public-foreground)]">
                  {pending ? "Creating account…" : "Create Free workspace"}
                  {!pending && <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />}
                </Button>
                <p className="text-center text-sm text-[var(--public-muted)]">Already have an account? <Link to="/sign-in" className="text-[var(--public-foreground)] hover:underline">Sign in</Link></p>
              </form>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
