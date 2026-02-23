import {
  Users,
  Shield,
  Crosshair,
  Swords,
  Zap,
  Heart,
  Plus,
  MoreHorizontal,
  ChevronRight,
  Trophy,
  Target,
  Calendar,
  UserPlus,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import RoleAssignment from "@/components/players/RoleAssignment";
import { AddPlayerDialog } from "@/components/players/AddPlayerDialog";
import { usePlayersData } from "@/hooks/usePlayersData";
import { PlayerRole } from "@/types/availability";
import { useRole } from "@/contexts/RoleContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Map roles to icons
const RoleIcon = ({ role, className }: { role: string | null; className?: string }) => {
  switch (role?.toLowerCase()) {
    case 'top': return <Shield className={className} />;
    case 'jungle': return <Swords className={className} />;
    case 'mid': return <Zap className={className} />;
    case 'adc': return <Crosshair className={className} />;
    case 'support': return <Heart className={className} />;
    default: return <Users className={className} />;
  }
};

const getAvatarColor = (name: string) => {
  const colors = [
    "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500",
    "bg-lime-500", "bg-green-500", "bg-emerald-500", "bg-teal-500",
    "bg-cyan-500", "bg-sky-500", "bg-blue-500", "bg-indigo-500",
    "bg-violet-500", "bg-purple-500", "bg-fuchsia-500", "bg-pink-500",
    "bg-rose-500"
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function Players() {
  const { players, isLoading, updatePlayer, deletePlayer } = usePlayersData();
  const { isManager, isCoach } = useRole();
  const hasEditPermission = isManager || isCoach;

  // Wrapper for string IDs
  const handleRoleAssignString = (playerId: string, role: string) => {
    updatePlayer({ id: playerId, role });
  };

  const handleDelete = (playerId: string) => {
    if (window.confirm("Are you sure you want to remove this player?")) {
      deletePlayer(playerId);
    }
  };

  if (isLoading) {
    return <div className="text-white">Loading roster...</div>;
  }

  return (
    <div className="space-y-8 max-w-[1920px] mx-auto pb-10">

      {/* 1. Compact Header & Quick Actions Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl sticky top-24 z-20">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground pl-2">
          <span className="text-zinc-500">ScrimStats</span>
          <ChevronRight className="w-4 h-4 text-zinc-700" />
          <span className="text-white font-medium glow-text">Active Roster</span>
          <span className="text-xs ml-2 bg-white/10 px-2 py-0.5 rounded text-zinc-400 font-mono uppercase">{players.length} Players</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {hasEditPermission && <AddPlayerDialog />}
        </div>
      </div>

      {/* Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {players.map((player) => {
          const avatarColor = getAvatarColor(player.summoner_name || "?");
          const avatarInitial = player.summoner_name ? player.summoner_name[0].toUpperCase() : "?";

          // Placeholder Stats (until Phase 3)
          const winRate = "0%";
          const kda = "0.0";
          const cspm = "0.0";
          const matches = 0;
          const topChamps: string[] = [];

          return (
            <div
              key={player.id}
              className="glass-card group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:border-brand-primary/30 hover:shadow-[0_0_30px_rgba(45,212,191,0.1)]"
            >
              {/* Background Gradient on Hover */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${avatarColor.replace('bg-', 'from-')} to-transparent`} />

              {/* Top Row: Avatar & Actions */}
              <div className="relative z-10 flex justify-between items-start mb-6">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-300",
                  avatarColor
                )}>
                  {avatarInitial}
                </div>

                {hasEditPermission && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white hover:bg-white/10 -mt-2 -mr-2">
                        <MoreHorizontal className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
                      <DropdownMenuItem onClick={() => handleDelete(player.id)} className="text-red-400 hover:text-red-300 hover:bg-white/5 cursor-pointer">
                        <Trash2 className="w-4 h-4 mr-2" /> Remove Player
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Player Info */}
              <div className="relative z-10 mb-6">
                <h3 className="text-xl font-bold text-white group-hover:text-brand-primary transition-colors mb-1">{player.summoner_name}</h3>
                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-3">
                  <RoleIcon role={player.role} className="w-4 h-4" />
                  <span className="font-medium uppercase tracking-wider">{player.role || "UNASSIGNED"}</span>
                </div>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded border border-white/10 bg-white/5 text-xs text-zinc-300 font-mono">
                  {player.rank || "Unranked"} {player.lp ? `${player.lp} LP` : ""}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="relative z-10 grid grid-cols-2 gap-3 py-4 border-t border-white/5">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Win Rate</span>
                  <span className="text-lg font-bold text-green-400">{winRate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">KDA</span>
                  <span className="text-lg font-bold text-brand-primary">{kda}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">CSPM</span>
                  <span className="text-lg font-bold text-white">{cspm}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Matches</span>
                  <span className="text-lg font-bold text-white">{matches}</span>
                </div>
              </div>

              {/* Top Champions */}
              <div className="relative z-10 mt-4 pt-4 border-t border-white/5">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-2">Top Champions</span>
                <div className="flex gap-2">
                  {topChamps.length > 0 ? topChamps.map((champ, i) => (
                    <span key={i} className="text-xs bg-black/40 border border-white/5 px-2 py-1 rounded text-zinc-300">
                      {champ}
                    </span>
                  )) : (
                    <span className="text-xs text-zinc-600">No data</span>
                  )}
                </div>
              </div>

              {/* Role Assignment & Availability */}
              <div className="relative z-10 mt-4 pt-4 border-t border-white/5 space-y-2">
                <RoleAssignment
                  playerId={player.id as any} // Temporary cast until RoleAssignment updated
                  playerName={player.summoner_name}
                  currentRole={player.role || undefined}
                  onRoleAssign={(pid, r) => handleRoleAssignString(String(pid), r)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-white/10 text-zinc-300 hover:text-white hover:border-brand-primary/50"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Manage Availability
                </Button>
              </div>

            </div>
          )
        })}

        {/* Add New Slot (Dashed) */}
        {(hasEditPermission) && (
          <AddPlayerDialog trigger={
            <div className="border-2 border-dashed border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-zinc-600 hover:text-brand-primary hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-all cursor-pointer min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-bold">Recruit Player</span>
            </div>
          } />
        )}

      </div>
    </div>
  );
}
