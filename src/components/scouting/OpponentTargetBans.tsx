import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOpponentDrafts } from '@/hooks/useOpponentDrafts';
import { ChampionAvatar } from '@/components/scrims/ChampionAvatar';
import { AlertCircle, TrendingUp, ShieldAlert } from 'lucide-react';

interface OpponentTargetBansProps {
    opponentTeamId: string;
}

interface BanRecommendation {
    championName: string;
    pickCount: number;
    winCount: number;
    winRate: number;
    banPriority: number;
}

export function OpponentTargetBans({ opponentTeamId }: OpponentTargetBansProps) {
    const { data: drafts, isLoading } = useOpponentDrafts(opponentTeamId);

    const recommendations = useMemo(() => {
        if (!drafts || drafts.length === 0) return [];

        const stats: Record<string, { pickCount: number; winCount: number }> = {};

        drafts.forEach((draft) => {
            const draftData = draft.draft_data as any;
            const enemyPicks = draftData?.picks?.enemy_picks || [];
            const result = draft.result?.toLowerCase();

            enemyPicks.forEach((champion: string) => {
                if (!stats[champion]) {
                    stats[champion] = { pickCount: 0, winCount: 0 };
                }
                stats[champion].pickCount++;
                if (result === 'win') {
                    stats[champion].winCount++;
                }
            });
        });

        const recommended: BanRecommendation[] = Object.entries(stats).map(([championName, data]) => {
            const winRate = (data.winCount / data.pickCount) * 100;
            // Simple priority calculation: (pickCount * 0.4) + (winRate * 0.6)
            // We weight win rate more heavily but pick count ensures we don't ban 1-game wonders
            const banPriority = (data.pickCount * 2) + (winRate * 0.8);

            return {
                championName,
                pickCount: data.pickCount,
                winCount: data.winCount,
                winRate,
                banPriority,
            };
        });

        return recommended.sort((a, b) => b.banPriority - a.banPriority).slice(0, 5);
    }, [drafts]);

    if (isLoading) {
        return (
            <Card className="bg-black/40 border-white/10 animate-pulse">
                <CardHeader>
                    <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-16 bg-muted rounded"></div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (recommendations.length === 0) {
        return (
            <Card className="bg-black/40 border-white/10">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-zinc-500" />
                        Recommended Target Bans
                    </CardTitle>
                    <CardDescription>No draft data available to generate recommendations.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="bg-black/40 border-white/10">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-brand-primary" />
                    Recommended Target Bans
                </CardTitle>
                <CardDescription>Automated ban recommendations based on opponent history</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {recommendations.map((rec, index) => (
                        <div
                            key={rec.championName}
                            className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-brand-primary/20 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    < ChampionAvatar championName={rec.championName} size="md" />
                                    <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-brand-primary text-[10px] flex items-center justify-center font-bold text-black border border-black shadow">
                                        {index + 1}
                                    </div>
                                </div>
                                <div>
                                    <div className="font-bold text-white group-hover:text-brand-primary transition-colors">
                                        {rec.championName}
                                    </div>
                                    <div className="text-xs text-zinc-500 flex items-center gap-3">
                                        <span>Picked: {rec.pickCount}x</span>
                                        <span className="flex items-center gap-1">
                                            Win Rate:
                                            <span className={rec.winRate >= 60 ? "text-green-500" : rec.winRate <= 40 ? "text-red-500" : "text-zinc-300"}>
                                                {Math.round(rec.winRate)}%
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                {rec.winRate >= 70 && rec.pickCount >= 2 && (
                                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 mb-1">
                                        <AlertCircle className="w-3 h-3 mr-1" /> CORE THREAT
                                    </Badge>
                                )}
                                <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                                    Priority: {Math.round(rec.banPriority)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 p-4 rounded-lg bg-brand-primary/5 border border-brand-primary/10 flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-brand-primary mt-0.5" />
                    <p className="text-xs text-zinc-400 leading-relaxed">
                        Recommendations are weighted by win rate and pick frequency. High priority indicates comfort picks that consistently yield positive results for this opponent.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
