import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface OpponentTrendChartProps {
  opponentTeamId: string;
  trends?: any[];
  isLoading?: boolean;
}

export function OpponentTrendChart({ trends, isLoading }: OpponentTrendChartProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card animate-pulse h-[350px]" />
        <Card className="glass-card animate-pulse h-[350px]" />
      </div>
    );
  }

  // Generate sample trend data for demonstration
  const winRateData = Array.from({ length: 8 }, (_, i) => ({
    period: `Week ${i + 1}`,
    winRate: 40 + Math.random() * 40,
    games: Math.floor(Math.random() * 10) + 1,
  }));

  const performanceMetrics = [
    { metric: 'Early Game', value: 72, change: 5 },
    { metric: 'Mid Game', value: 65, change: -3 },
    { metric: 'Late Game', value: 80, change: 8 },
    { metric: 'Objective Control', value: 58, change: 2 },
    { metric: 'Draft Flexibility', value: 75, change: -1 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <div className="w-1 h-4 bg-brand-primary rounded-full" />
            Win Rate Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={winRateData}>
                <defs>
                  <linearGradient id="colorWinRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis
                  dataKey="period"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717a', fontSize: 10, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717a', fontSize: 10, fontWeight: 600 }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']}
                />
                <Line
                  type="monotone"
                  dataKey="winRate"
                  stroke="#2dd4bf"
                  strokeWidth={3}
                  dot={{ fill: '#2dd4bf', strokeWidth: 2, r: 4, stroke: '#09090b' }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#2dd4bf' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <div className="w-1 h-4 bg-brand-secondary rounded-full" />
            Strategic Proficiency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis
                  dataKey="metric"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717a', fontSize: 10, fontWeight: 600 }}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717a', fontSize: 10, fontWeight: 600 }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '12px'
                  }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  formatter={(value: number) => [`${value}%`, 'Score']}
                />
                <Bar
                  dataKey="value"
                  fill="#2dd4bf"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Performance Changes Bento Style */}
      <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-5 gap-4">
        {performanceMetrics.map((metric) => (
          <div key={metric.metric} className="glass-panel p-4 rounded-xl border-white/5 group hover:border-brand-primary/20 transition-all">
            <div className="text-label text-[10px] mb-2">{metric.metric}</div>
            <div className="flex items-end justify-between">
              <div className="text-value text-xl group-hover:text-brand-primary transition-colors">{metric.value}%</div>
              <div className={cn(
                "text-[10px] font-black tracking-tighter",
                metric.change > 0 ? 'text-green-500' : 'text-red-500'
              )}>
                {metric.change > 0 ? 'UP' : 'DOWN'} {Math.abs(metric.change)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
