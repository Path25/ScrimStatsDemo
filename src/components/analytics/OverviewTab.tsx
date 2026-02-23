import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrimAnalytics } from "@/hooks/useScrimAnalytics";
import { TrendingUp, TrendingDown, Clock, Trophy, Target, Sword, Shield, Sparkles } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { GameHeatmap } from "@/components/scrims/analytics/GameHeatmap";

interface OverviewTabProps {
    data: ScrimAnalytics;
}

export function OverviewTab({ data }: OverviewTabProps) {
    const { team, performanceData } = data;

    // High-fidelity mock data for the featured heatmap in the overview
    const mockKills = [
        { x: 22, y: 35, team: 'blue' }, { x: 25, y: 32, team: 'blue' },
        { x: 85, y: 75, team: 'red' }, { x: 82, y: 72, team: 'red' },
        { x: 50, y: 50, team: 'blue' }, { x: 52, y: 48, team: 'red' },
        { x: 48, y: 52, team: 'blue' }, { x: 15, y: 15, team: 'red' },
        { x: 90, y: 90, team: 'blue' }, { x: 45, y: 55, team: 'blue' },
        { x: 55, y: 45, team: 'red' }, { x: 30, y: 70, team: 'blue' },
        { x: 70, y: 30, team: 'red' }
    ];

    const mockWards = [
        { x: 30, y: 40, team: 'blue', type: 'control' }, { x: 70, y: 60, team: 'red', type: 'control' },
        { x: 50, y: 60, team: 'blue', type: 'stealth' }, { x: 50, y: 40, team: 'red', type: 'stealth' }
    ];

    return (
        <div className="space-y-6 animate-page-entry">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-label">Total Win Rate</CardTitle>
                        <Trophy className="h-4 w-4 text-brand-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-value text-brand-primary glow-text-sm">{team.winRate}%</div>
                        <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1 font-mono">
                            {team.wins} W / {team.totalGames - team.wins} L
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-label">Avg Duration</CardTitle>
                        <Clock className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-value">
                            {Math.floor(team.avgGameDuration / 60)}m {Math.round(team.avgGameDuration % 60)}s
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1 font-mono">
                            {team.durationTrend > 0 ? <TrendingUp className="w-3 h-3 text-red-400" /> : <TrendingDown className="w-3 h-3 text-green-400" />}
                            {Math.abs(Math.round(team.durationTrend))}% vs BASELINE
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-label">Gold Lead @ 15</CardTitle>
                        <Target className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-value text-yellow-500">+{Math.round(team.avgGold / 1000)}k</div>
                        <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1 font-mono">
                            {team.goldTrend > 0 ? <TrendingUp className="w-3 h-3 text-green-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}
                            {Math.abs(Math.round(team.goldTrend))}% TREND
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-label">Recent Form</CardTitle>
                        <Sword className="h-4 w-4 text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-1.5">
                            {team.recentForm.slice(-5).map((result, i) => (
                                <div key={i} className={`w-7 h-7 rounded-lg flex items-center shadow-lg justify-center text-[10px] font-black ${result === 'W' ? 'bg-brand-primary text-black' : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}>
                                    {result}
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-2 font-black uppercase tracking-widest">Last 5 Matchups</p>
                    </CardContent>
                </Card>
            </div>

            {/* Strategic Row: Heatmap & Side Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
                {/* Heatmap Widget */}
                <div className="lg:col-span-4">
                    <GameHeatmap killEvents={mockKills} wardEvents={mockWards} isStatic />
                </div>

                {/* Side Stats & AI Insights */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="glass-card bg-brand-primary/5 border-brand-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-brand-primary">
                                <Sparkles className="w-4 h-4" /> Strategic Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                <p className="text-xs text-zinc-300 leading-relaxed">
                                    Our <span className="text-brand-primary font-bold">Mid-Game conversion</span> rate has increased by <span className="text-green-400">12%</span>. However, heatmap density suggests <span className="text-red-400">over-extending</span> without objective vision in the bottom river.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <span className="text-label">Coaching Priority</span>
                                <div className="flex items-center gap-2 text-[10px] text-white bg-indigo-500/10 border border-indigo-500/20 p-2 rounded-lg">
                                    <Shield className="w-3 h-3 text-indigo-400" /> Focus on Neutral Objective Layering
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-label">Side Efficiency</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-black uppercase tracking-tighter">
                                    <span className="text-blue-400 flex items-center gap-2">Blue Side</span>
                                    <span className="text-white">{team.sideSelection?.blue.winRate}%</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${team.sideSelection?.blue.winRate}%` }} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-black uppercase tracking-tighter">
                                    <span className="text-red-400 flex items-center gap-2">Red Side</span>
                                    <span className="text-white">{team.sideSelection?.red.winRate}%</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${team.sideSelection?.red.winRate}%` }} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Performance Trend */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Performance Trend</CardTitle>
                    <CardDescription className="text-xs">Overall team efficiency score over time</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px] mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={performanceData}>
                            <defs>
                                <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '10px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="performance" stroke="#2DD4BF" fillOpacity={1} fill="url(#colorPerf)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

const EMPTY_PLACEHOLDER = null;
