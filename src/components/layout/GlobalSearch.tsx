
import { useState, useEffect } from 'react';
import { Search, User, Trophy, Calendar, BarChart3, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { usePlayersData } from '@/hooks/usePlayersData';
import { useScrimsData } from '@/hooks/useScrimsData';
import { Button } from '@/components/ui/button';

const navigationItems = [
  { title: 'Overview', href: '/overview', icon: BarChart3, description: 'Dashboard overview' },
  { title: 'Players', href: '/players', icon: User, description: 'Team roster and player stats' },
  { title: 'Scrims', href: '/scrims', icon: Trophy, description: 'Scrim matches and results' },
  { title: 'Analytics', href: '/analytics', icon: TrendingUp, description: 'Performance analytics' },
  { title: 'SoloQ Tracker', href: '/soloq', icon: User, description: 'Solo queue tracking' },
  { title: 'Calendar', href: '/calendar', icon: Calendar, description: 'Schedule and events' },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { players } = usePlayersData();
  const { scrims } = useScrimsData();

  // Keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  const filteredPlayers = players.filter(player =>
    player.summoner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredScrims = scrims.filter(scrim =>
    scrim.opponent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scrim.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Button
        variant="outline"
        className="relative w-64 justify-start text-sm text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span>Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search pages, players, scrims..." 
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Pages">
            {navigationItems.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => handleSelect(item.href)}
                className="flex items-center gap-2"
              >
                <item.icon className="h-4 w-4" />
                <div>
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          {filteredPlayers.length > 0 && (
            <CommandGroup heading="Players">
              {filteredPlayers.slice(0, 5).map((player) => (
                <CommandItem
                  key={player.id}
                  onSelect={() => handleSelect('/players')}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{player.summoner_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {player.role} • {player.rank || 'Unranked'}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {filteredScrims.length > 0 && (
            <CommandGroup heading="Scrims">
              {filteredScrims.slice(0, 5).map((scrim) => (
                <CommandItem
                  key={scrim.id}
                  onSelect={() => handleSelect('/scrims')}
                  className="flex items-center gap-2"
                >
                  <Trophy className="h-4 w-4" />
                  <div>
                    <div className="font-medium">vs {scrim.opponent_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(scrim.match_date).toLocaleDateString()} • {scrim.status}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
