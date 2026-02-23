
import { Eye, Clock, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GameActions } from './GameActions';
import { determineGameResult } from '@/utils/gameResultHelpers';
import type { ScrimGame } from '@/types/scrimGame';

interface GameCardProps {
  game: ScrimGame;
  onViewDetails: () => void;
}

export function GameCard({ game, onViewDetails }: GameCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-performance-excellent/20 text-performance-excellent';
      case 'in_progress':
        return 'bg-electric-500/20 text-electric-500 animate-pulse';
      case 'draft':
        return 'bg-performance-average/20 text-performance-average';
      case 'pending':
        return 'bg-muted/20 text-muted-foreground';
      case 'cancelled':
        return 'bg-performance-terrible/20 text-performance-terrible';
      default:
        return 'bg-muted/20 text-muted-foreground';
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'win':
        return 'text-performance-excellent';
      case 'loss':
        return 'text-performance-terrible';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const result = determineGameResult(game);

  return (
    <Card className="glass-card hover:esports-glow transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-center min-w-[60px]">
              <p className="text-sm font-medium">Game {game.game_number}</p>
              {game.side && (
                <Badge variant="outline" className={`text-xs mt-1 ${
                  game.side === 'blue' ? 'text-blue-400 border-blue-400' : 'text-red-400 border-red-400'
                }`}>
                  {game.side}
                </Badge>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <Badge className={getStatusColor(game.status)}>
                  {game.status === 'in_progress' ? 'Live' : game.status}
                </Badge>
                
                {result && (
                  <Badge variant="outline" className={getResultColor(result)}>
                    {result.toUpperCase()}
                  </Badge>
                )}
                
                {game.auto_created && (
                  <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400">
                    Auto
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                {game.our_team_kills !== undefined && game.enemy_team_kills !== undefined && (
                  <div className="flex items-center space-x-1">
                    <Target className="w-3 h-3" />
                    <span>{game.our_team_kills} - {game.enemy_team_kills}</span>
                  </div>
                )}
                
                {game.our_team_gold !== undefined && game.enemy_team_gold !== undefined && (
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>{(game.our_team_gold / 1000).toFixed(1)}k - {(game.enemy_team_gold / 1000).toFixed(1)}k</span>
                  </div>
                )}
                
                {game.duration_seconds && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDuration(game.duration_seconds)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={onViewDetails}>
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <GameActions game={game} scrimId={game.scrim_id} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
