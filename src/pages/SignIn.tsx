import type { FormEvent } from "react";
import { useState } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "@/lib/router";

import { PublicBodyCopy } from "@/components/public/PublicBodyCopy";
import { PublicHeader } from "@/components/public/PublicHeader";
import { SectionLabel } from "@/components/public/SectionLabel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

export default function SignIn() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const { error: signInError } = await signIn(email.trim(), password);
    if (signInError) {
      setError(signInError.message);
      setPending(false);
      return;
    }
    const invitationToken = searchParams.get("invite");
    if (invitationToken) return navigate(`/accept-invite?token=${encodeURIComponent(invitationToken)}&mode=existing`, { replace: true });
    navigate((location.state as { from?: string } | null)?.from || "/overview", {
      replace: true,
    });
  }

  return (
    <main className="public-page">
      <PublicHeader />

      <div className="mx-auto grid min-h-[calc(100vh-76px)] max-w-[1440px] lg:grid-cols-[0.86fr_1.14fr]">
        <section className="hidden border-r border-[var(--public-rule)] px-9 py-[4.5rem] lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[15px] text-[var(--public-muted)] transition-colors hover:text-[var(--public-foreground)]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to ScrimStats
            </Link>
            <div className="mt-16 max-w-xl">
              <SectionLabel>Private team workspace</SectionLabel>
              <h1 className="mt-4 text-[clamp(2.75rem,4vw,4rem)] font-semibold leading-[1.04] tracking-[-0.04em]">
                Return to the block with the context intact.
              </h1>
            </div>
          </div>
          <p className="max-w-md border-l border-[var(--public-accent)]/50 pl-5 text-base leading-7 text-[var(--public-muted)]">
            Access is issued by your team owner or manager. ScrimStats does not create public
            workspaces from this screen.
          </p>
        </section>

        <section className="flex items-center px-5 py-12 sm:px-9 lg:px-20">
          <div className="mx-auto w-full max-w-lg rounded-xl border border-[var(--public-rule-strong)] bg-[var(--public-panel)] p-6 sm:p-8">
            <Link
              to="/"
              className="mb-10 inline-flex items-center gap-2 text-[15px] text-[var(--public-muted)] transition-colors hover:text-[var(--public-foreground)] lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to ScrimStats
            </Link>
            <div className="grid h-10 w-10 place-items-center rounded-full border border-[var(--public-accent)]/25 bg-[var(--public-accent)]/10">
              <LockKeyhole
                className="h-5 w-5 text-[var(--public-accent)]"
                aria-hidden="true"
              />
            </div>
            <div className="mt-7">
              <SectionLabel>Member access</SectionLabel>
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.025em]">
              Sign in to your team workspace.
            </h2>
            <PublicBodyCopy className="mt-3">
              Use the email and password attached to your ScrimStats membership.
            </PublicBodyCopy>

            <form onSubmit={(event) => void submit(event)} className="mt-8 space-y-6">
              <div>
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-[var(--public-foreground)]"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="public-form-control mt-2 rounded-md"
                  autoComplete="email"
                />
              </div>
              <div>
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-[var(--public-foreground)]"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="public-form-control mt-2 rounded-md"
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <p role="alert" className="text-base text-destructive">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className="h-12 w-full rounded-md bg-[var(--public-action)] text-base font-semibold text-[#07110f] hover:bg-[var(--public-foreground)]"
                disabled={pending}
              >
                {pending ? "Signing in..." : "Enter workspace"}
                {!pending && <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />}
              </Button>
              <Link to="/forgot-password" className="block text-center text-sm text-[var(--public-muted)] hover:text-[var(--public-foreground)]">Forgot your password?</Link>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
