import { useState, type CSSProperties, type ReactNode } from "react";
import {
  BarChart3,
  Bot,
  CalendarDays,
  Check,
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  Menu,
  MonitorCheck,
  MonitorX,
  ScanSearch,
  Settings,
  Swords,
  TrendingUp,
  Users,
  Workflow,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { ModuleStateBadge } from "@/components/workspace/ModuleStateBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { useTenant } from "@/contexts/TenantContext";
import { useDesktopConnection } from "@/hooks/useDesktopConnection";
import { useWorkspaceModules } from "@/hooks/useWorkspaceModules";
import { cn } from "@/lib/utils";

type DashboardLayoutProps = {
  children: ReactNode;
};

const navigation = [
  {
    label: "Team",
    items: [
      { title: "Overview", href: "/overview", icon: LayoutDashboard },
      { title: "Roster", href: "/players", icon: Users },
      { title: "Calendar", href: "/calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Practice",
    items: [
      { title: "Scrim blocks", href: "/scrims", icon: Swords },
      { title: "Solo Queue", href: "/soloq", icon: TrendingUp },
      { title: "Team analytics", href: "/analytics", icon: BarChart3, module: "analytics" as const },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { title: "Scouting", href: "/scouting", icon: ScanSearch, module: "scouting" as const },
      { title: "Draft", href: "/draft", icon: Workflow, module: "draft_preparation" as const },
    ],
  },
] as const;

const pageTitles: Record<string, string> = {
  "/overview": "Team briefing",
  "/players": "Active roster",
  "/scrims": "Scrim blocks",
  "/calendar": "Team calendar",
  "/analytics": "Team trends",
  "/soloq": "Solo Queue tracker",
  "/scouting": "Private scouting",
  "/draft": "Draft",
  "/preparation": "Draft",
  "/integrations": "Integrations",
  "/settings": "Workspace settings",
};

function validTeamAccent(value: string | undefined) {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : "#11e2d0";
}

function TeamMark({
  logo,
  name,
  size = "default",
}: {
  logo?: string;
  name: string;
  size?: "default" | "small";
}) {
  const initials =
    name
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "SS";
  const dimensions = size === "small" ? "h-8 w-8 text-xs" : "h-11 w-11 text-xs";

  return (
    <div className={cn("workspace-team-mark grid shrink-0 place-items-center overflow-hidden", dimensions)}>
      {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : <span>{initials}</span>}
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { tenant, memberships, chooseTenant } = useTenant();
  const { activeRole } = useRole();
  const { user, signOut } = useAuth();
  const { connectionInfo, isLoading: collectorLoading, error: collectorError } =
    useDesktopConnection();
  const { modules } = useWorkspaceModules();

  const tenantName = tenant?.name || "Team workspace";
  const userName =
    user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Team member";
  const collectorReady = connectionInfo.isConnected && !collectorError;
  const pageTitle =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith("/scrims/") ? "Scrim review" : "Team workspace");
  const style = {
    "--team-accent": validTeamAccent(tenant?.primaryColor),
  } as CSSProperties;

  return (
    <div className="workspace-shell" style={style}>
      {open && (
        <button
          className="fixed inset-0 z-40 bg-[#060a0e]/82 backdrop-blur-sm lg:hidden"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "workspace-sidebar fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r px-4 py-5 backdrop-blur-xl transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-2">
          <Link to="/overview" onClick={() => setOpen(false)}>
            <img
              src="/ScrimStats logo.png"
              alt="ScrimStats by ProComps"
              className="h-8 w-auto"
            />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {memberships.length > 1 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="mt-9 flex w-full items-center gap-3 border-y border-[var(--workspace-rule)] px-2 py-4 text-left">
                <TeamMark logo={tenant?.logo} name={tenantName} />
                <span className="min-w-0 flex-1">
                  <span className="workspace-eyebrow block text-[var(--workspace-subtle)]">
                    Team workspace
                  </span>
                  <span className="mt-1 block truncate text-sm font-semibold text-[var(--workspace-foreground)]">
                    {tenantName}
                  </span>
                </span>
                <ChevronsUpDown className="h-4 w-4 text-[var(--workspace-subtle)]" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-60 border-[var(--workspace-rule-strong)] bg-[var(--workspace-surface-raised)]"
            >
              <DropdownMenuLabel className="workspace-eyebrow text-[var(--workspace-subtle)]">
                Select workspace
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {memberships.map((membership) => (
                <DropdownMenuItem
                  key={membership.id}
                  onSelect={() => chooseTenant(membership.id)}
                  className="flex items-center gap-3 py-2.5"
                >
                  <TeamMark logo={membership.logo} name={membership.name} size="small" />
                  <span className="min-w-0 flex-1 truncate">{membership.name}</span>
                  {membership.id === tenant?.id && (
                    <Check className="h-4 w-4 text-[var(--workspace-accent)]" aria-hidden="true" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="mt-9 flex w-full items-center gap-3 border-y border-[var(--workspace-rule)] px-2 py-4 text-left">
              <TeamMark logo={tenant?.logo} name={tenantName} />
              <span className="min-w-0 flex-1">
                <span className="workspace-eyebrow block text-[var(--workspace-subtle)]">
                  Team workspace
                </span>
                <span className="mt-1 block truncate text-sm font-semibold text-[var(--workspace-foreground)]">
                  {tenantName}
                </span>
              </span>
          </div>
        )}

        <div className="mt-4 px-2">
          <span className="ss-mono text-xs uppercase tracking-[0.13em] text-[var(--team-accent)]">
            {activeRole || "Member"}
          </span>
        </div>

        <nav className="mt-7 min-h-0 flex-1 space-y-6 overflow-y-auto" aria-label="Workspace navigation">
          {navigation.map((group) => (
            <div key={group.label}>
              <p className="workspace-eyebrow px-3 text-[var(--workspace-subtle)]">{group.label}</p>
              <div className="mt-2 space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    location.pathname === item.href ||
                    (item.href === "/scrims" && location.pathname.startsWith("/scrims/")) ||
                    (item.href === "/scouting" && location.pathname.startsWith("/scouting/"));
                  const module = "module" in item ? modules[item.module] : null;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "workspace-nav-link flex min-h-11 items-center gap-3 px-3 text-sm font-medium transition-colors",
                        active && "workspace-nav-link-active",
                      )}
                    >
                      <Icon className={cn("h-4 w-4", active && "text-[var(--team-accent)]")} aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{item.title}</span>
                      {module && module.state !== "live" && (
                        <ModuleStateBadge state={module.state} className="scale-90" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto border-t border-[var(--workspace-rule)] pt-4">
          <Link
            to="/integrations"
            className={cn(
              "workspace-nav-link flex min-h-11 items-center gap-3 px-3 text-sm font-medium",
              location.pathname === "/integrations" && "workspace-nav-link-active",
            )}
          >
            <Bot className="h-4 w-4" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">Integrations</span>
            <ModuleStateBadge state={modules.discord.state} className="scale-90" />
          </Link>
          <Link
            to="/settings"
            className={cn(
              "workspace-nav-link flex min-h-11 items-center gap-3 px-3 text-sm font-medium",
              location.pathname === "/settings" && "workspace-nav-link-active",
            )}
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            Workspace settings
          </Link>
          <div className="mt-3 flex items-center gap-3 px-2 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--workspace-foreground)]">
                {userName}
              </p>
              <p className="mt-0.5 truncate text-xs text-[var(--workspace-subtle)]">
                {user?.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              onClick={() => void signOut()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-[var(--workspace-rule)] bg-[color:rgba(8,13,18,.88)] px-5 py-3 backdrop-blur-xl lg:px-8">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation"
                onClick={() => setOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <p className="workspace-eyebrow text-[var(--workspace-subtle)]">
                  ScrimStats by ProComps
                </p>
                <p className="mt-0.5 text-sm font-medium text-[var(--workspace-foreground)]">
                  {pageTitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--workspace-muted)]">
              {collectorReady ? (
                <MonitorCheck className="h-4 w-4 text-[var(--workspace-accent)]" aria-hidden="true" />
              ) : (
                <MonitorX className="h-4 w-4 text-[var(--workspace-awaiting)]" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">
                {collectorLoading
                  ? "Checking collector"
                  : collectorError
                    ? "Collector unavailable"
                    : collectorReady
                      ? "Collector ready"
                      : "Collector offline"}
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-5 py-7 lg:px-8 lg:py-9">{children}</main>
      </div>
    </div>
  );
}
