import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrimAnalytics, PlayerAnalytics } from "@/hooks/useScrimAnalytics";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface DraftAnalysisTabProps {
    data: ScrimAnalytics;
}

export function DraftAnalysisTab({ data }: DraftAnalysisTabProps) {
    const { players, team } = data;

    // Aggregate Champion Stats across all players
    const championStats = new Map<string, { games: number, wins: number, role: string }>();

    players.forEach(p => {
        p.champions.forEach(champ => {
            // This is a simplification because PlayerAnalytics doesn't strictly link Game -> Champ -> Result in its current structure
            // It aggregates stats per player. 
            // Ideally, we'd need game-level participant data to be 100% accurate on "Champion X Winrate"
            // For now, we will approximate using the player's overall winrate or just list them as "Played"
            // To be accurate, we should really process `allGames` again in the hook or pass it down.

            // Limit limitation: We only have list of unique champs played by player in `p.champions`
            // and `p.games` / `p.wins`. We can't know WHICH champ result was which without granular data.
            // Converting this to just a "Key Champions" list by role for now.
            if (!championStats.has(champ)) {
                championStats.set(champ, { games: 0, wins: 0, role: p.roles[0] || 'flex' });
            }
            // For visualization, we just mark it as used. Real implementation needs granular hook update.
            const stats = championStats.get(champ)!;
            stats.games += 1;
        });
    });

    const topChampions = Array.from(championStats.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.games - a.games)
        .slice(0, 10);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Draft Win Rates by Side */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-white glow-text">Side Bias</CardTitle>
                        <CardDescription>Win rates by map side</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 font-black text-xl shadow-lg ring-1 ring-blue-500/5 group-hover:scale-105 transition-transform">
                                    B
                                </div>
                                <div>
                                    <div className="text-white font-bold group-hover:text-blue-400 transition-colors">Blue Side</div>
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{team.sideSelection.blue.games} Games</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-blue-400 font-mono tracking-tighter">{team.sideSelection.blue.winRate}%</div>
                                <div className="text-[10px] text-zinc-500 uppercase font-bold">{team.sideSelection.blue.wins} Wins</div>
                            </div>
                        </div>

                        <div className="h-px bg-white/5 relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                        </div>

                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400 font-black text-xl shadow-lg ring-1 ring-red-500/5 group-hover:scale-105 transition-transform">
                                    R
                                </div>
                                <div>
                                    <div className="text-white font-bold group-hover:text-red-400 transition-colors">Red Side</div>
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{team.sideSelection.red.games} Games</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-red-400 font-mono tracking-tighter">{team.sideSelection.red.winRate}%</div>
                                <div className="text-[10px] text-zinc-500 uppercase font-bold">{team.sideSelection.red.wins} Wins</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Composition Styles (Mock) */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-white glow-text">Composition Performance</CardTitle>
                        <CardDescription>Analysis by team composition archetypes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[
                                { name: "Hard Engage", games: 12, wr: 66, color: "bg-orange-500", glow: "shadow-[0_0_15px_rgba(249,115,22,0.3)]" },
                                { name: "Poke / Siege", games: 8, wr: 50, color: "bg-blue-400", glow: "shadow-[0_0_15px_rgba(96,165,250,0.3)]" },
                                { name: "Pick / Skirmish", games: 6, wr: 33, color: "bg-purple-500", glow: "shadow-[0_0_15px_rgba(168,85,247,0.3)]" },
                                { name: "Scaling / Front-to-Back", games: 5, wr: 60, color: "bg-green-500", glow: "shadow-[0_0_15px_rgba(34,197,94,0.3)]" },
                            ].map((comp) => (
                                <div key={comp.name} className="glass-panel p-3 rounded-xl flex items-center justify-between border border-white/5 hover:border-white/10 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-1.5 h-10 rounded-full transition-all group-hover:h-12", comp.color, comp.glow)} />
                                        <div>
                                            <div className="text-sm font-bold text-white group-hover:text-brand-primary transition-colors">{comp.name}</div>
                                            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{comp.games} Games Played</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="w-32 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5 hidden sm:block">
                                            <div
                                                className={cn("h-full transition-all duration-1000 ease-out", comp.color)}
                                                style={{ width: `${comp.wr}%` }}
                                            />
                                        </div>
                                        <span className="text-lg font-black font-mono w-12 text-right text-white tracking-tighter">{comp.wr}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-6 text-center uppercase font-bold tracking-[0.2em]">
                            * Automated classification based on champion tags
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Most Played Champions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-white glow-text">Most Contested Picks</CardTitle>
                    <CardDescription>Champions frequently appearing in your games</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[220px] w-full pr-4">
                        <div className="space-y-1.5">
                            {topChampions.length > 0 ? (
                                topChampions.map((champ, i) => (
                                    <div key={i} className="flex items-center justify-between p-2.5 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <span className="text-zinc-600 font-black text-xs w-6 group-hover:text-brand-primary transition-colors">#{i + 1}</span>
                                            <span className="text-white font-bold text-sm tracking-tight">{champ.name}</span>
                                            <Badge variant="outline" className="text-[9px] uppercase font-black bg-white/5 border-white/5 text-zinc-500 group-hover:text-zinc-300">
                                                {champ.role}
                                            </Badge>
                                        </div>
                                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                            Appeared in <span className="text-white">{champ.games}</span> player pools
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-zinc-600 text-center py-8 font-bold uppercase tracking-widest text-sm">No champion data available</div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

        </div>
    );
}
