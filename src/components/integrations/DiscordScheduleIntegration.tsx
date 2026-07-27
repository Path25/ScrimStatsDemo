import { Bot, Clock3, MessageSquareText, ShieldCheck } from "lucide-react";

import { DataSurface } from "@/components/workspace/DataSurface";

const previewItems = [
  { icon: MessageSquareText, label: "Schedule changes and cancellations" },
  { icon: Clock3, label: "Practice and availability reminders" },
  { icon: ShieldCheck, label: "Approved channels with delivery tracking" },
];

export function DiscordScheduleIntegration() {
  return (
    <DataSurface className="overflow-hidden">
      <div className="border-b border-[var(--workspace-rule)] p-5">
        <div className="flex items-start gap-3">
          <Bot className="mt-0.5 h-5 w-5 text-[#8994ff]" aria-hidden="true" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">Discord delivery</h3>
              <span className="ss-mono border border-[#8994ff]/35 bg-[#8994ff]/10 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-[#aeb5ff]">
                Coming soon
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--workspace-muted)]">
              Discord reminders will bring schedule changes and practice prompts into your team server. Installation and channel controls will appear here when the integration is available.
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-px bg-[var(--workspace-rule)] sm:grid-cols-3">
        {previewItems.map((item) => (
          <div key={item.label} className="flex items-center gap-3 bg-[var(--workspace-surface)] p-4 text-sm text-[var(--workspace-muted)]">
            <item.icon className="h-4 w-4 shrink-0 text-[var(--workspace-subtle)]" aria-hidden="true" />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </DataSurface>
  );
}
