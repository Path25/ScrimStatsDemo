import { Bot, CalendarClock, KeyRound, Link2, MonitorCheck, ShieldCheck } from "lucide-react";

import { DesktopCollectorIntegration } from "@/components/integrations/DesktopCollectorIntegration";
import { CaptureProfileControl } from "@/components/integrations/CaptureProfileControl";
import { DiscordScheduleIntegration } from "@/components/integrations/DiscordScheduleIntegration";
import { RiotApiIntegration } from "@/components/integrations/RiotApiIntegration";
import { DataSurface } from "@/components/workspace/DataSurface";
import { ModuleStateBadge } from "@/components/workspace/ModuleStateBadge";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { useRole } from "@/contexts/RoleContext";
import { useWorkspaceModules } from "@/hooks/useWorkspaceModules";

export default function Integrations() {
  const { modules } = useWorkspaceModules();
  const { canManageIntegrations } = useRole();

  return (
    <div className="space-y-8 pb-12">
      <WorkspacePageHeader
        eyebrow="Workspace connections"
        title="Integrations"
        description="External tools support the team workflow; ScrimStats remains the authenticated source of truth."
      />
      <CaptureProfileControl canManage={canManageIntegrations} />
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <KeyRound className="h-5 w-5 text-[var(--workspace-accent)]" />
          <h2 className="font-semibold">Riot data connection</h2>
        </div>
        <RiotApiIntegration canManage={canManageIntegrations} />
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <MonitorCheck className="h-5 w-5 text-[var(--workspace-accent)]" />
              <h2 className="font-semibold">Desktop collector</h2>
            </div>
            <ModuleStateBadge state={modules.collector.state} />
          </div>
          {canManageIntegrations ? (
            <DesktopCollectorIntegration />
          ) : (
            <DataSurface className="p-5">
              <p className="text-sm leading-6 text-[var(--workspace-muted)]">
                Members see collector provenance throughout the workspace. Pairing remains an owner/admin action.
              </p>
            </DataSurface>
          )}
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Bot className="h-5 w-5 text-[#8994ff]" />
              <h2 className="font-semibold">Discord schedule assistant</h2>
            </div>
            <ModuleStateBadge state={modules.discord.state} />
          </div>
          {canManageIntegrations && modules.discord.state === "live" ? <DiscordScheduleIntegration /> : <DataSurface>
            <div className="border-b border-[var(--workspace-rule)] p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-[var(--workspace-awaiting)]" />
                <div>
                  <h3 className="font-semibold">A notification bridge, not a second workspace</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--workspace-muted)]">
                    Discord carries scheduling prompts and links back to ScrimStats. Private scouting, review notes, and authorization stay here.
                  </p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-[var(--workspace-rule)]">
              <IntegrationRow icon={CalendarClock} title="Practice reminders" description="Upcoming blocks, changes, and cancellations." />
              <IntegrationRow icon={Link2} title="Availability prompts" description="A direct route back to the authenticated team calendar." />
              <IntegrationRow icon={MonitorCheck} title="Collector readiness" description="A pre-block reminder when capture is not ready." />
            </div>
            <div className="border-t border-[var(--workspace-rule)] px-5 py-4">
              <p className="ss-mono text-xs uppercase tracking-[0.12em] text-[var(--workspace-awaiting)]">
                Roadmap preview · installation opens after controlled delivery testing
              </p>
            </div>
          </DataSurface>}
        </div>
      </div>
    </div>
  );
}

function IntegrationRow({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CalendarClock;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 px-5 py-4">
      <Icon className="mt-0.5 h-4 w-4 text-[var(--workspace-subtle)]" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--workspace-subtle)]">{description}</p>
      </div>
    </div>
  );
}
