
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import type { GameAnalytics } from '@/hooks/useScrimAnalytics';

interface GameTimelineChartProps {
  timeline: GameAnalytics[];
}

export const GameTimelineChart: React.FC<GameTimelineChartProps> = ({ timeline }) => {
  const chartConfig = {
    winRate: {
      label: 'Win Rate %',
      color: 'hsl(var(--primary))',
    },
    avgKills: {
      label: 'Avg Kills',
      color: 'hsl(var(--destructive))',
    },
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Performance Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  labelFormatter={(value) => `Date: ${value}`}
                />
                <Area
                  type="monotone"
                  dataKey="winRate"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Game Results Timeline */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent Games Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeline.slice(-10).map((data, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded border border-border/50">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-muted-foreground min-w-[60px]">
                    {data.date}
                  </div>
                  <div>
                    <p className="font-medium">vs {data.opponent}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.wins}/{data.games} games won
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-center">
                    <p className="text-muted-foreground">Win Rate</p>
                    <p className={`font-bold ${
                      data.winRate >= 60 ? 'text-performance-excellent' :
                      data.winRate >= 40 ? 'text-performance-average' :
                      'text-performance-terrible'
                    }`}>
                      {Math.round(data.winRate)}%
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-muted-foreground">Avg Kills</p>
                    <p className="font-bold">{Math.round(data.avgKills)}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-muted-foreground">Avg Duration</p>
                    <p className="font-bold">
                      {Math.floor(data.avgDuration)}:{((data.avgDuration % 1) * 60).toFixed(0).padStart(2, '0')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
