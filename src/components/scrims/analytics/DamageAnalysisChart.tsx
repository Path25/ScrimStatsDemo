
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Target, Zap } from 'lucide-react';
import type { ScrimGame, ScrimParticipant } from '@/types/scrimGame';

interface DamageAnalysisChartProps {
  game: ScrimGame;
  participants: ScrimParticipant[];
}

export const DamageAnalysisChart: React.FC<DamageAnalysisChartProps> = ({ game, participants }) => {
  // Filter to only our team
  const ourTeam = participants.filter(p => p.is_our_team);
  
  if (ourTeam.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No damage data available for our team</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate total damage for our team
  const totalDamage = ourTeam.reduce((sum, p) => sum + (p.damage_dealt || 0), 0);

  // Prepare damage distribution data (pie chart)
  const damageDistributionData = ourTeam.map(p => ({
    name: p.summoner_name,
    champion: p.champion_name,
    damage: p.damage_dealt || 0,
    percentage: totalDamage > 0 ? ((p.damage_dealt || 0) / totalDamage * 100).toFixed(1) : 0
  }));

  // Prepare damage output data (bar chart)
  const damageOutputData = ourTeam.map(p => ({
    name: p.summoner_name.length > 8 ? p.summoner_name.slice(0, 8) + '...' : p.summoner_name,
    champion: p.champion_name,
    damage: p.damage_dealt || 0,
    damageTaken: p.damage_taken || 0
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey === 'damage' ? 'Damage Dealt' : 'Damage Taken'}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.champion}</p>
          <p style={{ color: payload[0].color }}>
            Damage: {data.damage.toLocaleString()} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Damage Distribution (Pie Chart) */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Our Team - Damage Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={damageDistributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="damage"
                  label={({ percentage }) => `${percentage}%`}
                >
                  {damageDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {damageDistributionData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>{entry.name} ({entry.champion})</span>
                </div>
                <span className="font-medium">{entry.damage.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Damage Output vs Taken (Bar Chart) */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Our Team - Damage Output vs Taken
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={damageOutputData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="damage" fill="#3B82F6" name="Damage Dealt" />
                <Bar dataKey="damageTaken" fill="#EF4444" name="Damage Taken" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
