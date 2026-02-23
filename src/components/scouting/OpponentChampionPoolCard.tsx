import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { MoreHorizontal, Edit, Trash2, Star } from "lucide-react";
import { ChampionAvatar } from "@/components/scrims/ChampionAvatar";

interface OpponentChampionPool {
  id: string;
  opponent_player_id: string;
  champion_name: string;
  pool_type: string;
  confidence_level: number;
  games_played: number;
  win_rate: number | null;
  last_played: string | null;
  notes: string | null;
}

interface OpponentChampionPoolCardProps {
  championPool: OpponentChampionPool;
  onEdit: (championPool: OpponentChampionPool) => void;
  onDelete: (id: string) => void;
}

const getPoolTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'main':
      return 'bg-primary text-primary-foreground';
    case 'comfort':
      return 'bg-secondary text-secondary-foreground';
    case 'pocket':
      return 'bg-accent text-accent-foreground';
    case 'situational':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getConfidenceStars = (level: number) => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`h-3 w-3 ${
        i < level ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
      }`}
    />
  ));
};

export function OpponentChampionPoolCard({ championPool, onEdit, onDelete }: OpponentChampionPoolCardProps) {
  const winRatePercentage = championPool.win_rate ? Math.round(championPool.win_rate * 100) : null;
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <ChampionAvatar championName={championPool.champion_name} size="sm" />
            <div>
              <CardTitle className="text-base">{championPool.champion_name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="secondary" 
                  className={getPoolTypeColor(championPool.pool_type)}
                >
                  {championPool.pool_type}
                </Badge>
                <div className="flex items-center gap-1">
                  {getConfidenceStars(championPool.confidence_level)}
                </div>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(championPool)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(championPool.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Games:</span>
            <span className="ml-1 font-medium">{championPool.games_played}</span>
          </div>
          {winRatePercentage !== null && (
            <div>
              <span className="text-muted-foreground">Win Rate:</span>
              <span className="ml-1 font-medium">{winRatePercentage}%</span>
            </div>
          )}
        </div>
        
        {winRatePercentage !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Win Rate</span>
              <span>{winRatePercentage}%</span>
            </div>
            <Progress value={winRatePercentage} className="h-2" />
          </div>
        )}
        
        {championPool.last_played && (
          <div className="text-xs text-muted-foreground">
            Last played: {new Date(championPool.last_played).toLocaleDateString()}
          </div>
        )}
        
        {championPool.notes && (
          <div className="text-sm">
            <span className="text-muted-foreground">Notes:</span>
            <p className="text-xs mt-1 text-muted-foreground">{championPool.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}