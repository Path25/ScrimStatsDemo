import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { useToast } from '@/hooks/use-toast';
import { useOpponentTeams } from '@/hooks/useOpponentTeams';

const formSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters'),
  description: z.string().optional(),
  region: z.string().optional(),
  logo_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  strategic_notes: z.string().optional(),
  social_links: z.object({
    website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    twitter: z.string().optional(),
    discord: z.string().optional(),
    instagram: z.string().optional(),
  }).optional(),
  fandom_links: z.object({
    liquipedia: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    leaguepedia: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  }).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface OpponentTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team?: any; // For editing existing teams
}

const REGIONS = [
  { value: 'na1', label: 'North America' },
  { value: 'euw1', label: 'Europe West' },
  { value: 'eun1', label: 'Europe Nordic & East' },
  { value: 'kr', label: 'Korea' },
  { value: 'jp1', label: 'Japan' },
  { value: 'br1', label: 'Brazil' },
  { value: 'la1', label: 'Latin America North' },
  { value: 'la2', label: 'Latin America South' },
  { value: 'oc1', label: 'Oceania' },
  { value: 'ru', label: 'Russia' },
  { value: 'tr1', label: 'Turkey' },
];

export function OpponentTeamDialog({ open, onOpenChange, team }: OpponentTeamDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: team?.name || '',
      description: team?.description || '',
      region: team?.region || '',
      logo_url: team?.logo_url || '',
      strategic_notes: team?.strategic_notes || '',
      social_links: {
        website: team?.social_links?.website || '',
        twitter: team?.social_links?.twitter || '',
        discord: team?.social_links?.discord || '',
        instagram: team?.social_links?.instagram || '',
      },
      fandom_links: {
        liquipedia: team?.fandom_links?.liquipedia || '',
        leaguepedia: team?.fandom_links?.leaguepedia || '',
      },
    },
  });

  const { createTeam, updateTeam } = useOpponentTeams();

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const social_links = {
        website: data.social_links?.website || null,
        twitter: data.social_links?.twitter || null,
        discord: data.social_links?.discord || null,
        instagram: data.social_links?.instagram || null,
      };

      const fandom_links = {
        liquipedia: data.fandom_links?.liquipedia || null,
        leaguepedia: data.fandom_links?.leaguepedia || null,
      };

      if (team?.id) {
        await updateTeam({
          id: team.id,
          name: data.name,
          description: data.description || null,
          region: data.region || null,
          logo_url: data.logo_url || null,
          strategic_notes: data.strategic_notes || null,
          social_links,
          fandom_links,
        });
      } else {
        await createTeam({
          name: data.name,
          description: data.description || null,
          region: data.region || null,
          logo_url: data.logo_url || null,
          strategic_notes: data.strategic_notes || null,
          social_links,
          fandom_links,
        });
      }

      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving team:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {team?.id ? 'Edit' : 'Create'} Opponent Team
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter team name" {...field} />
                    </FormControl>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the team"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/logo.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="strategic_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Strategic Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Key strategic insights about this team"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Social Links</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="social_links.website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="social_links.twitter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter</FormLabel>
                      <FormControl>
                        <Input placeholder="@teamname" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Fandom Links</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fandom_links.liquipedia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Liquipedia</FormLabel>
                      <FormControl>
                        <Input placeholder="https://liquipedia.net/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fandom_links.leaguepedia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leaguepedia</FormLabel>
                      <FormControl>
                        <Input placeholder="https://lol.fandom.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (team?.id ? 'Update' : 'Create')} Team
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}