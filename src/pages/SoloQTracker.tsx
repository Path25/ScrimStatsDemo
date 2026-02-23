import {
  TrendingUp,
  Activity,
  Users,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Clock,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSoloQData } from "@/hooks/useSoloQData";
import { PlayerExpansionPanel } from "@/components/soloq/PlayerExpansionPanel";
import { useState, Fragment } from "react";
import { formatDistanceToNow } from "date-fns";
import { SoloQPlayer } from "@/types/soloq";

export default function SoloQTracker() {
  const { players, isLoading, isRefreshing, refreshData } = useSoloQData();
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  const toggleExpand = (playerId: string) => {
    setExpandedPlayerId(prev => prev === playerId ? null : playerId);
  };

  return (
    <div className="space-y-6 max-w-[1920px] mx-auto pb-10">

      {/* Compact Header & Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl sticky top-24 z-20">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground pl-2">
          <span className="text-zinc-500">ScrimStats</span>
          <ChevronRight className="w-4 h-4 text-zinc-700" />
          <span className="text-white font-medium glow-text">SoloQ Tracker</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <Button
            variant="outline"
            className="glass-button h-9 px-4 border-white/5 text-zinc-300 hover:text-white hover:border-brand-primary/30 transition-all font-bold text-xs"
            onClick={refreshData}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-2", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Syncing..." : "Refresh Data"}
          </Button>
          <Button className="h-9 px-4 bg-brand-primary text-black hover:bg-brand-primary/90 font-bold text-xs shadow-[0_0_15px_rgba(45,212,191,0.2)]">
            <Users className="w-3.5 h-3.5 mr-2" /> Manage Accounts
          </Button>
        </div>
      </div>

      {/* Leaderboard */}
      <section className="glass-panel rounded-2xl overflow-hidden p-6 relative min-h-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-1">
              <Activity className="w-3.5 h-3.5 text-brand-primary" /> Live Leaderboard
            </h3>
            <p className="text-xs text-zinc-400">Real-time rank monitoring for the active roster</p>
          </div>
          {isRefreshing && (
            <span className="text-[10px] font-black text-brand-primary animate-pulse flex items-center gap-2 bg-brand-primary/5 px-2.5 py-1 rounded-full border border-brand-primary/20 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(45,212,191,0.8)]"></span> Live Updates
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="pb-5 pl-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Player</th>
                  <th className="pb-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Rank</th>
                  <th className="pb-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">LP Trend (24h)</th>
                  <th className="pb-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Win Rate</th>
                  <th className="pb-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Last Played</th>
                  <th className="pb-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Practice Pool</th>
                  <th className="pb-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right pr-4">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {players.sort((a, b) => b.leaguePoints - a.leaguePoints).map((player, i) => (
                  <Fragment key={player.id}>
                    <tr
                      onClick={() => toggleExpand(player.id)}
                      className={cn(
                        "group hover:bg-white/[0.04] transition-all cursor-pointer relative",
                        expandedPlayerId === player.id && "bg-white/[0.02]"
                      )}
                    >
                      <td className="py-5 pl-4 relative">
                        {expandedPlayerId === player.id && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-primary glow-border" />}
                        <div className="flex items-center gap-4">
                          <span className="text-zinc-500 font-black text-[10px] w-5 opacity-50">{(i + 1).toString().padStart(2, '0')}</span>
                          <span className="font-bold text-white group-hover:text-brand-primary group-hover:glow-text transition-all tracking-tight">{player.name}</span>
                          {i === 0 && <span className="px-1.5 py-0.5 bg-brand-primary/10 text-brand-primary rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-[0_0_10px_rgba(45,212,191,0.2)] border border-brand-primary/20">
                            <TrendingUp className="w-2.5 h-2.5" /> MVP
                          </span>}
                        </div>
                      </td>
                      <td className="py-5">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2.5 h-2.5 rounded-full ring-2 ring-white/5",
                            player.tier === 'CHALLENGER' ? 'bg-brand-primary shadow-[0_0_8px_rgba(45,212,191,0.6)]' :
                              player.tier === 'GRANDMASTER' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' :
                                'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                          )} />
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-white leading-none mb-1">{player.tier}</span>
                            <span className="text-[10px] font-bold text-zinc-500 font-mono tracking-tighter">{player.leaguePoints} LP</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-5">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[10px] font-black px-2 py-1 rounded-lg border flex items-center gap-1",
                            player.lpTrend >= 0
                              ? "bg-green-500/10 border-green-500/20 text-green-400"
                              : "bg-red-500/10 border-red-500/20 text-red-400"
                          )}>
                            {player.lpTrend >= 0 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {Math.abs(player.lpTrend)} LP
                          </span>
                        </div>
                      </td>
                      <td className="py-5">
                        <div className="flex flex-col gap-1.5 w-24">
                          <div className="flex justify-between items-center px-0.5">
                            <span className="text-[10px] font-black text-white">{Math.round((player.wins / (player.wins + player.losses)) * 100)}%</span>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">{player.wins + player.losses} GP</span>
                          </div>
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div
                              className="h-full bg-brand-primary shadow-[0_0_8px_rgba(45,212,191,0.4)] transition-all duration-1000"
                              style={{ width: `${(player.wins / (player.wins + player.losses)) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-5">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Clock className="w-3 h-3 opacity-50" />
                          <span className="text-xs font-medium tracking-tight whitespace-nowrap">
                            {formatDistanceToNow(player.lastUpdated, { addSuffix: true })}
                          </span>
                        </div>
                      </td>
                      <td className="py-5">
                        <div className="flex gap-1.5">
                          {player.championStats.slice(0, 3).map((stat, ci) => (
                            <span key={ci} className="text-[9px] font-black bg-white/5 border border-white/10 px-2 py-1 rounded text-zinc-400 uppercase tracking-tighter group-hover:border-white/20 transition-colors">
                              {stat.championName}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-5 text-right pr-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 group-hover:text-white glass-button border-transparent group-hover:border-white/10">
                          {expandedPlayerId === player.id ? <ChevronUp className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      </td>
                    </tr>
                    {/* Expansion Panel Row */}
                    {expandedPlayerId === player.id && (
                      <tr>
                        <td colSpan={7} className="p-0 border-b border-white/[0.05] bg-black/40">
                          <PlayerExpansionPanel player={player} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Bottom Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
        <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Team Activity Index</h4>
          <div className="text-4xl font-black text-white glow-text mb-2 tracking-tighter">VERY HIGH</div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">+12.4% WEEKLY</span>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Highest Climber</h4>
          {players.length > 0 && (
            <>
              <div className="text-4xl font-black text-brand-primary glow-text-sm mb-2 tracking-tight">{players[0].name.toUpperCase()}</div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-primary/10 rounded-full border border-brand-primary/20">
                <ChevronUp className="w-3 h-3 text-brand-primary" />
                <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">+{players[0].lpTrend} LP GAINED</span>
              </div>
            </>
          )}
        </div>

        <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden group md:col-span-2 lg:col-span-1">
          <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Server Rank Average</h4>
          <div className="text-4xl font-black text-zinc-300 mb-2 tracking-tighter">LP 842.5</div>
          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">GRANDMASTER AVG</div>
        </div>
      </div>

    </div>
  );
}
