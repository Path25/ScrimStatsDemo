import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2 } from "lucide-react";
import { Link } from "@/lib/router";

import { PublicBodyCopy } from "@/components/public/PublicBodyCopy";
import { PublicHeader } from "@/components/public/PublicHeader";
import { SectionLabel } from "@/components/public/SectionLabel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RequestAccess() {
  const [complete, setComplete] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/request-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      if (!response.ok) {
        throw new Error("Your request could not be sent. Please try again shortly.");
      }
      setComplete(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your request could not be sent.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="public-page">
      <PublicHeader action="sign-in" />

      <div className="mx-auto grid min-h-[calc(100vh-76px)] max-w-[1440px] lg:grid-cols-[0.82fr_1.18fr]">
        <section className="order-2 border-t border-[var(--public-rule)] px-5 py-12 lg:order-1 lg:border-r lg:border-t-0 lg:px-9 lg:py-[4.5rem]">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[15px] text-[var(--public-muted)] transition-colors hover:text-[var(--public-foreground)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to ScrimStats
          </Link>

          <div className="mt-12 max-w-lg">
            <SectionLabel>Controlled team access</SectionLabel>
            <h1 className="mt-4 text-[clamp(2.625rem,4vw,4rem)] font-semibold leading-[1.04] tracking-[-0.04em]">
              Bring the next block into focus.
            </h1>
            <PublicBodyCopy className="mt-5">
              Tell us how your team currently manages scrims. Approved teams receive a private
              workspace; there is no public workspace creation.
            </PublicBodyCopy>
            <div className="mt-8 space-y-4 border-t border-[var(--public-rule)] pt-6">
              {[
                "Private tenant workspace",
                "Invite-managed membership",
                "Roster, schedule and scrim record",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-[15px] text-[var(--public-muted)]"
                >
                  <Check
                    className="h-4 w-4 text-[var(--public-accent)]"
                    aria-hidden="true"
                  />
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
                <CheckCircle2
                  className="h-5 w-5 text-[var(--public-accent)]"
                  aria-hidden="true"
                />
              </div>
              <div className="mt-7">
                <SectionLabel>Request received</SectionLabel>
              </div>
              <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.03em]">
                Your team is in the queue.
              </h2>
              <PublicBodyCopy className="mt-5 max-w-md">
                We will review the request and contact you using the address provided.
              </PublicBodyCopy>
              <Link
                to="/sign-in"
                className="mt-8 inline-flex min-h-12 items-center gap-4 rounded-md bg-[var(--public-foreground)] px-5 text-base font-semibold text-[var(--public-bg)] transition-colors hover:bg-[var(--public-action)]"
              >
                Member sign in
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="w-full max-w-xl rounded-xl border border-[var(--public-rule-strong)] bg-[var(--public-panel)] p-6 sm:p-8">
              <SectionLabel>Request a workspace</SectionLabel>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.025em]">
                Tell us about the team.
              </h2>
              <p className="mt-3 text-base leading-7 text-[var(--public-muted)]">
                We use these details only to review access and contact you about ScrimStats.
              </p>

              <form onSubmit={(event) => void submit(event)} className="mt-8 grid gap-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field label="Your name" htmlFor="name">
                    <Input
                      id="name"
                      name="name"
                      required
                      maxLength={80}
                      autoComplete="name"
                      className="public-form-control mt-2 rounded-md"
                    />
                  </Field>
                  <Field label="Team name" htmlFor="teamName">
                    <Input
                      id="teamName"
                      name="teamName"
                      required
                      maxLength={100}
                      className="public-form-control mt-2 rounded-md"
                    />
                  </Field>
                </div>
                <Field label="Work email" htmlFor="email">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                    className="public-form-control mt-2 rounded-md"
                  />
                </Field>
                <Field label="What do you need to run?" htmlFor="message">
                  <textarea
                    id="message"
                    name="message"
                    maxLength={1000}
                    rows={5}
                    className="public-form-control mt-2 flex w-full resize-none rounded-md border px-3 py-3 outline-none"
                    placeholder="For example: roster, scrim schedule and post-game review for a five-player roster."
                  />
                </Field>
                <input
                  className="sr-only"
                  tabIndex={-1}
                  autoComplete="off"
                  name="website"
                  aria-hidden="true"
                />
                {error && (
                  <p role="alert" className="text-base text-destructive">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={pending}
                  className="h-12 rounded-md bg-[var(--public-action)] text-base font-semibold text-[#07110f] hover:bg-[var(--public-foreground)]"
                >
                  {pending ? "Sending request..." : "Request team access"}
                  {!pending && <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />}
                </Button>
              </form>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="text-sm font-medium text-[var(--public-foreground)]">
        {label}
      </Label>
      {children}
    </div>
  );
}
