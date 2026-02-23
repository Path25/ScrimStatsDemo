
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { PlayerAnalytics } from '@/hooks/useScrimAnalytics';

interface PlayerPerformanceTableProps {
  players: PlayerAnalytics[];
}

export const PlayerPerformanceTable: React.FC<PlayerPerformanceTableProps> = ({ players }) => {
  const [sortBy, setSortBy] = useState<'games' | 'winRate' | 'avgVisionScore' | 'avgKills' | 'avgCS' | 'performanceScore'>('performanceScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  console.log('PlayerPerformanceTable - Players:', players.length);

  // Sort data
  const sortedData = [...players].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'games':
        comparison = a.games - b.games;
        break;
      case 'winRate':
        comparison = a.winRate - b.winRate;
        break;
      case 'avgVisionScore':
        comparison = (a.avgVisionScore || 0) - (b.avgVisionScore || 0);
        break;
      case 'avgKills':
        comparison = a.avgKills - b.avgKills;
        break;
      case 'avgCS':
        comparison = a.avgCS - b.avgCS;
        break;
      case 'performanceScore':
        comparison = a.performanceScore - b.performanceScore;
        break;
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const SortButton = ({ column, children }: { column: typeof sortBy; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(column)}
      className="h-auto p-0 font-semibold"
    >
      {children}
      {sortBy === column ? (
        sortOrder === 'desc' ? <ArrowDown className="w-3 h-3 ml-1" /> : <ArrowUp className="w-3 h-3 ml-1" />
      ) : (
        <ArrowUpDown className="w-3 h-3 ml-1" />
      )}
    </Button>
  );

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-performance-excellent';
    if (score >= 60) return 'text-performance-average';
    if (score >= 40) return 'text-yellow-500';
    return 'text-performance-terrible';
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return 'text-performance-excellent';
    if (winRate >= 50) return 'text-performance-average';
    return 'text-performance-terrible';
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Player Performance Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>
                <SortButton column="games">Games</SortButton>
              </TableHead>
              <TableHead>
                <SortButton column="winRate">Win Rate</SortButton>
              </TableHead>
              <TableHead>
                <SortButton column="avgVisionScore">Avg Vision</SortButton>
              </TableHead>
              <TableHead>
                <SortButton column="avgKills">Avg K/D/A</SortButton>
              </TableHead>
              <TableHead>
                <SortButton column="avgCS">Avg CS</SortButton>
              </TableHead>
              <TableHead>
                <SortButton column="performanceScore">Performance</SortButton>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((player) => (
              <TableRow key={player.name}>
                <TableCell className="font-medium">{player.name}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {player.roles.slice(0, 2).map((role: string) => (
                      <Badge key={role} variant="outline" className="text-xs">
                        {role.toUpperCase()}
                      </Badge>
                    ))}
                    {player.roles.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{player.roles.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{player.games}</TableCell>
                <TableCell>
                  <span className={getWinRateColor(player.winRate)}>
                    {player.winRate}%
                  </span>
                  <div className="text-xs text-muted-foreground">
                    {player.wins}W/{player.games - player.wins}L
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {player.avgVisionScore || 0}
                </TableCell>
                <TableCell>
                  <span className="text-green-400">{player.avgKills}</span>/
                  <span className="text-red-400">{player.avgDeaths}</span>/
                  <span className="text-yellow-400">{player.avgAssists}</span>
                </TableCell>
                <TableCell>{player.avgCS}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span className={`font-bold ${getPerformanceColor(player.performanceScore)}`}>
                      {player.performanceScore}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {sortedData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No player data available for the selected time period.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
