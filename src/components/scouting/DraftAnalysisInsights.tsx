import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChampionAvatar } from "@/components/scrims/ChampionAvatar";
import { TrendingUp, TrendingDown, Minus, Target, Shield, Swords, Activity, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface DraftAnalysisInsightsProps {
  drafts: any[];
}

export function DraftAnalysisInsights({ drafts }: DraftAnalysisInsightsProps) {
  if (!drafts || drafts.length === 0) {
    return (
      <div className="glass-panel p-12 text-center rounded-2xl border border-white/5 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-white/[0.03] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5">
          <Target className="h-8 w-8 text-zinc-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Command Intelligence</h3>
        <p className="text-sm text-zinc-500 max-w-xs mx-auto">
          Record opponent match data to generate strategic insights and performance patterns.
        </p>
      </div>
    );
  }

  // Calculate statistics
  const totalGames = drafts.length;
  const wins = drafts.filter(d => d.result === 'win').length;
  const losses = drafts.filter(d => d.result === 'loss').length;
  const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

  // Side statistics
  const blueSideGames = drafts.filter(d => d.our_side === 'blue').length;
  const redSideGames = drafts.filter(d => d.our_side === 'red').length;
  const blueSideWins = drafts.filter(d => d.our_side === 'blue' && d.result === 'win').length;
  const redSideWins = drafts.filter(d => d.our_side === 'red' && d.result === 'win').length;

  // Champion frequency analysis
  const championCounts: Record<string, { picks: number; bans: number; wins: number; games: number }> = {};

  drafts.forEach(draft => {
    const enemyPicks = draft.draft_data?.picks?.enemy_picks || [];
    const enemyBans = draft.draft_data?.bans?.enemy_bans || [];
    const isWin = draft.result === 'win';

    enemyPicks.forEach(champion => {
      if (!championCounts[champion]) {
        championCounts[champion] = { picks: 0, bans: 0, wins: 0, games: 0 };
      }
      championCounts[champion].picks++;
      championCounts[champion].games++;
      if (isWin) championCounts[champion].wins++;
    });

    enemyBans.forEach(champion => {
      if (!championCounts[champion]) {
        championCounts[champion] = { picks: 0, bans: 0, wins: 0, games: 0 };
      }
      championCounts[champion].bans++;
    });
  });

  // Most picked champions (by enemy)
  const mostPicked = Object.entries(championCounts)
    .filter(([_, data]) => data.picks > 0)
    .sort((a, b) => b[1].picks - a[1].picks)
    .slice(0, 5);

  // Most banned champions (by enemy) 
  const mostBanned = Object.entries(championCounts)
    .filter(([_, data]) => data.bans > 0)
    .sort((a, b) => b[1].bans - a[1].bans)
    .slice(0, 5);

  // Performance against champions
  const champPerformance = Object.entries(championCounts)
    .filter(([_, data]) => data.games >= 2) // At least 2 games for meaningful data
    .map(([champion, data]) => ({
      champion,
      winRate: (data.wins / data.games) * 100,
      games: data.games
    }))
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Overall Stats */}
      <div className="space-y-6">
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 bg-green-500/5 blur-[50px] rounded-full group-hover:bg-green-500/10 transition-colors" />
          <div className="relative z-10">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-brand-primary" /> Tactical Efficiency
            </h4>

            <div className="grid grid-cols-3 gap-8 mb-8">
              <div className="space-y-1">
                <div className="text-3xl font-black text-green-400 tracking-tighter glow-text-sm">{wins}</div>
                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">VICTORIES</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-red-400 tracking-tighter">{losses}</div>
                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">DEFEATS</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-white tracking-tighter">{totalGames}</div>
                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">ENGAGEMENTS</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Global Success Rate</span>
                <span className="text-2xl font-black text-brand-primary tracking-tighter">{winRate.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-brand-primary shadow-[0_0_15px_rgba(45,212,191,0.4)] transition-all duration-1000"
                  style={{ width: `${winRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Side Performance */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-brand-primary" /> Regional Bias
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blueSideGames > 0 && (
              <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">BLUE SIDE</span>
                  </div>
                  <span className="text-lg font-black text-white leading-none tracking-tighter">
                    {((blueSideWins / blueSideGames) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-1000"
                    style={{ width: `${(blueSideWins / blueSideGames) * 100}%` }}
                  />
                </div>
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest text-center">{blueSideWins} Wins in {blueSideGames} Games</p>
              </div>
            )}

            {redSideGames > 0 && (
              <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-sm shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">RED SIDE</span>
                  </div>
                  <span className="text-lg font-black text-white leading-none tracking-tighter">
                    {((redSideWins / redSideGames) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)] transition-all duration-1000"
                    style={{ width: `${(redSideWins / redSideGames) * 100}%` }}
                  />
                </div>
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest text-center">{redSideWins} Wins in {redSideGames} Games</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Champion Analysis */}
      <div className="space-y-6">
        {/* Most Picked */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Swords className="h-3.5 w-3.5 text-brand-primary" /> Threat Profile: High Priority
          </h4>
          {mostPicked.length > 0 ? (
            <div className="space-y-4">
              {mostPicked.map(([champion, data], index) => (
                <div key={champion} className="group/item flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5 hover:bg-white/[0.04] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <ChampionAvatar championName={champion} size="sm" className="border border-white/10 rounded-lg group-hover/item:border-brand-primary/30 transition-colors" />
                      <div className="absolute -top-1 -left-1 w-4 h-4 bg-zinc-900 border border-white/10 rounded flex items-center justify-center text-[8px] font-black text-zinc-500">
                        0{index + 1}
                      </div>
                    </div>
                    <span className="font-bold text-white tracking-tight group-hover/item:text-brand-primary transition-colors">{champion}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-white tracking-tighter block">{data.picks}</span>
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">UNIT PICKS</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">No Intelligence Data Collected</p>
            </div>
          )}
        </div>

        {/* Most Banned */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-red-400" /> Containment: Strategic Bans
          </h4>
          {mostBanned.length > 0 ? (
            <div className="space-y-3">
              {mostBanned.map(([champion, data]) => (
                <div key={champion} className="flex items-center justify-between p-2.5 px-4 bg-red-400/[0.02] rounded-xl border border-red-400/5 hover:border-red-400/20 transition-all">
                  <div className="flex items-center gap-3">
                    <ChampionAvatar championName={champion} size="xs" className="rounded-md opacity-70" />
                    <span className="text-sm font-bold text-zinc-300">{champion}</span>
                  </div>
                  <Badge className="bg-red-400/10 text-red-400 border-red-400/20 uppercase text-[9px] font-black px-2 py-0.5">{data.bans} BANS</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">No intelligence data collected</p>
            </div>
          )}
        </div>

        {/* Performance vs Champions */}
        {champPerformance.length > 0 && (
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-brand-primary" /> Sector Security Analysis
            </h4>
            <div className="space-y-3">
              {champPerformance.map(({ champion, winRate: wr, games }) => (
                <div key={champion} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <ChampionAvatar championName={champion} size="sm" className="rounded-lg opacity-80" />
                    <div>
                      <p className="font-bold text-white text-sm tracking-tight">{champion}</p>
                      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{games} Engagements</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={cn(
                        "text-lg font-black tracking-tighter",
                        wr > 60 ? "text-green-400" : wr < 40 ? "text-red-400" : "text-white"
                      )}>{wr.toFixed(0)}%</p>
                      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">SR</span>
                    </div>
                    {wr > 60 ? (
                      <TrendingUp className="h-4 w-4 text-green-400 drop-shadow-[0_0_5px_rgba(34,197,94,0.4)]" />
                    ) : wr < 40 ? (
                      <TrendingDown className="h-4 w-4 text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.4)]" />
                    ) : (
                      <Minus className="h-4 w-4 text-zinc-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
