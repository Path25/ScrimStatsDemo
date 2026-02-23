import {
  History,
  Play,
  Swords,
  Brain,
  ChevronRight,
  Monitor,
  Activity,
  Shield,
  Zap,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DRAFT_HISTORY } from "@/data/mockData";
import { ChampionAvatar } from "@/components/scrims/ChampionAvatar";

export default function DraftAnalysis() {
  return (
    <div className="space-y-6 max-w-[1920px] mx-auto pb-10">

      {/* Compact Header & Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl sticky top-24 z-20">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground pl-2">
          <span className="text-zinc-500">ScrimStats</span>
          <ChevronRight className="w-4 h-4 text-zinc-700" />
          <span className="text-white font-medium glow-text">Draft Intelligence</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-9 px-4 text-xs font-bold text-zinc-400 hover:text-white glass-button border-transparent">
            <History className="w-3.5 h-3.5 mr-2" /> Sync Match History
          </Button>
          <Button className="h-9 px-4 bg-brand-primary text-black hover:bg-brand-primary/90 font-bold text-xs shadow-[0_0_15px_rgba(45,212,191,0.2)]">
            <Play className="w-3.5 h-3.5 mr-2" /> Run Draft Simulator
          </Button>
        </div>
      </div>

      {/* Main Draft Board (Interactive/Visual) */}
      <section className="glass-panel p-8 rounded-2xl relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-blue-500/50 via-brand-primary/20 to-red-500/50" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-brand-primary/5 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white glow-text-sm tracking-tighter">BLUE ALLIANCE</h2>
              <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest">First Pick Priority</p>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="px-6 py-2 rounded-2xl bg-black/60 border border-white/10 text-xs font-black text-brand-primary uppercase tracking-[0.3em] shadow-xl backdrop-blur-xl">
              SYNCHRONIZING
            </div>
            <div className="mt-2 flex gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">AI ACTIVE</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <h2 className="text-xl font-black text-white tracking-tighter">RED COALITION</h2>
              <p className="text-[10px] font-black text-red-500/60 uppercase tracking-widest">Counter-Pick Advantage</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <Swords className="w-5 h-5 text-red-400" />
            </div>
          </div>
        </div>

        {/* Visual Picks */}
        <div className="grid grid-cols-5 gap-8 mb-12">
          {/* Blue Picks */}
          <div className="col-span-2 grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={`blue-${i}`} className="aspect-[2/3] glass-panel-dark border-white/5 rounded-xl flex flex-col items-center justify-center relative overflow-hidden group/card hover:border-blue-500/30 transition-all cursor-pointer">
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">P{i}</div>
                <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center mb-1 group-hover/card:border-blue-500/20">
                  <Zap className="w-3.5 h-3.5 text-zinc-700 group-hover/card:text-blue-500 transition-colors" />
                </div>
                <div className="mt-1 h-3 w-12 bg-white/5 rounded-full" />
              </div>
            ))}
          </div>

          {/* Center Analysis Area */}
          <div className="col-span-1 flex flex-col justify-center items-center gap-4 px-4 overflow-hidden">
            <div className="w-full p-4 glass-panel border-white/5 rounded-xl bg-brand-primary/5 flex flex-col items-center group/analysis cursor-pointer hover:bg-brand-primary/10 transition-all">
              <Brain className="w-6 h-6 text-brand-primary mb-2 animate-pulse" />
              <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest">Analyze Synergy</span>
            </div>
            <Button variant="ghost" size="sm" className="w-full text-[9px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">
              <RotateCcw className="w-3 h-3 mr-2" /> Reset Simulator
            </Button>
          </div>

          {/* Red Picks */}
          <div className="col-span-2 grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={`red-${i}`} className="aspect-[2/3] glass-panel-dark border-white/5 rounded-xl flex flex-col items-center justify-center relative overflow-hidden group/card hover:border-red-500/30 transition-all cursor-pointer">
                <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">P{i}</div>
                <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center mb-1 group-hover/card:border-red-500/20">
                  <Zap className="w-3.5 h-3.5 text-zinc-700 group-hover/card:text-red-500 transition-colors" />
                </div>
                <div className="mt-1 h-3 w-12 bg-white/5 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Bans Row */}
        <div className="flex justify-between items-center px-4 pt-6 border-t border-white/5">
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-black text-blue-500/60 uppercase tracking-widest mb-1">Forbidden Units</span>
            <div className="flex gap-2.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={`ban-blue-${i}`} className="w-11 h-11 bg-black/40 border border-white/5 rounded-lg flex items-center justify-center grayscale opacity-40 hover:opacity-100 hover:grayscale-0 hover:border-red-500/30 transition-all cursor-pointer">
                  <div className="w-7 h-7 bg-white/[0.03] rounded border border-white/5" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            Selection Phase Ongoing
          </div>

          <div className="flex flex-col gap-2 items-end">
            <span className="text-[9px] font-black text-red-500/60 uppercase tracking-widest mb-1">Forbidden Units</span>
            <div className="flex gap-2.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={`ban-red-${i}`} className="w-11 h-11 bg-black/40 border border-white/5 rounded-lg flex items-center justify-center grayscale opacity-40 hover:opacity-100 hover:grayscale-0 hover:border-red-500/30 transition-all cursor-pointer">
                  <div className="w-7 h-7 bg-white/[0.03] rounded border border-white/5" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Recent Drafts List */}
      <section className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" /> Intelligence Archive: Draft History
          </h3>
          <Badge className="bg-black/40 border border-white/5 text-zinc-500 text-[9px] font-black uppercase tracking-widest px-3 py-1">
            {DRAFT_HISTORY.length} Records Found
          </Badge>
        </div>

        <div className="grid gap-3">
          {DRAFT_HISTORY.map((draft) => (
            <div key={draft.id} className="glass-panel hover:bg-white/[0.04] transition-all p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group border border-white/5 hover:border-brand-primary/20 cursor-pointer">
              <div className="flex items-center gap-6 flex-1">
                <div className={cn(
                  "w-1.5 h-12 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                  draft.result === 'Win' ? "bg-green-500 shadow-green-500/20" : "bg-red-500 shadow-red-500/20"
                )} />

                <div className="min-w-[180px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-black text-white glow-text-sm tracking-tight">{draft.vs}</span>
                    <Badge className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-2 py-0.5",
                      draft.result === 'Win' ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                    )}>
                      {draft.result}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    <span className={cn(draft.perspective === 'Blue' ? "text-blue-400" : "text-red-400")}>{draft.perspective} SIDE</span>
                    <span className="text-zinc-800">•</span>
                    <span className="flex items-center gap-1.5">
                      <History className="w-3 h-3" /> {draft.date}
                    </span>
                  </div>
                </div>

                <div className="hidden lg:flex flex-col gap-1 px-8 border-x border-white/5">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Victory Prob.</span>
                  <span className="text-xl font-black text-brand-primary tracking-tighter">{draft.winProb}</span>
                </div>
              </div>

              {/* Champion Indicators */}
              <div className="flex items-center gap-4 w-full md:w-auto overflow-hidden">
                <div className="flex flex-col items-end gap-1.5 min-w-[120px]">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Banned Intelligence</span>
                  <div className="flex -space-x-1.5">
                    {draft.bans && draft.bans.length > 0 ? draft.bans.slice(0, 5).map((ban, i) => (
                      <div key={i} className="relative group/ban">
                        <ChampionAvatar championName={ban} size="xs" className="rounded-full border border-zinc-900 grayscale opacity-50 group-hover/ban:grayscale-0 group-hover/ban:opacity-100 transition-all cursor-crosshair scale-90" />
                        <div className="absolute inset-0 bg-red-500/20 rounded-full" />
                      </div>
                    )) : (
                      <span className="text-[10px] text-zinc-700 font-bold">N/A</span>
                    )}
                  </div>
                </div>

                <div className="h-10 w-[1px] bg-white/5 mx-2" />

                <div className="flex flex-col gap-1.5 flex-1 md:flex-none">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Operational Roster</span>
                  <div className="flex gap-1.5">
                    {draft.picks && draft.picks.length > 0 ? draft.picks.map((pick, i) => (
                      <div key={i} className="relative group/pick">
                        <ChampionAvatar championName={pick.champ} size="sm" className={cn(
                          "rounded-lg border transition-all",
                          pick.side === 'Blue' ? "border-blue-500/20 opacity-80" : "border-red-500/20 opacity-80"
                        )} />
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black",
                          pick.side === 'Blue' ? "bg-blue-500" : "bg-red-500"
                        )} />
                      </div>
                    )) : (
                      <span className="text-[10px] text-zinc-700 font-bold italic">INCOMPLETE DATA</span>
                    )}
                  </div>
                </div>
              </div>

              <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-500 hover:text-white glass-button border-transparent hover:border-white/10 ml-4 hidden md:flex">
                <Monitor className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}