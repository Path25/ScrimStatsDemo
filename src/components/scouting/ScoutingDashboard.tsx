import { useState } from 'react';
import { Plus, Users, BarChart3, Swords, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OpponentTeamCard } from './OpponentTeamCard';
import { OpponentTeamDialog } from './OpponentTeamDialog';
import { DraftAnalysisInsights } from './DraftAnalysisInsights';
import { useOpponentTeams } from '@/hooks/useOpponentTeams';
import { useOpponentDrafts } from '@/hooks/useOpponentDrafts';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';

export function ScoutingDashboard() {
  const { isCoach, isManager } = useRole();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const { data: opponentTeams, isLoading, deleteTeam } = useOpponentTeams();
  const { data: allDrafts = [] } = useOpponentDrafts();

  const handleEditTeam = (team: any) => {
    setEditingTeam(team);
    setIsDialogOpen(true);
  };

  const handleDeleteTeam = async (id: string) => {
    await deleteTeam(id);
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) setEditingTeam(null);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-panel p-6 rounded-2xl animate-pulse h-[200px] border border-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Compact Header & Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl sticky top-24 z-20">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground pl-2">
          <span className="text-zinc-500">ScrimStats</span>
          <ChevronRight className="w-4 h-4 text-zinc-700" />
          <span className="text-white font-medium glow-text">Scouting</span>
        </div>

        <div className="flex items-center gap-2">
          {(isCoach || isManager) && (
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="h-9 px-4 bg-brand-primary text-black hover:bg-brand-primary/90 font-bold text-xs shadow-[0_0_15px_rgba(45,212,191,0.2)]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Opponent Team
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="teams" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <TabsList className="bg-black/40 border border-white/5 p-1.5 h-auto flex gap-1.5 rounded-2xl w-fit">
          <TabsTrigger
            value="teams"
            className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-brand-primary/20 data-[state=active]:text-brand-primary data-[state=active]:glow-border text-zinc-500 hover:text-zinc-300"
          >
            <Users className="h-3.5 w-3.5 mr-2" />
            Teams ({opponentTeams?.length || 0})
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-brand-primary/20 data-[state=active]:text-brand-primary data-[state=active]:glow-border text-zinc-500 hover:text-zinc-300"
          >
            <BarChart3 className="h-3.5 w-3.5 mr-2" />
            Draft Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opponentTeams?.map((team) => (
              <OpponentTeamCard
                key={team.id}
                team={team}
                onEdit={handleEditTeam}
                onDelete={handleDeleteTeam}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 outline-none">
          <div className="flex items-center justify-between px-2">
            <div>
              <h3 className="text-xl font-bold text-white glow-text mb-1">Draft Intelligence</h3>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Aggregated data from opponent matches</p>
            </div>
            <Badge className="bg-brand-primary/10 text-brand-primary border-brand-primary/20 px-3 py-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(45,212,191,0.1)]">
              <Swords className="h-3 w-3" />
              {allDrafts.length} Matches Analyzed
            </Badge>
          </div>

          <DraftAnalysisInsights drafts={allDrafts} />
        </TabsContent>
      </Tabs>

      <OpponentTeamDialog
        open={isDialogOpen}
        onOpenChange={handleOpenChange}
        team={editingTeam}
      />
    </div>
  );
}
