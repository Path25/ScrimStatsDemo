
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit3, Bot } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useScrimGames } from '@/hooks/useScrimGames';
import type { ScrimGame, GameStatus, GameSide } from '@/types/scrimGame';

const gameFormSchema = z.object({
  game_number: z.number().min(1, 'Game number must be at least 1'),
  status: z.enum(['scheduled', 'live', 'completed', 'cancelled']),
  side: z.enum(['blue', 'red']).optional(),
  notes: z.string().optional(),
});

type GameFormData = z.infer<typeof gameFormSchema>;

interface GameFormProps {
  scrimId: string;
  game?: ScrimGame;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function GameForm({ scrimId, game, trigger, onSuccess }: GameFormProps) {
  const [open, setOpen] = useState(false);
  const { createScrimGame, updateScrimGame, isCreating, isUpdating } = useScrimGames(scrimId);

  const form = useForm<GameFormData>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: {
      game_number: game?.game_number || 1,
      status: game?.status === 'pending' ? 'scheduled' : 
              game?.status === 'draft' ? 'scheduled' :
              game?.status === 'in_progress' ? 'live' :
              (game?.status as GameFormData['status']) || 'scheduled',
      side: game?.side || undefined,
      notes: game?.notes || '',
    },
  });

  const onSubmit = (data: GameFormData) => {
    console.log('GameForm - Submitting:', data);
    
    // Convert form status back to ScrimGame status if needed
    const scrimGameStatus: GameStatus = 
      data.status === 'scheduled' ? 'pending' :
      data.status === 'live' ? 'in_progress' :
      data.status as GameStatus;
    
    if (game) {
      // Update existing game
      updateScrimGame(
        { 
          id: game.id, 
          game_number: data.game_number,
          status: scrimGameStatus,
          side: data.side,
          notes: data.notes
        },
        {
          onSuccess: () => {
            setOpen(false);
            form.reset();
            onSuccess?.();
          },
        }
      );
    } else {
      // Create new game - ensure game_number is included
      createScrimGame(
        {
          scrim_id: scrimId,
          game_number: data.game_number,
          status: scrimGameStatus,
          side: data.side,
          notes: data.notes,
        },
        {
          onSuccess: () => {
            setOpen(false);
            form.reset();
            onSuccess?.();
          },
        }
      );
    }
  };

  const isAutoCreated = game?.auto_created;

  const defaultTrigger = game ? (
    <div className="flex items-center space-x-1">
      {isAutoCreated && (
        <Badge variant="secondary" className="text-xs">
          <Bot className="w-3 h-3 mr-1" />
          Auto
        </Badge>
      )}
      <Button variant="ghost" size="sm">
        <Edit3 className="w-4 h-4 mr-1" />
        Edit Game
      </Button>
    </div>
  ) : (
    <Button variant="outline" size="sm">
      <Plus className="w-4 h-4 mr-1" />
      Add Game
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>{game ? 'Edit Game' : 'Add New Game'}</span>
            {isAutoCreated && (
              <Badge variant="secondary" className="text-xs">
                <Bot className="w-3 h-3 mr-1" />
                Auto-Created
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {game 
              ? isAutoCreated 
                ? 'This game was automatically created from external data. You can edit the details below.'
                : 'Update the game details below.'
              : 'Create a new game for this scrim.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="game_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game Number</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      disabled={isAutoCreated}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select game status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="side"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Side</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team side (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="blue">Blue Side</SelectItem>
                      <SelectItem value="red">Red Side</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes about this game..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating || isUpdating}
              >
                {isCreating || isUpdating
                  ? (game ? 'Updating...' : 'Creating...')
                  : (game ? 'Update Game' : 'Create Game')
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
