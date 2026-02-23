
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { LiveGameData } from '@/types/scrimGame';

interface GameTimelineProps {
  liveData: LiveGameData[];
}

export const GameTimeline: React.FC<GameTimelineProps> = ({ liveData }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getEventDescription = (current: LiveGameData, previous?: LiveGameData) => {
    const events = [];
    
    if (previous) {
      const blueKillDiff = current.blue_team_kills - previous.blue_team_kills;
      const redKillDiff = current.red_team_kills - previous.red_team_kills;
      const blueGoldDiff = current.blue_team_gold - previous.blue_team_gold;
      const redGoldDiff = current.red_team_gold - previous.red_team_gold;

      if (blueKillDiff > 0) {
        events.push({
          type: 'kill',
          team: 'blue',
          description: `+${blueKillDiff} kill${blueKillDiff > 1 ? 's' : ''}`,
          priority: 2
        });
      }
      
      if (redKillDiff > 0) {
        events.push({
          type: 'kill',
          team: 'red',
          description: `+${redKillDiff} kill${redKillDiff > 1 ? 's' : ''}`,
          priority: 2
        });
      }

      // Only show significant gold changes (>1k)
      if (blueGoldDiff > 1000) {
        events.push({
          type: 'gold',
          team: 'blue',
          description: `+${(blueGoldDiff / 1000).toFixed(1)}k gold`,
          priority: 1
        });
      }
      
      if (redGoldDiff > 1000) {
        events.push({
          type: 'gold',
          team: 'red',
          description: `+${(redGoldDiff / 1000).toFixed(1)}k gold`,
          priority: 1
        });
      }

      // Check for objectives in objectives_state
      if (current.objectives_state && previous.objectives_state) {
        const currentObj = current.objectives_state;
        const previousObj = previous.objectives_state;
        
        // Check for dragon changes
        if (currentObj.blue_dragons > (previousObj.blue_dragons || 0)) {
          events.push({
            type: 'objective',
            team: 'blue',
            description: 'Dragon secured',
            priority: 3
          });
        }
        if (currentObj.red_dragons > (previousObj.red_dragons || 0)) {
          events.push({
            type: 'objective',
            team: 'red',
            description: 'Dragon secured',
            priority: 3
          });
        }
        
        // Check for baron changes
        if (currentObj.blue_barons > (previousObj.blue_barons || 0)) {
          events.push({
            type: 'objective',
            team: 'blue',
            description: 'Baron secured',
            priority: 3
          });
        }
        if (currentObj.red_barons > (previousObj.red_barons || 0)) {
          events.push({
            type: 'objective',
            team: 'red',
            description: 'Baron secured',
            priority: 3
          });
        }
        
        // Check for tower changes
        if (currentObj.blue_towers > (previousObj.blue_towers || 0)) {
          events.push({
            type: 'objective',
            team: 'blue',
            description: 'Tower destroyed',
            priority: 2
          });
        }
        if (currentObj.red_towers > (previousObj.red_towers || 0)) {
          events.push({
            type: 'objective',
            team: 'red',
            description: 'Tower destroyed',
            priority: 2
          });
        }
      }
    }

    // Sort events by priority (higher priority first)
    return events.sort((a, b) => b.priority - a.priority);
  };

  // Reverse the data so latest appears at top
  const reversedData = [...liveData].reverse();

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Game Timeline</CardTitle>
        <p className="text-sm text-muted-foreground">
          Latest events appear at the top • {liveData.length} data points recorded
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {reversedData.map((data, index) => {
              // Get the previous data point (remember we're working with reversed data)
              const nextIndex = liveData.length - 1 - index;
              const previous = nextIndex > 0 ? liveData[nextIndex - 1] : undefined;
              const events = getEventDescription(data, previous);
              
              return (
                <div key={data.id} className="flex items-start space-x-3 p-3 rounded border border-border/50 hover:bg-muted/20 transition-colors">
                  <div className="flex-shrink-0">
                    <Badge variant="outline" className="font-mono text-xs">
                      {formatTime(data.game_time_seconds)}
                    </Badge>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-400 font-medium">
                        Blue: {data.blue_team_kills}K • {(data.blue_team_gold / 1000).toFixed(1)}k G
                      </span>
                      <span className="text-red-400 font-medium">
                        Red: {data.red_team_kills}K • {(data.red_team_gold / 1000).toFixed(1)}k G
                      </span>
                    </div>
                    
                    {/* Gold difference indicator */}
                    <div className="text-xs text-center">
                      <span className={`font-medium ${
                        (data.blue_team_gold - data.red_team_gold) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        Gold Diff: {((data.blue_team_gold - data.red_team_gold) / 1000).toFixed(1)}k
                      </span>
                    </div>

                    {events.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {events.map((event, eventIndex) => (
                          <Badge
                            key={eventIndex}
                            variant="secondary"
                            className={`text-xs ${
                              event.team === 'blue'
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                            } ${
                              event.type === 'objective'
                                ? 'font-semibold'
                                : event.type === 'kill'
                                ? 'font-medium'
                                : ''
                            }`}
                          >
                            {event.description}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {events.length === 0 && index < reversedData.length - 1 && (
                      <div className="text-xs text-muted-foreground italic">
                        Game state update
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {liveData.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No timeline data available yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Timeline will appear when live game data is received
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
