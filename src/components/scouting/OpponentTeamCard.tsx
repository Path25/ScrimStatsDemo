import { MoreHorizontal, Users, Calendar, Target, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';

interface OpponentTeam {
  id: string;
  name: string;
  description?: string;
  region?: string;
  logo_url?: string;
  created_at: string;
  // Add player count from joined data
  player_count?: number;
}

interface OpponentTeamCardProps {
  team: OpponentTeam;
  onEdit?: (team: OpponentTeam) => void;
  onDelete?: (id: string) => void;
}

export function OpponentTeamCard({ team, onEdit, onDelete }: OpponentTeamCardProps) {
  const navigate = useNavigate();

  const handleViewTeam = () => {
    navigate(`/scouting/teams/${team.id}`);
  };

  const handleEditTeam = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(team);
  };

  const handleDeleteTeam = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this opponent team?')) {
      onDelete?.(team.id);
    }
  };

  const { isCoach, isManager } = useRole();
  const canManage = isCoach || isManager;

  return (
    <div
      onClick={handleViewTeam}
      className="glass-panel group relative overflow-hidden p-6 rounded-2xl border border-white/5 hover:border-brand-primary/30 transition-all cursor-pointer animate-in fade-in zoom-in-95 duration-300"
    >
      <div className="absolute top-0 right-0 p-16 bg-brand-primary/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-brand-primary/10 transition-colors" />

      <div className="relative z-10 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-14 w-14 rounded-xl border border-white/10 shadow-lg group-hover:border-brand-primary/30 transition-colors">
                <AvatarImage src={team.logo_url} alt={team.name} className="object-cover" />
                <AvatarFallback className="bg-brand-primary/10 text-brand-primary font-black text-xl">{team.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              {team.region && (
                <div className="absolute -bottom-1 -right-1 bg-black/80 border border-white/10 px-1.5 py-0.5 rounded text-[8px] font-black text-brand-primary uppercase tracking-widest shadow-lg">
                  {team.region}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-black text-white glow-text-sm group-hover:text-brand-primary transition-colors truncate tracking-tight">{team.name}</h3>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                <Globe className="w-3 h-3" /> Region: <span className="text-zinc-400">{team.region || 'GLOBAL'}</span>
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-500 hover:text-white glass-button border-transparent hover:border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-panel border-white/10 bg-black/80 backdrop-blur-xl">
              <DropdownMenuItem onClick={handleViewTeam} className="text-xs font-bold focus:bg-brand-primary/10 focus:text-brand-primary">
                <Target className="h-4 w-4 mr-2" /> View Intelligence
              </DropdownMenuItem>
              {canManage && (
                <>
                  <DropdownMenuItem onClick={handleEditTeam} className="text-xs font-bold">
                    Edit Identification
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDeleteTeam} className="text-xs font-bold text-red-400 focus:bg-red-500/10 focus:text-red-400">
                    Terminate Record
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {team.description && (
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed h-8">
            {team.description}
          </p>
        )}

        <div className="pt-2 flex items-center justify-between border-t border-white/5">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Active Roster</span>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Users className="h-3 w-3 text-brand-primary" />
                {team.player_count || 0} Players
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block">Last Modified</span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
              {new Date(team.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
