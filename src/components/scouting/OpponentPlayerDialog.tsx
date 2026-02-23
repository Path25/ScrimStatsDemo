import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useOpponentPlayers } from '@/hooks/useOpponentPlayers';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  summoner_name: z.string().min(1, 'Summoner name is required'),
  riot_id: z.string().optional(),
  role: z.string().optional(),
  region: z.string().optional(),
  is_active: z.boolean().default(true),
  notes: z.string().optional(),
  external_links: z.object({
    ugg: z.string().url().optional().or(z.literal('')),
    opgg: z.string().url().optional().or(z.literal('')),
    mobalytics: z.string().url().optional().or(z.literal('')),
  }).optional(),
});

interface OpponentPlayer {
  id: string;
  summoner_name: string;
  riot_id?: string;
  role?: string;
  region?: string;
  notes?: string;
  is_active?: boolean;
  external_links?: {
    ugg?: string;
    opgg?: string;
    mobalytics?: string;
    other?: Array<{ name: string; url: string }>;
  };
  opponent_team_id: string;
}

interface OpponentPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opponentTeamId: string;
  player?: OpponentPlayer;
}

const ROLES = [
  { value: 'top', label: 'Top' },
  { value: 'jungle', label: 'Jungle' },
  { value: 'mid', label: 'Mid' },
  { value: 'adc', label: 'ADC' },
  { value: 'support', label: 'Support' },
];

const REGIONS = [
  { value: 'na1', label: 'NA' },
  { value: 'euw1', label: 'EUW' },
  { value: 'eun1', label: 'EUNE' },
  { value: 'kr', label: 'KR' },
  { value: 'jp1', label: 'JP' },
  { value: 'br1', label: 'BR' },
  { value: 'la1', label: 'LAN' },
  { value: 'la2', label: 'LAS' },
  { value: 'oc1', label: 'OCE' },
  { value: 'tr1', label: 'TR' },
  { value: 'ru', label: 'RU' },
];

export function OpponentPlayerDialog({
  open,
  onOpenChange,
  opponentTeamId,
  player
}: OpponentPlayerDialogProps) {
  const { toast } = useToast();
  const { createPlayer, updatePlayer } = useOpponentPlayers(opponentTeamId);
  const isEditing = !!player;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      summoner_name: '',
      riot_id: '',
      role: '',
      region: 'na1',
      is_active: true,
      notes: '',
      external_links: {
        ugg: '',
        opgg: '',
        mobalytics: '',
      },
    },
  });

  useEffect(() => {
    if (player) {
      form.reset({
        summoner_name: player.summoner_name,
        riot_id: player.riot_id || '',
        role: player.role || '',
        region: player.region || 'na1',
        is_active: player.is_active ?? true,
        notes: player.notes || '',
        external_links: {
          ugg: player.external_links?.ugg || '',
          opgg: player.external_links?.opgg || '',
          mobalytics: player.external_links?.mobalytics || '',
        },
      });
    } else {
      form.reset({
        summoner_name: '',
        riot_id: '',
        role: '',
        region: 'na1',
        is_active: true,
        notes: '',
        external_links: {
          ugg: '',
          opgg: '',
          mobalytics: '',
        },
      });
    }
  }, [player, form, open]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const playerData = {
        ...values,
        opponent_team_id: opponentTeamId,
        external_links: {
          ugg: values.external_links?.ugg || null,
          opgg: values.external_links?.opgg || null,
          mobalytics: values.external_links?.mobalytics || null,
          other: [],
        },
      };

      if (isEditing) {
        await updatePlayer({
          id: player!.id,
          ...playerData,
        });
        toast({
          title: 'Player Updated',
          description: 'Player information has been successfully updated.',
        });
      } else {
        await createPlayer(playerData);
        toast({
          title: 'Player Added',
          description: 'New player has been successfully added to the team.',
        });
      }

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: isEditing
          ? 'Failed to update player. Please try again.'
          : 'Failed to add player. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Player' : 'Add New Player'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="external">External Links</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="summoner_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Summoner Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter summoner name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="riot_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Riot ID (Tag)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. NA1, EUW, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ROLES.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select region" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {REGIONS.map((region) => (
                              <SelectItem key={region.value} value={region.value}>
                                {region.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Player</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Mark as inactive if the player is no longer with the team
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="external" className="space-y-4 mt-6">
                <FormField
                  control={form.control}
                  name="external_links.opgg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OP.GG Profile</FormLabel>
                      <FormControl>
                        <Input placeholder="https://op.gg/summoners/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="external_links.ugg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>U.GG Profile</FormLabel>
                      <FormControl>
                        <Input placeholder="https://u.gg/lol/profile/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="external_links.mobalytics"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobalytics Profile</FormLabel>
                      <FormControl>
                        <Input placeholder="https://mobalytics.gg/lol/profile/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="notes" className="space-y-4 mt-6">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any strategic notes, playstyle observations, or other relevant information about this player..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createPlayer.isPending || updatePlayer.isPending}
              >
                {isEditing ? 'Update Player' : 'Add Player'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}