
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Calendar,
  Settings,
  User,
  Users,
  Trophy,
  Menu,
  X,
  LogOut,
  TrendingUp,
  Search,
  Target,
  Bot,
  BookOpen,
  Heart,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTenant } from '@/contexts/TenantContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { NavigationBreadcrumb } from './NavigationBreadcrumb';
import { QuickActions } from './QuickActions';
import { GlobalSearch } from './GlobalSearch';
import { NotificationDropdown } from './NotificationDropdown';

interface EnhancedDashboardLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    title: 'Overview',
    href: '/overview',
    icon: BarChart3,
  },
  {
    title: 'Players',
    href: '/players',
    icon: Users,
  },
  {
    title: 'Scrims',
    href: '/scrims',
    icon: Trophy,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: TrendingUp,
  },
  {
    title: 'Scouting',
    href: '/scouting',
    icon: Search,
  },
  {
    title: 'Draft Analysis',
    href: '/draft-analysis',
    icon: Target,
  },
  {
    title: 'SoloQ Tracker',
    href: '/soloq',
    icon: User,
  },
  {
    title: 'Calendar',
    href: '/calendar',
    icon: Calendar,
  },
  {
    title: 'AI Assistant',
    href: '/ai-assistant',
    icon: Bot,
  },
  {
    title: 'Resources',
    href: '/resources',
    icon: BookOpen,
  },
  {
    title: 'Pro Data',
    href: '/pro-data',
    icon: Database,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function EnhancedDashboardLayout({ children }: EnhancedDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { tenant } = useTenant();
  const { tier } = useSubscription();
  const { user, signOut } = useAuth();

  if (!tenant) return null;

  const handleSignOut = async () => {
    await signOut();
  };

  const isOverviewPage = location.pathname === '/overview' || location.pathname === '/';

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Enhanced Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Enhanced Logo and close button */}
          <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center relative">
                {tenant.logo ? (
                  <img src={tenant.logo} alt={tenant.name} className="w-6 h-6" />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {tenant.name.split(' ').map(word => word.charAt(0)).join('').slice(0, 2)}
                  </span>
                )}
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-sidebar-foreground">ScrimStats</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-sidebar-foreground/60 capitalize">{tier}</span>
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    Pro
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Enhanced Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground border border-electric-500/20 shadow-lg"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={cn(
                    "w-4 h-4 transition-colors",
                    isActive && "text-electric-500"
                  )} />
                  <span className="flex-1">{item.title}</span>
                  {isActive && (
                    <div className="w-1 h-1 rounded-full bg-electric-500 animate-pulse" />
                  )}
                  <div className={cn(
                    "w-0 h-6 bg-electric-500 rounded-full transition-all duration-200 group-hover:w-0.5",
                    isActive && "w-0.5"
                  )} />
                </Link>
              );
            })}
          </nav>

          {/* Enhanced team info and user actions */}
          <div className="p-4 border-t border-sidebar-border space-y-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-sidebar-accent/30">
              <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {tenant.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {tenant.name}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-sidebar-foreground/60 truncate capitalize">
                    {tier} Plan
                  </p>
                  <div className="w-1 h-1 rounded-full bg-green-400" />
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Enhanced Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-4 h-4" />
            </Button>

            {/* Enhanced Search */}
            <div className="hidden md:flex items-center space-x-2">
              <GlobalSearch />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Live Status */}
            <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-performance-excellent animate-pulse" />
              <span>Live Data</span>
            </div>

            {/* Notifications */}
            <NotificationDropdown />

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{user?.user_metadata?.full_name || user?.email}</p>
                <p className="text-xs text-muted-foreground">Team Member</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric-500 to-brand-600 flex items-center justify-center ring-2 ring-electric-500/20">
                <span className="text-xs font-bold text-white">
                  {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Enhanced Page content */}
        <main className="p-6">
          <NavigationBreadcrumb />

          {/* Quick Actions for Overview page */}
          {isOverviewPage && (
            <div className="mb-6">
              <QuickActions />
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
