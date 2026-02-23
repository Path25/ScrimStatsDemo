
import { useState } from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useScrimGames } from '@/hooks/useScrimGames';
import { useTenant } from '@/contexts/TenantContext';
import type { ScrimGame } from '@/types/scrimGame';

interface GameActionsProps {
  game: ScrimGame;
  scrimId: string;
}

export function GameActions({ game, scrimId }: GameActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteScrimGame, isDeleting } = useScrimGames(scrimId);
  const { tenant } = useTenant();

  const canDelete = tenant?.userRole === 'owner' || tenant?.userRole === 'admin';

  const handleDelete = async () => {
    deleteScrimGame(game.id);
    setShowDeleteDialog(false);
  };

  if (!canDelete) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Game
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              <span>Delete Game</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete Game {game.game_number}? 
              This action cannot be undone and will remove all associated data including participants and live game data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Game</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Game'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
