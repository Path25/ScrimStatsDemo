
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import type { LiveGameData } from '@/types/scrimGame';

interface LiveGameChartProps {
  liveData: LiveGameData[];
  metric: 'kills' | 'gold';
}

export const LiveGameChart: React.FC<LiveGameChartProps> = ({ liveData, metric }) => {
  const chartData = liveData.map((data) => ({
    time: Math.floor(data.game_time_seconds / 60),
    timeLabel: `${Math.floor(data.game_time_seconds / 60)}:${(data.game_time_seconds % 60).toString().padStart(2, '0')}`,
    timeSeconds: data.game_time_seconds,
    blue: metric === 'kills' ? data.blue_team_kills : data.blue_team_gold,
    red: metric === 'kills' ? data.red_team_kills : data.red_team_gold,
    blueDiff: metric === 'kills' 
      ? (data.blue_team_kills - data.red_team_kills)
      : (data.blue_team_gold - data.red_team_gold),
  }));

  const chartConfig = {
    blue: {
      label: "Our Team",
      color: "#3b82f6",
    },
    red: {
      label: "Enemy Team", 
      color: "#ef4444",
    },
  };

  const formatYAxis = (value: number) => {
    if (metric === 'gold') {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toString();
  };

  const formatTooltipValue = (value: number) => {
    if (metric === 'gold') {
      return `${value.toLocaleString()}g`;
    }
    return `${value} kills`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const difference = data.blueDiff;
      
      return (
        <div className="bg-background/95 border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`${label} minutes`}</p>
          <div className="space-y-1">
            <p className="text-blue-400">
              Our Team: {formatTooltipValue(payload[0].value)}
            </p>
            <p className="text-red-400">
              Enemy Team: {formatTooltipValue(payload[1].value)}
            </p>
            <p className={`font-medium ${difference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              Advantage: {difference >= 0 ? '+' : ''}{formatTooltipValue(Math.abs(difference))}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const maxValue = Math.max(...chartData.map(d => Math.max(d.blue, d.red)));
  const minValue = Math.min(...chartData.map(d => Math.min(d.blue, d.red)));
  const padding = (maxValue - minValue) * 0.1;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{metric === 'kills' ? 'Kill Progression' : 'Gold Progression'}</span>
          <div className="text-sm text-muted-foreground">
            {chartData.length} data points
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="time"
                tickFormatter={(value) => `${value}m`}
                type="number"
                scale="linear"
                domain={['dataMin', 'dataMax']}
              />
              <YAxis 
                tickFormatter={formatYAxis}
                domain={[minValue - padding, maxValue + padding]}
              />
              <ChartTooltip 
                content={<CustomTooltip />}
              />
              <Legend />
              
              {/* Reference line at zero for difference visualization */}
              {metric === 'gold' && (
                <ReferenceLine 
                  y={0} 
                  stroke="#666" 
                  strokeDasharray="2 2" 
                  strokeOpacity={0.5}
                />
              )}
              
              <Line
                type="monotone"
                dataKey="blue"
                stroke={chartConfig.blue.color}
                strokeWidth={3}
                dot={{ fill: chartConfig.blue.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: chartConfig.blue.color, strokeWidth: 2 }}
                name={chartConfig.blue.label}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="red"
                stroke={chartConfig.red.color}
                strokeWidth={3}
                dot={{ fill: chartConfig.red.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: chartConfig.red.color, strokeWidth: 2 }}
                name={chartConfig.red.label}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="text-blue-400 font-medium">Our Team</div>
            <div className="text-lg font-bold">
              {chartData.length > 0 ? formatTooltipValue(chartData[chartData.length - 1]?.blue || 0) : '0'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-red-400 font-medium">Enemy Team</div>
            <div className="text-lg font-bold">
              {chartData.length > 0 ? formatTooltipValue(chartData[chartData.length - 1]?.red || 0) : '0'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
