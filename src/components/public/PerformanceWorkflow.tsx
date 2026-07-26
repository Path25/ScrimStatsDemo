import { CalendarRange, MonitorDown, SearchCheck } from "lucide-react";

const stages = [
  {
    number: "01",
    title: "Prepare",
    description: "Set the opponent, format, roster, and schedule before the block begins.",
    icon: CalendarRange,
  },
  {
    number: "02",
    title: "Capture",
    description: "Attach the game record to the block while its source remains explicit.",
    icon: MonitorDown,
  },
  {
    number: "03",
    title: "Review",
    description: "Return to the result with participants, evidence, and previous context intact.",
    icon: SearchCheck,
  },
] as const;

const sourceStates = [
  ["Collector-captured", "bg-[var(--public-accent)]"],
  ["Manual", "bg-[#d7b66f]"],
  ["Awaiting", "bg-[#80909b]"],
  ["Unavailable", "bg-[#66737d]"],
] as const;

export function PerformanceWorkflow() {
  return (
    <div className="public-workflow">
      <div className="public-workflow-line" aria-hidden="true" />
      {stages.map((stage) => {
        const Icon = stage.icon;
        const isCapture = stage.title === "Capture";

        return (
          <article key={stage.number} className="public-workflow-stage">
            <div className="flex items-center justify-between gap-4">
              <span className="ss-mono text-[13px] tracking-[0.13em] text-[var(--public-accent)]">
                {stage.number}
              </span>
              <Icon className="h-5 w-5 text-[var(--public-muted)]" aria-hidden="true" />
            </div>
            <h3 className="mt-8 text-2xl font-semibold tracking-[-0.025em] text-[var(--public-foreground)] sm:text-3xl">
              {stage.title}
            </h3>
            <p className="mt-4 text-base leading-7 text-[var(--public-muted)]">
              {stage.description}
            </p>

            {isCapture && (
              <ul className="mt-7 grid gap-3" aria-label="Capture source states">
                {sourceStates.map(([label, colour]) => (
                  <li key={label} className="flex items-center gap-3 text-sm text-[var(--public-muted)]">
                    <span className={`h-2 w-2 rounded-full ${colour}`} aria-hidden="true" />
                    {label}
                  </li>
                ))}
              </ul>
            )}
          </article>
        );
      })}
    </div>
  );
}
