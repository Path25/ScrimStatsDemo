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
  Bell,
  MessageSquare,
  Database,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MOCK_USER, MOCK_TEAM } from '@/data/mockData';

interface DashboardLayoutProps {
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
    icon: BarChart3,
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
    icon: MessageSquare,
  },
  {
    title: 'Resources',
    href: '/resources',
    icon: BarChart3,
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

import { useRole } from "@/contexts/RoleContext";

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { activeRole, setActiveRole } = useRole();
  const location = useLocation();

  return (
    <div className="min-h-screen text-foreground font-sans selection:bg-brand-primary/30 selection:text-white">
      {/* Global Demo Banner */}
      <div className="fixed top-0 inset-x-0 h-8 z-[100] bg-orange-500/10 border-b border-orange-500/20 flex items-center justify-center backdrop-blur-md">
        <div className="flex items-center gap-2 text-orange-500 px-4 text-center">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[11px] sm:text-xs font-medium tracking-wide truncate">
            Demo Environment: This is a preview. Data is mocked and some features are disabled.
          </span>
        </div>
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Enhanced Glass */}
      <aside className={cn(
        "fixed top-8 left-0 z-50 h-[calc(100vh-2rem)] w-72 transition-transform duration-300 ease-out lg:translate-x-0",
        "bg-black/40 backdrop-blur-xl border-r border-white/5 shadow-2xl",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between p-8">
            <div className="flex items-center space-x-4">
              <img src="/ScrimStats logo.png" alt="ScrimStats Logo" className="h-12 w-auto object-contain drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-zinc-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {navigationItems.filter(item => {
              if (activeRole === 'player') {
                // Players see limited menu, but can access Settings for profile/appearance
                return !['/scouting', '/draft-analysis', '/ai-assistant'].includes(item.href);
              }
              return true;
            }).map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden",
                    isActive
                      ? "text-white bg-gradient-to-r from-brand-primary/20 to-transparent border border-brand-primary/20 shadow-[0_0_15px_rgba(45,212,191,0.1)]"
                      : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
                  )}
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                    isActive ? "text-brand-primary drop-shadow-[0_0_5px_rgba(45,212,191,0.5)]" : "text-zinc-500 group-hover:text-zinc-300"
                  )} />
                  <span className="relative z-10">{item.title}</span>
                </Link>
              );
            })}
          </nav>

          {/* Role Switcher & User Profile */}
          <div className="p-4 mt-auto space-y-4">
            {/* Role Switcher (Demo Only) */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-[10px] uppercase font-bold text-zinc-500 mb-2">View As (Demo)</p>
              <div className="flex bg-black/40 rounded-lg p-1">
                {['Player', 'Coach', 'Manager'].map((role) => (
                  <button
                    key={role}
                    onClick={() => setActiveRole(role.toLowerCase() as any)}
                    className={cn(
                      "flex-1 text-[10px] font-bold py-1.5 rounded transition-all",
                      activeRole === role.toLowerCase()
                        ? "bg-brand-primary text-black shadow-sm"
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors group cursor-pointer">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-zinc-800 ring-2 ring-black flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 to-transparent" />
                  <span className="text-sm font-bold text-white relative z-10">{MOCK_TEAM.initial}</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-white truncate group-hover:text-brand-primary transition-colors">{MOCK_TEAM.name}</span>
                  <span className="text-xs text-zinc-500 font-mono capitalize">{activeRole} View</span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-zinc-400 hover:text-white hover:bg-white/5 pl-2 h-8"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72 flex flex-col min-h-screen pt-8 transition-all duration-300">
        {/* Top bar - Floating Glass */}
        <header className="sticky top-12 z-30 px-6 sm:px-8 mb-4">
          <div className="glass-panel rounded-2xl h-16 flex items-center justify-between px-6">
            <div className="flex items-center w-full max-w-md">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden mr-4 text-zinc-400"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>

              <div className="relative w-full max-w-xs hidden sm:block group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-brand-primary transition-colors" />
                <Input
                  placeholder="Search dashboard..."
                  className="bg-black/20 border-white/5 pl-10 h-9 text-sm focus-visible:ring-brand-primary/50 focus-visible:border-brand-primary/50 placeholder:text-zinc-600 w-full transition-all rounded-lg"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <span className="text-[10px] font-mono text-zinc-500 border border-white/10 px-1.5 rounded bg-white/5">⌘ K</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-sm bg-black/30 px-3 py-1.5 rounded-full border border-white/5">
                <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                <span className="text-zinc-300 text-xs font-medium tracking-wide">LIVE</span>
              </div>

              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white relative hover:bg-white/5 rounded-full">
                <div className="absolute top-2 right-2 w-2 h-2 bg-brand-accent rounded-full border-2 border-background" />
                <Bell className="w-5 h-5" />
              </Button>

              <div className="flex items-center space-x-3 pl-6 border-l border-white/10">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-white tracking-tight">{MOCK_USER.email.split('@')[0]}</p>
                  <p className="text-[10px] font-medium text-brand-primary uppercase tracking-wider">{MOCK_USER.role}</p>
                </div>
                <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-br from-brand-primary to-brand-secondary cursor-pointer hover:scale-105 transition-transform shadow-lg shadow-brand-primary/20">
                  <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center">
                    <span className="font-bold text-white text-sm">{MOCK_USER.avatarInitial}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-6 sm:px-8 pb-8 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}
