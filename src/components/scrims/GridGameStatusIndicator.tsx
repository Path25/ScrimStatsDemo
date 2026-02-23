
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, AlertCircle, RefreshCw, Edit, Timer } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ScrimGame } from '@/types/scrimGame';
import type { PendingGameUpdate } from '@/hooks/useGridMonitoring';

interface GridGameStatusIndicatorProps {
  game: ScrimGame;
  pendingUpdate?: PendingGameUpdate;
  onManualDraft?: () => void;
  onRefreshData?: () => void;
}

export const GridGameStatusIndicator: React.FC<GridGameStatusIndicatorProps> = ({
  game,
  pendingUpdate,
  onManualDraft,
  onRefreshData
}) => {
  const isPlaceholder = game.external_game_data?.grid_metadata?.created_as_placeholder;
  const hasManualDraft = !!game.external_game_data?.draft_data;
  const isCompleted = game.status === 'completed';
  const gridState = game.external_game_data?.grid_metadata?.gameState;
  const lastUpdated = game.external_game_data?.grid_metadata?.last_updated;

  const getStatusInfo = () => {
    if (isCompleted && !isPlaceholder) {
      return {
        icon: <CheckCircle2 className="w-3 h-3" />,
        text: 'Complete with GRID data',
        variant: 'default' as const,
        color: 'bg-green-500'
      };
    }
    
    if (isPlaceholder && pendingUpdate) {
      return {
        icon: <Timer className="w-3 h-3 animate-pulse" />,
        text: `Waiting for GRID data (${pendingUpdate.attempts}/${pendingUpdate.maxAttempts})`,
        variant: 'outline' as const,
        color: 'bg-yellow-500'
      };
    }
    
    if (isPlaceholder) {
      return {
        icon: <Clock className="w-3 h-3 animate-pulse" />,
        text: 'Waiting for GRID data',
        variant: 'outline' as const,
        color: 'bg-yellow-500'
      };
    }
    
    return {
      icon: <AlertCircle className="w-3 h-3" />,
      text: 'Manual data only',
      variant: 'outline' as const,
      color: 'bg-gray-500'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        {statusInfo.icon}
        {statusInfo.text}
      </Badge>

      {hasManualDraft && (
        <Badge variant="outline" className="flex items-center gap-1">
          <Edit className="w-3 h-3" />
          Manual Draft
        </Badge>
      )}

      {game.external_game_data?.grid_metadata && (
        <Badge variant="outline" className="flex items-center gap-1">
          GRID
        </Badge>
      )}

      {pendingUpdate && (
        <span className="text-xs text-muted-foreground">
          Last attempt: {formatDistanceToNow(pendingUpdate.lastAttempt, { addSuffix: true })}
        </span>
      )}

      {isPlaceholder && (
        <div className="flex items-center gap-1">
          {onManualDraft && (
            <Button variant="outline" size="sm" onClick={onManualDraft}>
              <Edit className="w-3 h-3 mr-1" />
              Add Draft
            </Button>
          )}
          
          {onRefreshData && (
            <Button variant="outline" size="sm" onClick={onRefreshData}>
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </Button>
          )}
        </div>
      )}

      {lastUpdated && !pendingUpdate && (
        <span className="text-xs text-muted-foreground">
          Updated {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
        </span>
      )}
    </div>
  );
};
