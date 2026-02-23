import { SoloQMatch } from "@/types/soloq";
import { Sword, Shield, Target, Activity } from "lucide-react";

interface SoloQGameDetailsProps {
  match: SoloQMatch;
}

export function SoloQGameDetails({ match }: SoloQGameDetailsProps) {
  // Determine random "Team" data for demo purposes since we don't store full match v5 data in mock
  // In real app this comes from Riot Match V5 API
  const team1Wins = match.win;

  return (
    <div className="p-4 bg-black/40 border-t border-white/5 space-y-4 animate-in fade-in slide-in-from-top-1">

      {/* Advanced Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold">Total Damage</div>
            <div className="text-sm font-bold text-zinc-200">24,500</div>
          </div>
          <Sword className="w-4 h-4 text-red-400 opacity-50" />
        </div>
        <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold">Damage Taken</div>
            <div className="text-sm font-bold text-zinc-200">18,200</div>
          </div>
          <Shield className="w-4 h-4 text-zinc-400 opacity-50" />
        </div>
        <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold">Control Wards</div>
            <div className="text-sm font-bold text-zinc-200">3</div>
          </div>
          <Target className="w-4 h-4 text-brand-primary opacity-50" />
        </div>
        <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold">CS / Min</div>
            <div className="text-sm font-bold text-zinc-200">{(match.cs / (match.gameDuration / 60)).toFixed(1)}</div>
          </div>
          <Activity className="w-4 h-4 text-yellow-400 opacity-50" />
        </div>
      </div>

      {/* Build Path */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h5 className="text-[10px] uppercase font-bold text-zinc-500 mb-2">Final Build</h5>
          <div className="flex gap-2">
            {[match.item0, match.item1, match.item2, match.item3, match.item4, match.item5].map((item, i) => (
              <div key={i} className="w-8 h-8 bg-zinc-800 rounded border border-white/10 flex items-center justify-center text-[8px] text-zinc-600">
                {/* In real app: <img src={itemUrl} /> */}
                {item === 0 ? "Empty" : "Item"}
              </div>
            ))}
            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-[8px] text-yellow-600 ml-2">
              Trinket
            </div>
          </div>
        </div>
        {/* Runes - Stub */}
        <div>
          <h5 className="text-[10px] uppercase font-bold text-zinc-500 mb-2">Runes</h5>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[8px] text-zinc-400">P</div>
            <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[8px] text-zinc-400 mt-1">S</div>
          </div>
        </div>
      </div>

      {/* Teams Table Stub */}
      <div>
        <h5 className="text-[10px] uppercase font-bold text-zinc-500 mb-2">Scoreboard</h5>
        <div className="grid grid-cols-2 gap-4">
          {/* Ally Team */}
          <div className="space-y-1">
            <div className={`text-xs font-bold mb-2 uppercase tracking-wide ${match.win ? "text-brand-primary" : "text-red-500"}`}>{match.win ? "Victory" : "Defeat"}</div>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center justify-between p-1.5 bg-white/5 rounded text-xs border border-transparent hover:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-zinc-700 rounded" /> {/* Champ Icon */}
                  <span className={i === 1 ? "text-white font-bold" : "text-zinc-500"}>Summoner {i}</span>
                </div>
                <span className="text-zinc-600 font-mono text-[10px]">
                  {Math.floor(Math.random() * 10)}/{Math.floor(Math.random() * 5)}/{Math.floor(Math.random() * 10)}
                </span>
              </div>
            ))}
          </div>
          {/* Enemy Team */}
          <div className="space-y-1">
            <div className={`text-xs font-bold mb-2 uppercase tracking-wide ${!match.win ? "text-brand-primary" : "text-red-500"}`}>{!match.win ? "Victory" : "Defeat"}</div>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center justify-between p-1.5 bg-white/5 rounded text-xs border border-transparent hover:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-zinc-700 rounded" />
                  <span className="text-zinc-500">Enemy {i}</span>
                </div>
                <span className="text-zinc-600 font-mono text-[10px]">
                  {Math.floor(Math.random() * 10)}/{Math.floor(Math.random() * 5)}/{Math.floor(Math.random() * 10)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
