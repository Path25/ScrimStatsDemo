import { MoreHorizontal, User, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OpponentPlayerDialog } from './OpponentPlayerDialog';
import type { Database } from '@/integrations/supabase/types';

type OpponentPlayer = Database['public']['Tables']['opponent_players']['Row'] & {
  external_links?: {
    ugg?: string;
    opgg?: string;
    mobalytics?: string;
    other?: Array<{ name: string; url: string }>;
  };
};

interface OpponentPlayerCardProps {
  player: OpponentPlayer;
}

export function OpponentPlayerCard({ player }: OpponentPlayerCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const navigate = useNavigate();

  const handleViewPlayer = () => {
    navigate(`/scouting/players/${player.id}`);
  };

  const getRoleColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'top': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'jungle': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'mid': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'adc': case 'bot': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'support': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const externalLinks = player.external_links as any;
  const hasExternalLinks = externalLinks && (
    externalLinks.ugg || 
    externalLinks.opgg || 
    externalLinks.mobalytics ||
    (externalLinks.other && externalLinks.other.length > 0)
  );

  return (
    <>
      <Card className="hover:shadow-md transition-shadow group">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">
                {player.summoner_name}
              </CardTitle>
              {player.riot_id && (
                <p className="text-sm text-muted-foreground">#{player.riot_id}</p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleViewPlayer}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                Edit Player
              </DropdownMenuItem>
              {hasExternalLinks && (
                <>
                  {externalLinks?.ugg && (
                    <DropdownMenuItem onClick={() => handleExternalLink(externalLinks.ugg)}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on U.GG
                    </DropdownMenuItem>
                  )}
                  {externalLinks?.opgg && (
                    <DropdownMenuItem onClick={() => handleExternalLink(externalLinks.opgg)}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on OP.GG
                    </DropdownMenuItem>
                  )}
                  {externalLinks?.mobalytics && (
                    <DropdownMenuItem onClick={() => handleExternalLink(externalLinks.mobalytics)}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on Mobalytics
                    </DropdownMenuItem>
                  )}
                </>
              )}
              <DropdownMenuItem className="text-destructive">
                Remove Player
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {player.role && (
                <Badge className={getRoleColor(player.role)}>
                  {player.role.toUpperCase()}
                </Badge>
              )}
              {player.region && (
                <Badge variant="outline">
                  {player.region.toUpperCase()}
                </Badge>
              )}
              {!player.is_active && (
                <Badge variant="destructive">Inactive</Badge>
              )}
            </div>
            
            {player.notes && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {player.notes}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <OpponentPlayerDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        opponentTeamId={player.opponent_team_id}
        player={player}
      />
    </>
  );
}