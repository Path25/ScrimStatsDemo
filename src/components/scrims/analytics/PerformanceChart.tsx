
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface PerformanceChartProps {
  performanceData: Array<{
    date: string;
    performance: number;
    kda: number;
    winRate: number;
    games: number;
  }>;
}

export const PerformanceChart = ({ performanceData }: PerformanceChartProps) => {
  if (!performanceData || performanceData.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Performance Trend</CardTitle>
          <CardDescription>Overall performance trend over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No performance data available</p>
              <p className="text-sm text-muted-foreground mt-1">
                Performance data will appear after playing scrim games
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Performance Trend</CardTitle>
        <CardDescription>Overall performance trend over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: any, name: string) => {
                switch (name) {
                  case 'performance':
                    return [`${value}%`, 'Performance Score'];
                  case 'kda':
                    return [value, 'Avg KDA'];
                  case 'winRate':
                    return [`${value}%`, 'Win Rate'];
                  default:
                    return [value, name];
                }
              }}
            />
            <Line 
              type="monotone" 
              dataKey="performance" 
              stroke="hsl(var(--electric-500))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--electric-500))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
