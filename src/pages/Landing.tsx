import {
  DatabaseZap,
  MonitorDown,
  SearchCheck,
  UsersRound,
} from "lucide-react";

import { CapabilityRail } from "@/components/public/CapabilityRail";
import { PerformanceWorkflow } from "@/components/public/PerformanceWorkflow";
import { ProductProofFrame } from "@/components/public/ProductProofFrame";
import { PublicBodyCopy } from "@/components/public/PublicBodyCopy";
import { PublicCta } from "@/components/public/PublicCta";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicSection } from "@/components/public/PublicSection";
import { SectionLabel } from "@/components/public/SectionLabel";

const capabilities = [
  {
    index: "01",
    eyebrow: "Team and calendar",
    title: "Keep every role aligned before practice begins.",
    description:
      "Bring roster membership, staff responsibilities, participants, availability, and the team calendar into the same workspace as the practice they support.",
    signals: ["Roster", "Roles", "Participants", "Calendar"],
    icon: UsersRound,
  },
  {
    index: "02",
    eyebrow: "Scrim control",
    title: "Give every block a clear plan and a trusted game record.",
    description:
      "Schedule the opponent and format, confirm who is playing, then save completed games through Game Capture or clearly identified manual entry.",
    signals: ["Blocks", "Opponents", "Formats", "Game Capture"],
    icon: MonitorDown,
    reverse: true,
  },
  {
    index: "03",
    eyebrow: "Performance history",
    title: "Carry the evidence into the next decision.",
    description:
      "Results, participants, capture source, and review context stay attached to the team history, so the next conversation starts from what actually happened.",
    signals: ["Results", "Game records", "Review context", "Team history"],
    icon: SearchCheck,
  },
] as const;

const fragmentedTools = ["Spreadsheets", "Discord bots", "Screenshots", "Calendar", "Review notes"];

const connectedOutcomes = [
  "One shared schedule",
  "One trusted game source",
  "One continuous team history",
];

export default function Landing() {
  return (
    <main className="public-page">
      <PublicHeader />

      <section className="relative overflow-hidden border-b border-[var(--public-rule)]">
        <div className="public-hero-orbit public-hero-orbit-one" aria-hidden="true" />
        <div className="public-hero-orbit public-hero-orbit-two" aria-hidden="true" />

        <div className="relative mx-auto max-w-[1440px] px-5 pb-14 pt-16 sm:pt-20 lg:px-9 lg:pb-20 lg:pt-24">
          <div className="max-w-[1120px]">
            <SectionLabel>ScrimStats by ProComps / Performance workspace for League teams</SectionLabel>
            <h1 className="mt-6 max-w-[1080px] text-[clamp(3.5rem,7.3vw,7rem)] font-semibold leading-[0.93] tracking-[-0.055em] text-[var(--public-foreground)]">
              Everything your team needs
              <span className="public-gradient-text block">to compete at its best.</span>
            </h1>
            <PublicBodyCopy className="mt-7 max-w-[830px] text-lg sm:text-xl sm:leading-8">
              ScrimStats connects team management, scheduling, game capture, results, and review—so
              every practice block strengthens the next without rebuilding context across sheets,
              Discord, screenshots, and disconnected tools.
            </PublicBodyCopy>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <PublicCta to="/sign-up">Start free</PublicCta>
              <PublicCta to="/sign-in" secondary>
                Sign in
              </PublicCta>
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-[var(--public-muted)]">
              <span className="ss-mono text-[13px] uppercase tracking-[0.12em] text-[var(--public-subtle)]">
                Built for
              </span>
              {["Organisations", "Coaches", "Managers", "Analysts"].map((audience) => (
                <span key={audience} className="flex items-center gap-2.5 font-medium">
                  <span className="h-1 w-1 rounded-full bg-[var(--public-accent)]" aria-hidden="true" />
                  {audience}
                </span>
              ))}
            </div>
          </div>

          <div id="product" className="mt-12 scroll-mt-24 lg:mt-16">
            <ProductProofFrame desktopSrc="/workspace-preview-blurred.webp" />
          </div>
        </div>
      </section>

      <PublicSection surface="raised">
        <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:gap-20">
          <div>
            <SectionLabel>What teams outgrow</SectionLabel>
            <h2 className="public-section-heading mt-5">
              The problem is not the tools. It is the space between them.
            </h2>
          </div>

          <div className="public-transition">
            <div>
              <p className="ss-mono text-[13px] uppercase tracking-[0.12em] text-[var(--public-subtle)]">
                Fragmented team stack
              </p>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3">
                {fragmentedTools.map((tool) => (
                  <span
                    key={tool}
                    className="relative text-[15px] text-[var(--public-muted)] after:absolute after:left-0 after:right-0 after:top-1/2 after:h-px after:-rotate-2 after:bg-[#ff6b75]/65"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            <div className="public-transition-divider" aria-hidden="true">
              <span />
            </div>

            <div>
              <div className="flex items-center gap-3 text-[var(--public-foreground)]">
                <DatabaseZap className="h-5 w-5 text-[var(--public-accent)]" aria-hidden="true" />
                <span className="font-semibold">Connected in ScrimStats</span>
              </div>
              <ul className="mt-5 grid gap-3">
                {connectedOutcomes.map((outcome) => (
                  <li key={outcome} className="flex items-center gap-3 text-base text-[var(--public-muted)]">
                    <span className="h-px w-5 bg-[var(--public-accent)]" aria-hidden="true" />
                    {outcome}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </PublicSection>

      <PublicSection id="platform">
        <div className="max-w-4xl">
          <SectionLabel>The performance workspace</SectionLabel>
          <h2 className="public-section-heading mt-5">
            Built around the decisions competitive teams make every week.
          </h2>
          <PublicBodyCopy className="mt-5 max-w-2xl">
            Management, practice, and review remain distinct jobs—but they share the same context.
          </PublicBodyCopy>
        </div>

        <div className="mt-10 border-b border-[var(--public-rule-strong)]">
          {capabilities.map((capability) => (
            <CapabilityRail key={capability.index} {...capability} />
          ))}
        </div>
      </PublicSection>

      <PublicSection id="workflow" surface="raised">
        <div className="grid gap-10 lg:grid-cols-[0.68fr_1.32fr] lg:items-end lg:gap-16">
          <div>
            <SectionLabel>From preparation to progress</SectionLabel>
            <h2 className="public-section-heading mt-5">Every block sharpens what happens next.</h2>
          </div>
          <PublicBodyCopy className="max-w-2xl lg:justify-self-end">
            ScrimStats keeps the plan, game record, result, and review connected. Captured and
            manually entered information remain clearly identified, while missing data is shown honestly.
          </PublicBodyCopy>
        </div>

        <div className="mt-12 lg:mt-14">
          <PerformanceWorkflow />
        </div>
      </PublicSection>

      <PublicSection className="py-10 lg:py-14">
        <div className="public-final-cta">
          <div>
            <SectionLabel>ScrimStats by ProComps</SectionLabel>
            <h2 className="mt-5 max-w-4xl text-[clamp(2.5rem,5vw,5rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-[var(--public-foreground)]">
              Make the next block better than the last.
            </h2>
          </div>
          <div className="mt-8 lg:mt-0">
            <PublicCta to="/sign-up">Create your workspace</PublicCta>
          </div>
        </div>
      </PublicSection>

      <PublicFooter />
    </main>
  );
}
