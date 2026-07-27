import { Activity, ExternalLink, LifeBuoy, LockKeyhole, Scale } from "lucide-react";
import { Link, useLocation } from "@/lib/router";

import { PublicFooter } from "@/components/public/PublicFooter";
import { Button } from "@/components/ui/button";

const content = {
  privacy: {
    icon: LockKeyhole,
    eyebrow: "Trust centre",
    title: "Privacy",
    intro: "ScrimStats stores the account, team, match, and coaching information needed to provide the service.",
    sections: [
      ["Information we process", "Account identity, workspace membership, roster and schedule data, coach-authored review content, Riot data requested through a workspace-owned key, and factual game evidence from connected services."],
      ["How it is used", "We use this information to provide workspace coordination, reviews, analytics, scouting, Draft and support. We do not sell personal information or use private team evidence to train public models."],
      ["Retention and control", "Workspace records remain available while the service is active unless an owner requests export or deletion. Archived records can be restored; permanent deletion is handled through support with appropriate safety checks."],
      ["Security", "Each team workspace is isolated in the database. Sensitive integration credentials and source data remain server-side, and operational access is restricted to authorised service administrators."],
    ],
  },
  terms: {
    icon: Scale,
    eyebrow: "Service terms",
    title: "Terms of use",
    intro: "These terms set clear expectations for teams and staff using ScrimStats.",
    sections: [
      ["Service access", "Workspace access and available features depend on the active plan. We may improve or update the service and will communicate material changes that affect your team."],
      ["Team responsibilities", "Workspace owners are responsible for authorised roster access, lawful evidence capture, their Riot and integration credentials, and the accuracy of manually entered coaching information."],
      ["Acceptable use", "Do not attempt to access another workspace, disrupt the service, bypass provider restrictions, upload unlawful material, or use the service in a way that violates Riot policies."],
      ["Billing and service changes", "Paid subscriptions are managed securely through Stripe. Material maintenance, service changes, and incidents are communicated through the status and support channels."],
    ],
  },
  support: {
    icon: LifeBuoy,
    eyebrow: "Customer support",
    title: "Support",
    intro: "Teams receive human support for account access, game capture, scheduling, and review workflows.",
    sections: [
      ["Contact", "Email support@scrimstats.gg with your workspace name, the affected page and the support reference shown on any error screen."],
      ["Escalation", "Access failures, possible data isolation issues and active capture incidents are treated as urgent. Product questions and workflow help are handled during UK business hours."],
      ["Useful details", "Include the approximate time, player or scrim involved, browser, and steps taken. Never send passwords, API keys or collector secrets."],
    ],
  },
  status: {
    icon: Activity,
    eyebrow: "Service health",
    title: "Status",
    intro: "ScrimStats is monitored across dashboard access, data services, email delivery, and Game Capture connectivity.",
    sections: [
      ["Dashboard", "Operational. Team workspaces and their connected data services are available."],
      ["Email delivery", "Operational when a workspace invitation or notification reports a sent state. Delivery failures remain visible to staff and can be retried."],
      ["Game Capture", "Connection status and device pairing are available from the dashboard. Contact support if a connected device remains unavailable."],
      ["Incident communication", "Confirmed incidents and recovery updates are shared with affected workspace owners. Contact support if your workspace shows a persistent unavailable state."],
    ],
  },
} as const;

export default function TrustPage() {
  const key = useLocation().pathname.slice(1) as keyof typeof content;
  const page = content[key] || content.support;
  const Icon = page.icon;

  return (
    <div className="public-page min-h-screen">
      <header className="border-b border-[var(--public-rule)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link to="/"><img src="/ScrimStats logo.png" alt="ScrimStats" className="h-8 w-auto" /></Link>
          <Button asChild variant="outline"><Link to="/sign-in">Sign in</Link></Button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-16 sm:py-24">
        <Icon className="h-8 w-8 text-[var(--public-accent)]" />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--public-accent)]">{page.eyebrow}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">{page.title}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--public-muted)]">{page.intro}</p>
        <div className="mt-12 divide-y divide-[var(--public-rule)] border-y border-[var(--public-rule)]">
          {page.sections.map(([title, body]) => <section key={title} className="grid gap-3 py-7 sm:grid-cols-[12rem_1fr]"><h2 className="font-semibold">{title}</h2><p className="text-sm leading-7 text-[var(--public-muted)]">{body}</p></section>)}
        </div>
        {key === "support" && <Button asChild className="mt-8"><a href="mailto:support@scrimstats.gg">Email support <ExternalLink className="h-4 w-4" /></a></Button>}
        <p className="mt-10 text-xs text-[var(--public-muted)]">Last updated 27 July 2026.</p>
      </main>
      <PublicFooter />
    </div>
  );
}
