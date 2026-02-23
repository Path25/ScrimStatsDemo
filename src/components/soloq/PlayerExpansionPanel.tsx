import { SoloQPlayer } from "@/types/soloq";
import { formatDistanceToNow } from "date-fns";
import { TrendingUp, Crosshair, Sword, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SoloQGameDetails } from "./SoloQGameDetails";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface PlayerExpansionPanelProps {
    player: SoloQPlayer;
}

export function PlayerExpansionPanel({ player }: PlayerExpansionPanelProps) {
    const [openGameId, setOpenGameId] = useState<string | null>(null);

    const toggleGame = (gameId: string) => {
        setOpenGameId(prev => prev === gameId ? null : gameId);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 bg-black/40 border-t border-white/5 animate-in slide-in-from-top-2">
            {/* LEFT: Champion Stats */}
            <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Sword className="w-3 h-3" /> Champion Performance (20G)
                </h4>
                <div className="space-y-2">
                    {player.championStats.map((stat, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-500">
                                    {/* Placeholder for Champion Icon */}
                                    {stat.championName.substring(0, 2)}
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-zinc-200">{stat.championName}</div>
                                    <div className="text-[10px] text-zinc-500">{stat.matches} Games</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-sm text-brand-primary">
                                    {Math.round((stat.wins / stat.matches) * 100)}% WR
                                </div>
                                <div className="text-[10px] text-zinc-400">
                                    {((stat.kills + stat.assists) / stat.deaths).toFixed(2)} KDA
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: Match History */}
            <div className="lg:col-span-2 space-y-4">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Crosshair className="w-3 h-3" /> Recent Matches
                </h4>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                    {player.matches.map((match) => (
                        <Collapsible
                            key={match.id}
                            open={openGameId === match.id}
                            onOpenChange={() => toggleGame(match.id)}
                            className="group rounded-lg bg-white/5 border border-white/5 overflow-hidden transition-all duration-300"
                        >
                            <CollapsibleTrigger className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors cursor-pointer text-left">
                                <div className="flex items-center gap-4">
                                    <div className={`w-1 h-12 rounded-full ${match.win ? "bg-brand-primary" : "bg-red-500"}`} />
                                    <div>
                                        <div className={`font-bold text-sm ${match.win ? "text-brand-primary" : "text-red-400"}`}>
                                            {match.win ? "VICTORY" : "DEFEAT"}
                                        </div>
                                        <div className="text-[10px] text-zinc-500 capitalize">{match.gameMode} • {formatDistanceToNow(match.gameCreation, { addSuffix: true })}</div>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 border-l border-white/5 mx-2">
                                        <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">
                                            {match.championName.substring(0, 1)}
                                        </div>
                                        <span className="font-bold text-sm text-zinc-300">{match.championName}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 text-right">
                                    <div>
                                        <div className="font-bold text-zinc-200">{match.kills} / <span className="text-red-400">{match.deaths}</span> / {match.assists}</div>
                                        <div className="text-[10px] text-zinc-500">KDA {((match.kills + match.assists) / Math.max(1, match.deaths)).toFixed(2)}</div>
                                    </div>
                                    <div className="hidden sm:block">
                                        <div className="font-bold text-zinc-200">{match.cs} CS</div>
                                        <div className="text-[10px] text-zinc-500">{(match.cs / (match.gameDuration / 60)).toFixed(1)}/m</div>
                                    </div>
                                    <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform duration-300", openGameId === match.id && "rotate-180")} />
                                </div>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                                <SoloQGameDetails match={match} />
                            </CollapsibleContent>
                        </Collapsible>
                    ))}
                </div>
            </div>
        </div>
    );
}
