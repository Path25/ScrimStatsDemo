import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrimAnalytics } from "@/hooks/useScrimAnalytics";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PlayerReportsTabProps {
    data: ScrimAnalytics;
}

export function PlayerReportsTab({ data }: PlayerReportsTabProps) {
    const { players } = data;

    // Sort players by role order usually, or by performance score
    // Standard role order: Top, Jungle, Mid, ADC, Support
    const roleOrder = { 'top': 1, 'jungle': 2, 'mid': 3, 'adc': 4, 'support': 5 };

    // Sort logic: First by primary role, then by name
    const sortedPlayers = [...players].sort((a, b) => {
        const roleA = a.roles[0] || 'top';
        const roleB = b.roles[0] || 'top';
        const orderA = roleOrder[roleA as keyof typeof roleOrder] || 99;
        const orderB = roleOrder[roleB as keyof typeof roleOrder] || 99;

        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-white glow-text">Player Performance Report</CardTitle>
                    <CardDescription>Aggregate statistics across all games in selected period</CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-6 overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-white/5 border-white/5">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="text-label text-zinc-500">Player</TableHead>
                                <TableHead className="text-label text-zinc-500 text-center">Role</TableHead>
                                <TableHead className="text-label text-zinc-500 text-center">Games</TableHead>
                                <TableHead className="text-label text-zinc-500 text-center">Win Rate</TableHead>
                                <TableHead className="text-label text-zinc-500 text-center">KDA</TableHead>
                                <TableHead className="text-label text-zinc-500 text-center">Avg CS</TableHead>
                                <TableHead className="text-label text-zinc-500 text-center">Vision</TableHead>
                                <TableHead className="text-label text-zinc-500 text-center">Score</TableHead>
                                <TableHead className="text-label text-zinc-500 text-right">Top Champs</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedPlayers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-12 text-zinc-500">
                                        No player data available for this period.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedPlayers.map((player) => (
                                    <TableRow key={player.name} className="border-white/5 hover:bg-white/5 transition-all group">
                                        <TableCell className="font-medium text-white p-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-9 h-9 border border-white/10 ring-1 ring-white/5 shadow-xl group-hover:scale-105 transition-transform">
                                                    <AvatarImage src={`https://ui-avatars.com/api/?name=${player.name}&background=18181b&color=2dd4bf&bold=true`} />
                                                    <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-[10px] font-bold">
                                                        {player.name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="group-hover:text-brand-primary transition-colors">{player.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center gap-1 flex-wrap max-w-[120px] mx-auto">
                                                {player.roles.map(role => (
                                                    <Badge key={role} variant="outline" className="border-white/5 bg-white/5 text-[9px] uppercase tracking-tighter px-1.5 py-0 h-4 font-bold text-zinc-400">
                                                        {role}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center p-4">
                                            <span className="text-zinc-400 font-mono text-sm">{player.games}</span>
                                        </TableCell>
                                        <TableCell className="text-center p-4">
                                            <span className={cn("text-sm font-bold", player.winRate >= 50 ? "text-green-400" : "text-red-400")}>
                                                {player.winRate}%
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center p-4">
                                            <div className="flex flex-col items-center">
                                                <span className={cn("text-sm font-bold font-mono", player.kda >= 3 ? "text-brand-primary" : "text-white")}>
                                                    {player.kda.toFixed(2)}
                                                </span>
                                                <span className="text-[10px] font-mono text-zinc-500">
                                                    {player.avgKills}/{player.avgDeaths}/{player.avgAssists}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center p-4">
                                            <span className="text-zinc-300 font-mono text-sm">{player.avgCS}</span>
                                        </TableCell>
                                        <TableCell className="text-center p-4">
                                            <span className="text-zinc-300 font-mono text-sm">{player.avgVisionScore}</span>
                                        </TableCell>
                                        <TableCell className="text-center p-4">
                                            <div className="inline-flex flex-col items-center justify-center">
                                                <div
                                                    className="w-12 h-1 bg-zinc-800/50 rounded-full overflow-hidden relative mb-1"
                                                    title={`Score: ${player.performanceScore}`}
                                                >
                                                    <div
                                                        className={cn("h-full absolute top-0 left-0 rounded-full",
                                                            player.performanceScore >= 80 ? "bg-brand-primary" :
                                                                player.performanceScore >= 60 ? "bg-green-500" :
                                                                    player.performanceScore >= 40 ? "bg-yellow-500" : "bg-red-500"
                                                        )}
                                                        style={{ width: `${player.performanceScore}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-white">{player.performanceScore}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right p-4 pr-6">
                                            <div className="flex justify-end gap-1.5">
                                                {player.champions.slice(0, 3).map((champ, i) => (
                                                    <div key={i} className="w-7 h-7 rounded-lg bg-zinc-900/80 border border-white/5 overflow-hidden flex items-center justify-center text-[9px] text-zinc-400 font-black shadow-sm group-hover:border-white/20 transition-all">
                                                        {champ.substring(0, 2).toUpperCase()}
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
