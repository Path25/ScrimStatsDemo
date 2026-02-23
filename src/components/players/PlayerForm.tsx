
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit } from 'lucide-react';
import { usePlayersData } from '@/hooks/usePlayersData';
import type { Database } from '@/integrations/supabase/types';

type Player = Database['public']['Tables']['players']['Row'];

interface PlayerFormProps {
  player?: Player;
  trigger?: React.ReactNode;
}

const roles = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
const regions = [
  { value: 'na1', label: 'North America' },
  { value: 'euw1', label: 'Europe West' },
  { value: 'eune1', label: 'Europe Nordic & East' },
  { value: 'kr', label: 'Korea' },
  { value: 'br1', label: 'Brazil' },
  { value: 'la1', label: 'Latin America North' },
  { value: 'la2', label: 'Latin America South' },
  { value: 'oc1', label: 'Oceania' },
  { value: 'tr1', label: 'Turkey' },
  { value: 'ru', label: 'Russia' },
  { value: 'jp1', label: 'Japan' },
];

export function PlayerForm({ player, trigger }: PlayerFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    summoner_name: player?.summoner_name || '',
    riot_tag_line: player?.riot_tag_line || '',
    region: player?.region || 'na1',
    role: player?.role || '',
    rank: player?.rank || '',
    lp: player?.lp || 0,
    discord_username: player?.discord_username || '',
    notes: player?.notes || '',
  });

  const { createPlayer, updatePlayer, isCreating, isUpdating } = usePlayersData();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (player) {
      updatePlayer({ id: player.id, ...formData });
    } else {
      createPlayer(formData);
    }
    
    setOpen(false);
    if (!player) {
      setFormData({
        summoner_name: '',
        riot_tag_line: '',
        region: 'na1',
        role: '',
        rank: '',
        lp: 0,
        discord_username: '',
        notes: '',
      });
    }
  };

  const defaultTrigger = player ? (
    <Button variant="outline" size="sm">
      <Edit className="w-4 h-4" />
    </Button>
  ) : (
    <Button>
      <Plus className="w-4 h-4 mr-2" />
      Add Player
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {player ? 'Edit Player' : 'Add New Player'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="summoner_name">Summoner Name *</Label>
              <Input
                id="summoner_name"
                value={formData.summoner_name}
                onChange={(e) => setFormData(prev => ({ ...prev, summoner_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="riot_tag_line">Riot Tag Line *</Label>
              <Input
                id="riot_tag_line"
                placeholder="e.g. NA1, EUW, KR"
                value={formData.riot_tag_line}
                onChange={(e) => setFormData(prev => ({ ...prev, riot_tag_line: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="region">Region *</Label>
              <Select value={formData.region} onValueChange={(value) => setFormData(prev => ({ ...prev, region: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.value} value={region.value}>
                      {region.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discord_username">Discord Username</Label>
              <Input
                id="discord_username"
                value={formData.discord_username}
                onChange={(e) => setFormData(prev => ({ ...prev, discord_username: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rank">Rank</Label>
              <Input
                id="rank"
                placeholder="e.g., Diamond II"
                value={formData.rank}
                onChange={(e) => setFormData(prev => ({ ...prev, rank: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lp">LP</Label>
            <Input
              id="lp"
              type="number"
              value={formData.lp}
              onChange={(e) => setFormData(prev => ({ ...prev, lp: parseInt(e.target.value) || 0 }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about the player..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {player ? 'Update Player' : 'Create Player'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
