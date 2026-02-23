
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserX, Shield, Target, Sword, TrendingUp, User } from 'lucide-react';
import { PlayerForm } from './PlayerForm';
import { usePlayersData } from '@/hooks/usePlayersData';
import type { Database } from '@/integrations/supabase/types';

type Player = Database['public']['Tables']['players']['Row'];

interface PlayerCardProps {
  player: Player;
}

const roleIcons = {
  'Top': Shield,
  'Jungle': Target,
  'Mid': Sword,
  'ADC': TrendingUp,
  'Support': User,
};

const roleColors = {
  'Top': 'bg-red-500/20 text-red-500',
  'Jungle': 'bg-green-500/20 text-green-500',
  'Mid': 'bg-blue-500/20 text-blue-500',
  'ADC': 'bg-orange-500/20 text-orange-500',
  'Support': 'bg-purple-500/20 text-purple-500',
};

export function PlayerCard({ player }: PlayerCardProps) {
  const { deletePlayer, isDeleting } = usePlayersData();
  const RoleIcon = roleIcons[player.role as keyof typeof roleIcons] || User;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={player.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-electric-500 to-brand-600 text-white font-bold">
                {player.summoner_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{player.summoner_name}</h3>
              {player.riot_id && (
                <p className="text-sm text-muted-foreground">{player.riot_id}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <PlayerForm player={player} />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isDeleting}>
                  <UserX className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Player</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove {player.summoner_name} from the roster? 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deletePlayer(player.id)}>
                    Remove Player
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {player.role && (
          <div className="flex items-center space-x-2">
            <RoleIcon className="w-4 h-4" />
            <Badge className={roleColors[player.role as keyof typeof roleColors] || 'bg-gray-500/20 text-gray-500'}>
              {player.role}
            </Badge>
          </div>
        )}
        
        {(player.rank || player.lp) && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Rank:</span>
            <span className="font-medium">
              {player.rank} {player.lp ? `(${player.lp} LP)` : ''}
            </span>
          </div>
        )}

        {player.discord_username && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Discord:</span>
            <span className="font-medium">{player.discord_username}</span>
          </div>
        )}

        {player.notes && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-sm text-muted-foreground">{player.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
