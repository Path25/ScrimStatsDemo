import React, { useState } from 'react';
import { Database, TrendingUp, Trophy, Star, PlayCircle, ExternalLink, ChevronRight, Activity, ChevronDown, ChevronUp, Video, Calendar, Eye, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TOP_PLAYERS = [
    { rank: 1, name: "Chovy", team: "GEN", role: "Mid", winrate: "68%", lp: "1850 LP", champion: "Azir", trend: "up" },
    { rank: 2, name: "Knight", team: "BLG", role: "Mid", winrate: "65%", lp: "1720 LP", champion: "Ahri", trend: "up" },
    { rank: 3, name: "Ruler", team: "JDG", role: "ADC", winrate: "64%", lp: "1690 LP", champion: "Zeri", trend: "down" },
    { rank: 4, name: "Canyon", team: "GEN", role: "Jungle", winrate: "62%", lp: "1610 LP", champion: "Lee Sin", trend: "up" },
    { rank: 5, name: "Zeus", team: "T1", role: "Top", winrate: "61%", lp: "1580 LP", champion: "Jayce", trend: "stable" },
    { rank: 6, name: "Viper", team: "HLE", role: "ADC", winrate: "60%", lp: "1540 LP", champion: "Lucian", trend: "up" },
    { rank: 7, name: "ShowMaker", team: "DK", role: "Mid", winrate: "59%", lp: "1520 LP", champion: "Syndra", trend: "down" },
    { rank: 8, name: "Bin", team: "BLG", role: "Top", winrate: "59%", lp: "1490 LP", champion: "Gwen", trend: "up" },
    { rank: 9, name: "Caps", team: "G2", role: "Mid", winrate: "61%", lp: "1485 LP", champion: "Tristana", trend: "up" },
    { rank: 10, name: "Keria", team: "T1", role: "Support", winrate: "58%", lp: "1450 LP", champion: "Nautilus", trend: "stable" },
    { rank: 11, name: "Oner", team: "T1", role: "Jungle", winrate: "57%", lp: "1420 LP", champion: "Vi", trend: "up" },
    { rank: 12, name: "Elk", team: "BLG", role: "ADC", winrate: "58%", lp: "1400 LP", champion: "Kalista", trend: "down" },
    { rank: 13, name: "Bdd", team: "KT", role: "Mid", winrate: "56%", lp: "1350 LP", champion: "Orianna", trend: "stable" },
    { rank: 14, name: "Peyz", team: "GEN", role: "ADC", winrate: "59%", lp: "1310 LP", champion: "Senna", trend: "up" },
    { rank: 15, name: "Bwipo", team: "FLY", role: "Top", winrate: "55%", lp: "1280 LP", champion: "Urgot", trend: "up" }
];

const PRO_VODS = [
    { id: 1, title: "GEN vs T1 - LCK Spring Finals Game 1", date: "April 14, 2024", duration: "34:12", views: "1.2M", matchup: "Azir vs Corki", patch: "14.6", gd15: "+2.1k", fb: "Blue", dragControl: "75%" },
    { id: 2, title: "BLG vs TES - LPL Spring Finals Game 5", date: "April 20, 2024", duration: "41:05", views: "2.5M", matchup: "Ahri vs Syndra", patch: "14.6", gd15: "+0.5k", fb: "Red", dragControl: "60%" },
    { id: 3, title: "T1 Faker SoloQ - KR Challenger", date: "Today", duration: "28:45", views: "450K", matchup: "Orianna vs Sylas", patch: "14.8", gd15: "+1.2k", fb: "Team", dragControl: "100%" },
    { id: 4, title: "G2 vs FNC - LEC Spring Finals Game 3", date: "April 14, 2024", duration: "31:20", views: "800K", matchup: "Jinx vs Zeri", patch: "14.6", gd15: "-0.8k", fb: "Red", dragControl: "40%" },
    { id: 5, title: "JDG vs NIP - LPL Spring Playoffs Game 2", date: "April 10, 2024", duration: "29:15", views: "1.0M", matchup: "Zeri vs Lucian", patch: "14.5", gd15: "+3.4k", fb: "Blue", dragControl: "80%" },
    { id: 6, title: "HLE vs DK - LCK Spring Playoffs Game 4", date: "April 13, 2024", duration: "38:50", views: "950K", matchup: "Sejuani vs Vi", patch: "14.6", gd15: "+0.1k", fb: "Blue", dragControl: "50%" },
    { id: 7, title: "FLY vs TL - LCS Spring Finals Game 1", date: "March 31, 2024", duration: "32:40", views: "300K", matchup: "Urgot vs Renekton", patch: "14.5", gd15: "-1.5k", fb: "Red", dragControl: "25%" },
    { id: 8, title: "T1 Keria SoloQ - KR Challenger Support", date: "Yesterday", duration: "24:10", views: "320K", matchup: "Nautilus vs Rell", patch: "14.8", gd15: "+4.0k", fb: "Team", dragControl: "100%" },
];

export default function ProData() {
    const [expandedVod, setExpandedVod] = useState<number | null>(null);

    const toggleVod = (id: number) => {
        setExpandedVod(prev => (prev === id ? null : id));
    };

    return (
        <div className="space-y-6 max-w-[1920px] mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl sticky top-24 z-20">
                <div className="flex items-center space-x-2 text-sm pl-2">
                    <span className="text-zinc-500">ScrimStats</span>
                    <ChevronRight className="w-4 h-4 text-zinc-700" />
                    <Database className="w-4 h-4 text-blue-400" />
                    <span className="text-white font-medium glow-text">Pro Data Center</span>
                </div>

                <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                        <Activity className="h-3 w-3 animate-pulse" />
                        Live Tracker Active
                    </Badge>
                </div>
            </div>

            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Top Players Tracker */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-400" />
                            Global Top Players
                        </h3>
                        <Button variant="ghost" size="sm" className="text-xs text-zinc-400 hover:text-white">
                            View Leaderboard <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                    </div>

                    <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead className="sticky top-0 z-10 bg-black/60 backdrop-blur-md">
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        <th className="p-4 text-xs font-semibold text-zinc-400 whitespace-nowrap">Rank</th>
                                        <th className="p-4 text-xs font-semibold text-zinc-400 whitespace-nowrap">Player</th>
                                        <th className="p-4 text-xs font-semibold text-zinc-400 whitespace-nowrap">Role</th>
                                        <th className="p-4 text-xs font-semibold text-zinc-400 whitespace-nowrap">Win Rate</th>
                                        <th className="p-4 text-xs font-semibold text-zinc-400 whitespace-nowrap">Rating</th>
                                        <th className="p-4 text-xs font-semibold text-zinc-400 whitespace-nowrap">Top Champ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {TOP_PLAYERS.map((player) => (
                                        <tr key={player.rank} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-4">
                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${player.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                                                    player.rank === 2 ? 'bg-zinc-300/20 text-zinc-300' :
                                                        player.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                                                            'text-zinc-500'
                                                    }`}>
                                                    {player.rank}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shrink-0">
                                                        <Star className="w-4 h-4 text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white group-hover:text-blue-400 transition-colors whitespace-nowrap">{player.name}</div>
                                                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{player.team}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-zinc-300">{player.role}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-green-400">{player.winrate}</span>
                                                    {player.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm font-mono text-zinc-300 whitespace-nowrap">{player.lp}</td>
                                            <td className="p-4">
                                                <Badge variant="outline" className="bg-white/5 border-white/10 text-zinc-300 whitespace-nowrap">
                                                    {player.champion}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Pro Gameplay VODs */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <PlayCircle className="w-5 h-5 text-red-500" />
                            Pro Gameplay
                        </h3>
                    </div>

                    <div className="flex flex-col gap-4 pb-10">
                        {PRO_VODS.map((vod) => {
                            const isExpanded = expandedVod === vod.id;

                            return (
                                <div key={vod.id} className={`glass-panel rounded-2xl group transition-all border ${isExpanded ? 'border-red-500/30 bg-red-500/5' : 'border-white/5 hover:border-red-500/20'} relative overflow-hidden flex flex-col`}>
                                    <div className="absolute top-0 right-0 p-16 bg-red-500/5 blur-[50px] rounded-full group-hover:bg-red-500/10 transition-colors pointer-events-none" />

                                    {/* Collapsed Header (Clickable) */}
                                    <div
                                        className="relative z-10 p-5 cursor-pointer flex items-center justify-between gap-6"
                                        onClick={() => toggleVod(vod.id)}
                                    >
                                        {/* Matchup & Title */}
                                        <div className="flex items-center gap-6 min-w-0 flex-1">
                                            <div className="w-[180px] shrink-0 text-sm font-bold text-red-300 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg flex items-center justify-center gap-2">
                                                <Swords className="w-4 h-4" />
                                                {vod.matchup}
                                            </div>
                                            <h4 className="text-base font-bold text-white group-hover:text-red-400 transition-colors truncate">
                                                {vod.title}
                                            </h4>
                                        </div>

                                        {/* Metadata */}
                                        <div className="hidden md:flex items-center gap-4 text-zinc-400 text-sm shrink-0">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4" /> {vod.date}
                                            </span>
                                            <span className="bg-black/40 px-3 py-1 rounded-md border border-white/5 font-mono">
                                                {vod.duration}
                                            </span>
                                            <Badge variant="outline" className="font-mono tracking-wider border-zinc-700 text-zinc-400 bg-black/40 px-2 py-0.5">
                                                Patch {vod.patch}
                                            </Badge>
                                        </div>

                                        {/* Chevron */}
                                        <div className="shrink-0 text-zinc-500 group-hover:text-white transition-colors ml-4">
                                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="relative z-10 px-4 pb-4 animate-in slide-in-from-top-2 fade-in duration-200">

                                            {/* Video Placeholder */}
                                            <div className="w-full max-w-5xl mx-auto aspect-video bg-black/60 border border-white/10 rounded-xl mb-6 mt-2 relative flex items-center justify-center group/video overflow-hidden shadow-2xl">
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                                                <Video className="w-16 h-16 text-zinc-700 absolute opacity-30" />

                                                {/* Play Button Overlay */}
                                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-transparent group-hover/video:bg-black/40 transition-colors cursor-pointer backdrop-blur-0 group-hover/video:backdrop-blur-sm">
                                                    <div className="w-20 h-20 rounded-full bg-red-500/90 flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.5)] group-hover/video:scale-110 transition-transform">
                                                        <PlayCircle className="w-10 h-10 text-white ml-1.5" />
                                                    </div>
                                                </div>

                                                <div className="absolute bottom-4 left-4 z-30 flex items-center gap-4">
                                                    <span className="text-sm font-bold text-white flex items-center gap-1.5 bg-black/50 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                                                        <Eye className="w-4 h-4 text-zinc-400" /> {vod.views} Views
                                                    </span>
                                                </div>

                                                <div className="absolute top-4 right-4 z-30">
                                                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 px-3 py-1 font-bold tracking-widest uppercase">
                                                        Pro Scrim
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Detail Stats */}
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="bg-black/40 border border-white/5 rounded-lg p-2 text-center">
                                                    <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-0.5">Gold Diff @ 15</p>
                                                    <p className={`text-sm font-black ${vod.gd15.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{vod.gd15}</p>
                                                </div>
                                                <div className="bg-black/40 border border-white/5 rounded-lg p-2 text-center">
                                                    <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-0.5">First Blood</p>
                                                    <p className="text-sm font-black text-white">{vod.fb}</p>
                                                </div>
                                                <div className="bg-black/40 border border-white/5 rounded-lg p-2 text-center">
                                                    <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-0.5">Drag Control</p>
                                                    <p className="text-sm font-black text-blue-400">{vod.dragControl}</p>
                                                </div>
                                            </div>

                                            <Button className="w-full max-w-5xl mx-auto block mt-6 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 transition-colors font-bold text-sm h-12">
                                                Deep Dive Analysis
                                            </Button>

                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <Button className="w-full glass-panel bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors">
                        View All VODs
                    </Button>
                </div>

            </div>
        </div>
    );
}
