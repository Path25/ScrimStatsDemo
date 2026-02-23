import {
  QUICK_ACTIONS,
  TEAM_STATS,
  RECENT_SCRIMS,
  NEXT_SCRIM,
  ACTIVE_ROSTER,
  SIDE_STATS,
  OBJECTIVE_STATS
} from "@/data/mockData";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";
import {
  Calendar,
  Users,
  TrendingUp,
  ChevronRight,
  Activity,
  Clock,
  Map,
  Trophy,
  ArrowUpRight,
  MoreHorizontal,
  Play,
  CreditCard,
  Shield,
  UserPlus,
  Target
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useOptimizedScrimsData } from "@/hooks/useOptimizedScrimsData";
import { useScrimAnalytics } from "@/hooks/useScrimAnalytics";
import { useState } from "react";
import { ScheduleScrimDialog } from "@/components/scrims/ScheduleScrimDialog";
import { useNavigate } from "react-router-dom";

export default function Overview() {
  const { activeRole, isManager, isCoach, isPlayer } = useRole();
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch real data for analytics
  const { data: scrimsData } = useOptimizedScrimsData();
  const analytics = useScrimAnalytics(scrimsData?.scrims || [], 'month');
  const perfData = analytics.performanceData.length > 0 ? analytics.performanceData : [
    { name: 'Week 1', winRate: 45, games: 10 },
    { name: 'Week 2', winRate: 52, games: 12 },
    { name: 'Week 3', winRate: 48, games: 8 },
    { name: 'Week 4', winRate: 61, games: 15 },
    { name: 'Week 5', winRate: 58, games: 11 },
    { name: 'Week 6', winRate: 65, games: 14 },
    { name: 'Current', winRate: 72, games: 6 },
  ];

  const handleActionClick = (label: string) => {
    if (label === "New Scrim") setIsScheduleOpen(true);
    if (label === "Calendar") navigate("/calendar");
    if (label === "Players") navigate("/players");
    if (label === "Analytics") navigate("/analytics");
  };

  return (
    <div className="space-y-6 max-w-[1920px] mx-auto pb-10 animate-page-entry">

      {/* 1. Compact Header & Quick Actions Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl sticky top-24 z-20">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground pl-2">
          <span className="text-zinc-500">ScrimStats</span>
          <ChevronRight className="w-4 h-4 text-zinc-700" />
          <span className="text-white font-medium glow-text">Overview</span>
          <span className="text-[10px] ml-2 bg-brand-primary/10 px-2 py-0.5 rounded text-brand-primary font-mono uppercase tracking-widest">{activeRole} System</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {QUICK_ACTIONS.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => handleActionClick(action.label)}
              className={cn(
                "glass-button h-9 px-4 text-xs font-medium border-white/5 hover:border-brand-primary/30 hover:bg-brand-primary/10 transition-all whitespace-nowrap",
                index === 0 && "bg-brand-primary text-black hover:bg-brand-primary/90 border-transparent shadow-[0_0_15px_rgba(45,212,191,0.3)] hover:shadow-[0_0_20px_rgba(45,212,191,0.5)]"
              )}
            >
              {typeof action.icon === 'string' ? <span className="mr-2 text-lg leading-none">+</span> : <action.icon className="w-3.5 h-3.5 mr-2" />}
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      <ScheduleScrimDialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen} />

      {/* 2. Main Bento Grid */}
      <div className="bento-grid">

        {/* KPI: Introduction based on Role */}
        <div className="md:col-span-4 lg:col-span-4 glass-card rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-32 bg-brand-primary/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-brand-primary/20 transition-all duration-700" />
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {isPlayer ? "Ready to grind, Player?" : isManager ? "Organization Health" : "Welcome back, Coach."}
              </h1>
              <p className="text-zinc-400 max-w-lg">
                {isPlayer
                  ? "You have 2 upcoming VOD assignments and a scrim block at 8 PM."
                  : isManager
                    ? "Subscription is active. All systems operational. 3 pending team invites."
                    : (<span>Your team is performing <span className="text-brand-primary font-bold">24% better</span> than last month.</span>)
                }
              </p>
            </div>

            {!isPlayer && (
              <div className="hidden sm:block">
                <div className="bg-black/40 border border-white/5 p-4 rounded-xl backdrop-blur-md">
                  <span className="text-label block mb-1">Win Rate</span>
                  <span className="text-3xl font-bold text-brand-primary glow-text">{analytics.team.winRate}%</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            {isManager ? (
              // MANAGER STATS
              <>
                <div className="bg-black/20 border border-white/5 p-3 rounded-lg hover:border-brand-primary/30 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-3 h-3 text-brand-primary" />
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Plan Status</span>
                  </div>
                  <span className="text-xl font-bold text-white">Pro Tier</span>
                </div>
                <div className="bg-black/20 border border-white/5 p-3 rounded-lg hover:border-brand-primary/30 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Active Members</span>
                  </div>
                  <span className="text-xl font-bold text-white">7/10</span>
                </div>
                <div className="bg-black/20 border border-white/5 p-3 rounded-lg hover:border-brand-primary/30 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <UserPlus className="w-3 h-3 text-yellow-500" />
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Pending Invites</span>
                  </div>
                  <span className="text-xl font-bold text-white">3</span>
                </div>
                <div className="bg-black/20 border border-white/5 p-3 rounded-lg hover:border-brand-primary/30 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-3 h-3 text-green-500" />
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">System Health</span>
                  </div>
                  <span className="text-xl font-bold text-white">100%</span>
                </div>
              </>
            ) : isPlayer ? (
              // PLAYER STATS
              <>
                <div className="bg-black/20 border border-white/5 p-3 rounded-lg hover:border-brand-primary/30 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-3 h-3 text-brand-primary" />
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">SoloQ Goal</span>
                  </div>
                  <span className="text-xl font-bold text-white">Challenger</span>
                </div>
                <div className="bg-black/20 border border-white/5 p-3 rounded-lg hover:border-brand-primary/30 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">CS/Min Trend</span>
                  </div>
                  <span className="text-xl font-bold text-white">+0.5</span>
                </div>
              </>
            ) : (
              // COACH STATS (Default)
              TEAM_STATS.map((stat, i) => (
                <div key={i} className="bg-black/20 border border-white/5 p-3 rounded-lg hover:border-brand-primary/30 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className={cn("w-3 h-3", stat.iconColor)} />
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">{stat.label}</span>
                  </div>
                  <span className="text-xl font-bold text-white">{stat.value}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Next Scrim Card - High Priority (Everyone sees this) */}
        <div className="md:col-span-4 lg:col-span-2 glass-card rounded-2xl p-0 flex flex-col relative overflow-hidden group border-brand-primary/20">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary shadow-[0_0_15px_rgba(45,212,191,0.6)]" />
          <div className="p-6 relative z-10 flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-6">
              <span className="text-label text-brand-primary animate-pulse">Up Next</span>
              <span className="text-xs font-mono bg-brand-primary/10 text-brand-primary px-2 py-1 rounded border border-brand-primary/20">{NEXT_SCRIM.time}</span>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center border border-white/10 mb-2 mx-auto">
                  <span className="font-bold text-white text-lg">PRO</span>
                </div>
                <span className="text-xs font-bold text-zinc-500">US</span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-white italic px-4">VS</span>
                <span className="text-[10px] text-zinc-600 bg-black/40 px-2 rounded-full mt-1 border border-white/5">BO3</span>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-900/40 flex items-center justify-center border border-indigo-500/30 mb-2 mx-auto shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <span className="font-bold text-indigo-400 text-lg">G2</span>
                </div>
                <span className="text-xs font-bold text-indigo-400">THEM</span>
              </div>
            </div>

            <Button className="w-full mt-auto bg-white/5 hover:bg-brand-primary hover:text-black border border-white/10 text-white transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(45,212,191,0.3)]">
              <Play className="w-3 h-3 mr-2" /> Pre-Game Lobby
            </Button>
          </div>
        </div>

        {/* Main Content Area - Role Dependent */}

        {/* PLAYERS DO NOT SEE TEAM PERFORMANCE CHART */}
        {!isPlayer && (
          <div className="md:col-span-4 lg:col-span-4 glass-card rounded-2xl p-6 min-h-[300px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-primary" /> Performance Trend
                </h3>
                <p className="text-xs text-zinc-500">Win rate over last 6 weeks</p>
              </div>
              <div className="flex gap-2">
                {['1W', '1M', '3M', 'YTD'].map(range => (
                  <button key={range} className={cn("text-xs font-medium px-2 py-1 rounded hover:bg-white/10 transition-colors", range === '1M' ? "text-brand-primary bg-brand-primary/10" : "text-zinc-500")}>
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={perfData}>
                  <defs>
                    <linearGradient id="colorWinRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  {/* @ts-ignore */}
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  {/* @ts-ignore */}
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    dy={10}
                  />
                  {/* @ts-ignore */}
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    domain={[0, 100]}
                  />
                  {/* @ts-ignore */}
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number) => [`${value}%`, 'Win Rate']}
                  />
                  {/* @ts-ignore */}
                  <Area
                    type="monotone"
                    dataKey="winRate"
                    stroke="#2dd4bf"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorWinRate)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* LoL Stats - Vertical Stack (Hidden for Players) */}
        {!isPlayer && (
          <div className="md:col-span-2 lg:col-span-2 flex flex-col gap-4">
            {/* Side Stats */}
            <div className="glass-card rounded-2xl p-6 flex-1">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                <Map className="w-4 h-4 text-brand-secondary" /> Side Selection
              </h3>

              <div className="space-y-6">
                {SIDE_STATS.map((side) => (
                  <div key={side.name} className="group cursor-pointer">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <span className={cn("text-sm font-bold block transition-colors", side.name.includes('Blue') ? "text-blue-400" : "text-red-400")}>{side.name}</span>
                        <span className="text-[10px] text-zinc-500">{side.played} Games Played</span>
                      </div>
                      <span className="text-lg font-bold text-white">{side.winRate}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-1000 ease-out group-hover:shadow-[0_0_10px_currentColor]", side.color)}
                        style={{ width: `${side.winRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Objective Stats */}
            <div className="glass-card rounded-2xl p-6 flex-1">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                <Trophy className="w-4 h-4 text-yellow-500" /> Objectives
              </h3>
              <div className="space-y-4">
                {OBJECTIVE_STATS.map((obj) => (
                  <div key={obj.name} className="group">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-zinc-300">{obj.name}</span>
                      <span className={cn("text-xs font-bold", obj.color)}>{obj.value}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-1000 ease-out", obj.barColor)}
                        style={{ width: `${obj.value}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-600 text-right mt-1">{obj.total}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Scrims / Assignments */}
        <div className="md:col-span-4 lg:col-span-4 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" /> {isPlayer ? "Assigned VODs (Pending)" : "Recent Results"}
            </h3>
            <Button variant="link" className="text-xs text-brand-primary p-0">View History</Button>
          </div>

          <div className="space-y-2">
            {isPlayer ? (
              // PLAYER: Assigned VODs
              [1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-zinc-500">
                      <Play className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">Review vs G2 (Game 2)</p>
                      <p className="text-[10px] text-zinc-500">Assigned by Coach • Due Today</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs">Watch</Button>
                </div>
              ))
            ) : (
              // COACH/MANAGER: Recent Scrims
              RECENT_SCRIMS.map((scrim, i) => (
                <div key={i} className="group flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-1 h-8 rounded-full", scrim.result.startsWith('W') ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]")} />
                    <div>
                      <p className="font-bold text-white text-sm">{scrim.opponent}</p>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                        <Calendar className="w-3 h-3" /> {scrim.date}
                        <span>•</span>
                        <span className="font-mono">{scrim.format}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={cn("text-sm font-bold block", scrim.result.startsWith('W') ? "text-green-400" : "text-red-400")}>
                        {scrim.result}
                      </span>
                      <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Score</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-white transition-colors" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Roster - Compact List (Everyone sees this) */}
        <div className="md:col-span-2 lg:col-span-2 glass-card rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-brand-accent" /> Active Roster
          </h3>

          <div className="space-y-3">
            {ACTIVE_ROSTER.map((player, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-400 group-hover:border-brand-primary/50 group-hover:text-white transition-all">
                    {player.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-brand-primary transition-colors">{player.name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{player.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-zinc-300 font-mono block mb-1">
                    {player.rank.split(' ')[0]}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {isManager && (
            <Button className="w-full mt-4 border border-dashed border-zinc-700 bg-transparent hover:bg-white/5 text-zinc-500 hover:text-white text-xs h-8">
              + Manage Roster
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
