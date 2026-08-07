import type { ReactNode } from "react";
import { Bot, CalendarClock, KeyRound, Link2, LockKeyhole, MonitorCheck, ShieldCheck } from "lucide-react";

import { CaptureProfileControl } from "@/components/integrations/CaptureProfileControl";
import { DiscordScheduleIntegration } from "@/components/integrations/DiscordScheduleIntegration";
import { RiotApiIntegration } from "@/components/integrations/RiotApiIntegration";
import { DataSurface } from "@/components/workspace/DataSurface";
import { ModuleStateBadge } from "@/components/workspace/ModuleStateBadge";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { useRole } from "@/contexts/RoleContext";
import { useTenant } from "@/contexts/TenantContext";
import { useWorkspaceModules } from "@/hooks/useWorkspaceModules";
import { planIncludes } from "@/lib/plan-entitlements";
import { Link } from "@/lib/router";

export default function Integrations() {
  const { modules } = useWorkspaceModules();
  const { canManageIntegrations } = useRole();
  const { tenant } = useTenant();
  const hasDesktopAccess = Boolean(tenant?.collectorEntitled);
  const hasEliteAccess = tenant?.subscriptionTier === "elite";

  return (
    <div className="space-y-8 pb-12">
      <WorkspacePageHeader
        eyebrow="Workspace connections"
        title="Integrations"
        description="Connect the services your team uses while keeping records and permissions in one workspace."
      />
      <CaptureProfileControl canManage={canManageIntegrations && hasDesktopAccess} hasCollectorAccess={hasDesktopAccess} />
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
              <h2 className="font-semibold">Game Capture</h2>
            </div>
            <ModuleStateBadge state={modules.collector.state} enabled={hasDesktopAccess && modules.collector.enabled} unavailableLabel="Pro feature" />
          </div>
          {hasDesktopAccess ? (
            <DataSurface className="p-5">
              <div className="flex items-start gap-3">
                <MonitorCheck className="mt-0.5 h-5 w-5 text-[var(--workspace-accent)]" />
                <div>
                  <h3 className="font-semibold">Capture custom games from the Windows app</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--workspace-muted)]">
                    Connect the game computer, choose the block you are about to play, and follow capture progress in one place.
                  </p>
                  <Link to="/collector" className="mt-3 inline-flex text-sm font-medium text-[var(--workspace-accent)] hover:underline">
                    Open Game Capture
                  </Link>
                </div>
              </div>
            </DataSurface>
          ) : (
            <IntegrationPlanPreview
              locked={!hasDesktopAccess}
              label="Pro feature"
              title="Game Capture is included with Pro"
              description="Connect a Windows game computer and save custom games to the correct scrim block."
            >
              <DataSurface><div className="divide-y divide-[var(--workspace-rule)]">
                <IntegrationRow icon={MonitorCheck} title="One-time connection" description="Connect the computer that runs your custom games." />
                <IntegrationRow icon={ShieldCheck} title="Clear capture status" description="Know when the app is ready, saving, or waiting to upload." />
                <IntegrationRow icon={Link2} title="Automatic game linking" description="Save captured games to the block selected before practice." />
              </div></DataSurface>
            </IntegrationPlanPreview>
          )}
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Bot className="h-5 w-5 text-[#8994ff]" />
              <h2 className="font-semibold">Discord schedule assistant</h2>
            </div>
            <ModuleStateBadge state={modules.discord.state} enabled={hasEliteAccess && modules.discord.enabled} availableLabel="Test only" />
          </div>
          {canManageIntegrations && hasEliteAccess && modules.discord.state === "live" && modules.discord.enabled ? <DiscordScheduleIntegration /> : <IntegrationPlanPreview
            locked={!hasEliteAccess}
            label="Elite feature"
            title="Discord automation is an Elite capability"
            description="Discord scheduling will be available on Elite. Until then, schedule changes and reminders remain in ScrimStats."
          ><DataSurface>
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
              <IntegrationRow icon={CalendarClock} title="Practice reminders" description="A reminder for an upcoming practice block." />
              <IntegrationRow icon={Link2} title="Schedule changes" description="Created, changed, and cancelled blocks link back to ScrimStats." />
              <IntegrationRow icon={ShieldCheck} title="Selected channels" description="Only a connected team's selected channels receive prompts." />
            </div>
            <div className="border-t border-[var(--workspace-rule)] px-5 py-4">
              <p className="ss-mono text-xs uppercase tracking-[0.12em] text-[var(--workspace-awaiting)]">
                Unavailable until delivery is verified
              </p>
            </div>
          </DataSurface></IntegrationPlanPreview>}
        </div>
      </div>
    </div>
  );
}

function IntegrationPlanPreview({ locked, label, title, description, children }: { locked: boolean; label: string; title: string; description: string; children: ReactNode }) {
  if (!locked) return <>{children}</>;
  return (
    <div className="relative overflow-hidden border border-[var(--workspace-rule)]">
      <div aria-hidden="true" className="pointer-events-none select-none opacity-55">{children}</div>
      <div className="absolute inset-x-0 bottom-0 flex min-h-[52%] items-end bg-gradient-to-t from-[var(--workspace-surface-raised)] via-[color:rgba(12,19,25,.91)] to-transparent p-5 backdrop-blur-[3px]">
        <div className="max-w-md">
          <p className="workspace-eyebrow flex items-center gap-2 text-[var(--workspace-accent)]"><LockKeyhole className="h-3.5 w-3.5" /> {label}</p>
          <h3 className="mt-2 font-semibold">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--workspace-muted)]">{description}</p>
          <Link to="/settings?section=billing" className="mt-4 inline-flex text-sm font-medium text-[var(--workspace-accent)] hover:underline">Compare plans</Link>
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
