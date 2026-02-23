import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Users, TrendingUp, TrendingDown, Minus, Sword } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useOpponentPlayers } from '@/hooks/useOpponentPlayers';
import { usePlayersData } from '@/hooks/usePlayersData';

interface OpponentMatchupMatrixProps {
  opponentTeamId: string;
}

export function OpponentMatchupMatrix({ opponentTeamId }: OpponentMatchupMatrixProps) {
  const [isAddMatchupOpen, setIsAddMatchupOpen] = useState(false);
  const { data: opponentPlayers } = useOpponentPlayers(opponentTeamId);
  const { players: ourPlayers } = usePlayersData();

  // Sample matchup data - in real implementation, this would come from matchup_matrix_data table
  const matchups = [
    {
      id: '1',
      ourPlayer: 'TopLaner',
      opponentPlayer: 'EnemyTop',
      winRate: 65,
      gamesPlayed: 8,
      lastMatchup: '2024-01-15',
      performance: 'winning',
      notes: 'Strong laning phase, good teamfight execution'
    },
    {
      id: '2',
      ourPlayer: 'Jungler',
      opponentPlayer: 'EnemyJungle',
      winRate: 40,
      gamesPlayed: 5,
      lastMatchup: '2024-01-10',
      performance: 'losing',
      notes: 'Struggles with early invades, needs more vision support'
    },
    {
      id: '3',
      ourPlayer: 'MidLaner',
      opponentPlayer: 'EnemyMid',
      winRate: 50,
      gamesPlayed: 6,
      lastMatchup: '2024-01-12',
      performance: 'even',
      notes: 'Even matchup, depends on jungle pressure'
    }
  ];

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'winning': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'losing': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const getPerformanceIcon = (performance: string) => {
    switch (performance) {
      case 'winning': return <TrendingUp className="h-3 w-3" />;
      case 'losing': return <TrendingDown className="h-3 w-3" />;
      default: return <Minus className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Sword className="h-5 w-5 text-zinc-400" />
            Head-to-Head Dynamics
          </h3>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
            Historical performance mapping
          </p>
        </div>
        <Dialog open={isAddMatchupOpen} onOpenChange={setIsAddMatchupOpen}>
          <DialogTrigger asChild>
            <Button className="glass-button bg-brand-primary/10 text-brand-primary border-brand-primary/20 hover:bg-brand-primary/20">
              <Plus className="h-4 w-4 mr-2" />
              LOG MATCHUP
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-white/5 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Add Matchup Data</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ourPlayer" className="text-xs font-bold uppercase text-zinc-500">Our Player</Label>
                  <Input id="ourPlayer" placeholder="Select player" className="bg-black/40 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opponentPlayer" className="text-xs font-bold uppercase text-zinc-500">Opponent Player</Label>
                  <Input id="opponentPlayer" placeholder="Select opponent" className="bg-black/40 border-white/10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wins" className="text-xs font-bold uppercase text-zinc-500">Wins</Label>
                  <Input id="wins" type="number" placeholder="0" className="bg-black/40 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="losses" className="text-xs font-bold uppercase text-zinc-500">Losses</Label>
                  <Input id="losses" type="number" placeholder="0" className="bg-black/40 border-white/10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs font-bold uppercase text-zinc-500">Strategic Observations</Label>
                <Textarea id="notes" placeholder="Add matchup notes..." className="bg-black/40 border-white/10 min-h-[100px]" />
              </div>
              <Button onClick={() => setIsAddMatchupOpen(false)} className="bg-brand-primary text-black font-black hover:bg-brand-primary/90">
                SAVE MATCHUP ENTRY
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Matchup Cards */}
      {matchups.length === 0 ? (
        <div className="glass-panel py-16 text-center rounded-2xl border-dashed border-white/5">
          <Users className="h-12 w-12 mx-auto text-zinc-700 mb-4" />
          <h3 className="text-lg font-bold text-zinc-400 mb-2 uppercase tracking-tight">No Matchup Intelligence</h3>
          <p className="text-zinc-500 text-sm max-w-xs mx-auto mb-6">
            Start tracking individual player matchups to identify tactical advantages.
          </p>
          <Button onClick={() => setIsAddMatchupOpen(true)} className="glass-button">
            <Plus className="h-4 w-4 mr-2" />
            ADD FIRST MATCHUP
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {matchups.map((matchup) => (
            <Card key={matchup.id} className="glass-card overflow-hidden group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-6">
                    <div className="text-center space-y-1">
                      <div className="text-sm font-black text-white group-hover:text-brand-primary transition-colors">{matchup.ourPlayer.toUpperCase()}</div>
                      <div className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase">OUR TEAM</div>
                    </div>

                    <div className="relative px-4">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-px h-8 bg-white/5" />
                      </div>
                      <div className="relative bg-zinc-950 px-2 text-[10px] font-black text-zinc-700">VS</div>
                    </div>

                    <div className="text-center space-y-1">
                      <div className="text-sm font-black text-white">{matchup.opponentPlayer.toUpperCase()}</div>
                      <div className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase">OPPONENT</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className={cn("px-2 py-1 flex items-center gap-1.5 font-black text-[10px]", getPerformanceColor(matchup.performance))}>
                      {getPerformanceIcon(matchup.performance)}
                      {matchup.winRate}% WR
                    </Badge>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                      {matchup.gamesPlayed} GAMES
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      <span>Lethality Index</span>
                      <span className="text-white">{matchup.winRate}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-primary shadow-[0_0_10px_rgba(45,212,191,0.5)] transition-all duration-1000"
                        style={{ width: `${matchup.winRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col justify-end">
                    <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Last Engagement</div>
                    <div className="text-xs font-medium text-zinc-400">
                      {new Date(matchup.lastMatchup).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                    </div>
                  </div>

                  <div className="flex flex-col justify-end text-right">
                    <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Historical Record</div>
                    <div className="text-xs font-black text-zinc-200">
                      <span className="text-green-500">{Math.round(matchup.gamesPlayed * matchup.winRate / 100)}W</span>
                      <span className="mx-1 text-zinc-700">-</span>
                      <span className="text-red-500">{matchup.gamesPlayed - Math.round(matchup.gamesPlayed * matchup.winRate / 100)}L</span>
                    </div>
                  </div>
                </div>

                {matchup.notes && (
                  <div className="mt-6 p-3 bg-black/40 rounded-xl border border-white/5">
                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                      <div className="w-1 h-1 bg-brand-primary rounded-full animate-pulse" />
                      Tactical Notes
                    </div>
                    <div className="text-xs text-zinc-400 leading-relaxed font-medium italic">{matchup.notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
