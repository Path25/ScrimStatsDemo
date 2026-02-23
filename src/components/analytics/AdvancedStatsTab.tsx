import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrimAnalytics } from "@/hooks/useScrimAnalytics";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { Target, Eye, Swords, Activity } from "lucide-react";

interface AdvancedStatsTabProps {
    data: ScrimAnalytics;
}

export function AdvancedStatsTab({ data }: AdvancedStatsTabProps) {
    const { team, players } = data;

    // Prepare Objective Data for Chart
    const objectiveData = [
        { name: 'First Blood', value: team.objectives?.firstBloodRate || 0, fill: '#ef4444' }, // red
        { name: 'First Tower', value: team.objectives?.firstTowerRate || 0, fill: '#eab308' }, // yellow
        { name: 'Dragon', value: (team.objectives?.dragonRate || 0) * 20, fill: '#3b82f6' }, // blue (scaled for % visualization approx)
        { name: 'Herald', value: (team.objectives?.heraldRate || 0) * 50, fill: '#a855f7' }, // purple
        { name: 'Baron', value: (team.objectives?.baronRate || 0) * 50, fill: '#d946ef' }, // fuchsia
    ];

    // Calculate Team Aggregates from Player Data
    const totalVisionScore = players.reduce((sum, p) => sum + p.avgVisionScore, 0);
    const avgTeamVision = players.length > 0 ? Math.round(totalVisionScore) : 0;

    // Mock "League Average" for comparison (since we don't have real benchmark data yet)
    // In a real app, this would come from an external API or database of averages
    const radarData = [
        { subject: 'Aggression', A: Math.min(100, (team.avgKills / 15) * 100), B: 65, fullMark: 100 }, // based on kills
        { subject: 'Control', A: Math.min(100, (team.objectives?.dragonRate || 0) * 25), B: 50, fullMark: 100 }, // based on dragons
        { subject: 'Economy', A: Math.min(100, (team.avgGold / 50000) * 100), B: 70, fullMark: 100 }, // based on gold
        { subject: 'Vision', A: Math.min(100, (avgTeamVision / 150) * 100), B: 60, fullMark: 100 }, // based on vision score
        { subject: 'Survival', A: Math.min(100, (team.winRate)), B: 50, fullMark: 100 }, // based on winrate
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Objective Control Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-red-500" />
                            Objective Control
                        </CardTitle>
                        <CardDescription>
                            Control rates for key map objectives
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={objectiveData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                                <XAxis type="number" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} width={80} />
                                <Tooltip
                                    cursor={{ fill: 'white', opacity: 0.05 }}
                                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff10', borderRadius: '12px', backdropFilter: 'blur(12px)' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Team Style Radar */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-brand-primary" />
                            Playstyle Analysis
                        </CardTitle>
                        <CardDescription>
                            Team performance vs League Average (Gray)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#ffffff10" />
                                <PolarAngleAxis dataKey="subject" stroke="#a1a1aa" fontSize={11} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#ffffff05" tick={false} />
                                <Radar
                                    name="Our Team"
                                    dataKey="A"
                                    stroke="#2DD4BF"
                                    strokeWidth={3}
                                    fill="#2DD4BF"
                                    fillOpacity={0.2}
                                />
                                <Radar
                                    name="League Avg"
                                    dataKey="B"
                                    stroke="#52525b"
                                    strokeWidth={2}
                                    fill="#52525b"
                                    fillOpacity={0.05}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff10', borderRadius: '12px', backdropFilter: 'blur(12px)' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Vision & Economy Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-label text-zinc-500">Avg Team Vision</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white flex items-center gap-2">
                            {avgTeamVision} <Eye className="w-4 h-4 text-zinc-600" />
                        </div>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">Score per game</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-label text-zinc-500">Combat Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white flex items-center gap-2">
                            {team.avgKills.toFixed(1)} <Swords className="w-4 h-4 text-red-500/50" />
                        </div>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">Avg Kills per game</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-label text-zinc-500">Dragon Control</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white flex items-center gap-2">
                            {team.objectives?.dragonRate.toFixed(1)} <span className="text-xs font-normal text-zinc-600">/ g</span>
                        </div>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">Avg Dragons taken</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-label text-zinc-500">Baron Control</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white flex items-center gap-2">
                            {team.objectives?.baronRate.toFixed(2)} <span className="text-xs font-normal text-zinc-600">/ g</span>
                        </div>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">Avg Barons taken</p>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}
