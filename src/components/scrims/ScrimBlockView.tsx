import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
    Trophy, Target, Users, BarChart3, ChevronRight, ChevronLeft,
    Clock, Swords, Shield, ArrowLeft, Video, MessageSquare, Layers
} from 'lucide-react';
import { useScrimGames } from '@/hooks/useScrimGames';
import { useScrimParticipants } from '@/hooks/useScrimParticipants';
import { useLiveGameData } from '@/hooks/useLiveGameData';
import { GameOverviewTab } from './GameOverviewTab';
import { DraftView } from './DraftView';
import { CoachFeedback } from './CoachFeedback';
import { ExternalDataAnalytics } from './analytics/ExternalDataAnalytics';
import { DamageAnalysisChart } from './analytics/DamageAnalysisChart';
import { LiveGameChart } from './LiveGameChart';
import { GameTimeline } from './GameTimeline';
import { cn } from '@/lib/utils';
import type { ScrimGame } from '@/types/scrimGame';

interface ScrimBlockViewProps {
    scrimId: string;
    opponentName?: string;
    matchDate?: string;
    format?: string;
    result?: string;
    onClose: () => void;
}

// Get mock scrim metadata for demo
const MOCK_SCRIM_META = {
    opponent_name: 'G2 Academy',
    match_date: '2026-02-19',
    format: 'BO3',
    result: 'W 2-1',
    status: 'Completed',
};

export const ScrimBlockView: React.FC<ScrimBlockViewProps> = ({
    scrimId,
    opponentName,
    matchDate,
    format,
    result,
    onClose,
}) => {
    const { scrimGames, isLoading: gamesLoading } = useScrimGames(scrimId);
    const [selectedGameIndex, setSelectedGameIndex] = useState<number | null>(null); // null = block summary
    const [activeTab, setActiveTab] = useState('overview');

    const selectedGame = selectedGameIndex !== null ? scrimGames[selectedGameIndex] : null;

    // Use ScrimParticipants/LiveData for the selected game
    const { participants, isLoading: participantsLoading } = useScrimParticipants(selectedGame?.id);
    const { liveData } = useLiveGameData(selectedGame?.id);

    // Use provided meta or fallback to mock
    const meta = {
        opponent_name: opponentName || MOCK_SCRIM_META.opponent_name,
        match_date: matchDate || MOCK_SCRIM_META.match_date,
        format: format || MOCK_SCRIM_META.format,
        result: result || MOCK_SCRIM_META.result,
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '--:--';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Calculate block aggregate stats
    const blockStats = {
        totalGames: scrimGames.length,
        wins: scrimGames.filter(g => g.result === 'win').length,
        losses: scrimGames.filter(g => g.result === 'loss').length,
        totalKills: scrimGames.reduce((sum, g) => sum + (g.our_team_kills || 0), 0),
        totalDeaths: scrimGames.reduce((sum, g) => sum + (g.enemy_team_kills || 0), 0),
        totalGold: scrimGames.reduce((sum, g) => sum + (g.our_team_gold || 0), 0),
        totalEnemyGold: scrimGames.reduce((sum, g) => sum + (g.enemy_team_gold || 0), 0),
        avgDuration: scrimGames.length > 0
            ? Math.round(scrimGames.reduce((sum, g) => sum + (g.duration_seconds || 0), 0) / scrimGames.length)
            : 0,
        blueSideGames: scrimGames.filter(g => g.side === 'blue').length,
        redSideGames: scrimGames.filter(g => g.side === 'red').length,
        blueSideWins: scrimGames.filter(g => g.side === 'blue' && g.result === 'win').length,
        redSideWins: scrimGames.filter(g => g.side === 'red' && g.result === 'win').length,
    };

    if (gamesLoading) {
        return (
            <div className="space-y-6 max-w-[1920px] mx-auto pb-10">
                <div className="glass-panel p-8 rounded-2xl flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4" />
                        <p className="text-zinc-400">Loading scrim block...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-[1920px] mx-auto pb-10">

            {/* Header Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl sticky top-24 z-20">
                <div className="flex items-center space-x-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-white/5"
                        onClick={onClose}
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center space-x-2 text-sm">
                        <span className="text-zinc-500">Scrims</span>
                        <ChevronRight className="w-4 h-4 text-zinc-700" />
                        <span className="text-white font-medium glow-text">{meta.opponent_name}</span>
                    </div>
                    <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] uppercase font-bold",
                        meta.result?.startsWith('W') ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    )}>
                        {meta.result}
                    </span>
                </div>

                <div className="flex items-center gap-3 text-sm text-zinc-400">
                    <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {meta.match_date}
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="font-bold text-zinc-300">{meta.format}</span>
                    <span className="text-zinc-600">•</span>
                    <span>{blockStats.totalGames} Games</span>
                </div>
            </div>

            {/* Game Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-1">
                <Button
                    variant="ghost"
                    onClick={() => { setSelectedGameIndex(null); setActiveTab('overview'); }}
                    className={cn(
                        "h-10 px-5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                        selectedGameIndex === null
                            ? "bg-brand-primary/15 text-brand-primary border border-brand-primary/30 shadow-[0_0_15px_rgba(45,212,191,0.1)]"
                            : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                    )}
                >
                    <Layers className="w-4 h-4 mr-2" />
                    Block Summary
                </Button>

                {scrimGames.map((game, idx) => (
                    <Button
                        key={game.id}
                        variant="ghost"
                        onClick={() => { setSelectedGameIndex(idx); setActiveTab('overview'); }}
                        className={cn(
                            "h-10 px-5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                            selectedGameIndex === idx
                                ? "bg-white/10 text-white border border-white/20"
                                : "text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent"
                        )}
                    >
                        <span className="mr-2">Game {game.game_number}</span>
                        {game.result && (
                            <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase",
                                game.result === 'win' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                            )}>
                                {game.result === 'win' ? 'W' : 'L'}
                            </span>
                        )}
                        {game.side && (
                            <span className={cn(
                                "ml-1.5 text-[10px] font-bold",
                                game.side === 'blue' ? "text-blue-400" : "text-red-400"
                            )}>
                                {game.side === 'blue' ? 'B' : 'R'}
                            </span>
                        )}
                    </Button>
                ))}
            </div>

            {/* Content Area */}
            {selectedGameIndex === null ? (
                /* ============ BLOCK SUMMARY ============ */
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Aggregate Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {[
                            { label: "Games", value: blockStats.totalGames, icon: Swords },
                            {
                                label: "Record", value: `${blockStats.wins}W - ${blockStats.losses}L`, icon: Trophy,
                                color: blockStats.wins > blockStats.losses ? "text-green-400" : "text-red-400"
                            },
                            { label: "Total Kills", value: blockStats.totalKills, icon: Target },
                            { label: "Total Deaths", value: blockStats.totalDeaths, icon: Shield },
                            { label: "Avg Duration", value: formatDuration(blockStats.avgDuration), icon: Clock },
                            {
                                label: "Gold Diff", value: `${((blockStats.totalGold - blockStats.totalEnemyGold) / 1000).toFixed(1)}k`,
                                icon: BarChart3,
                                color: blockStats.totalGold > blockStats.totalEnemyGold ? "text-green-400" : "text-red-400"
                            },
                        ].map(stat => (
                            <div key={stat.label} className="glass-card p-4 rounded-xl">
                                <div className="flex items-center gap-2 mb-1">
                                    <stat.icon className="w-3.5 h-3.5 text-zinc-500" />
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{stat.label}</span>
                                </div>
                                <p className={cn("text-xl font-black", stat.color || "text-white")}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Side Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="glass-card p-5 rounded-xl">
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-4">Side Performance</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-blue-400 font-bold text-sm">Blue Side</span>
                                    <span className="text-white font-bold">{blockStats.blueSideWins}W / {blockStats.blueSideGames - blockStats.blueSideWins}L</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all"
                                        style={{ width: blockStats.blueSideGames > 0 ? `${(blockStats.blueSideWins / blockStats.blueSideGames) * 100}%` : '0%' }}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-red-400 font-bold text-sm">Red Side</span>
                                    <span className="text-white font-bold">{blockStats.redSideWins}W / {blockStats.redSideGames - blockStats.redSideWins}L</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-red-500 rounded-full transition-all"
                                        style={{ width: blockStats.redSideGames > 0 ? `${(blockStats.redSideWins / blockStats.redSideGames) * 100}%` : '0%' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-5 rounded-xl">
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-4">Game-by-Game</h3>
                            <div className="space-y-2">
                                {scrimGames.map(game => (
                                    <div
                                        key={game.id}
                                        className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg hover:bg-white/[0.06] cursor-pointer transition-all"
                                        onClick={() => { setSelectedGameIndex(scrimGames.indexOf(game)); setActiveTab('overview'); }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-white">Game {game.game_number}</span>
                                            {game.side && (
                                                <span className={cn(
                                                    "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                                    game.side === 'blue' ? "bg-blue-500/20 text-blue-400" : "bg-red-500/20 text-red-400"
                                                )}>
                                                    {game.side === 'blue' ? 'Blue' : 'Red'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-zinc-400">{formatDuration(game.duration_seconds)}</span>
                                            <span className="text-xs text-zinc-500">{game.our_team_kills || 0} - {game.enemy_team_kills || 0}</span>
                                            {game.result && (
                                                <span className={cn(
                                                    "text-xs font-bold px-2 py-0.5 rounded",
                                                    game.result === 'win' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                                )}>
                                                    {game.result === 'win' ? 'WIN' : 'LOSS'}
                                                </span>
                                            )}
                                            <ChevronRight className="w-4 h-4 text-zinc-600" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : selectedGame ? (
                /* ============ INDIVIDUAL GAME VIEW ============ */
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Game quick info bar */}
                    <div className="glass-card p-4 rounded-xl mb-4 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">Game {selectedGame.game_number}</span>
                            {selectedGame.side && (
                                <span className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded",
                                    selectedGame.side === 'blue' ? "bg-blue-500/20 text-blue-400" : "bg-red-500/20 text-red-400"
                                )}>
                                    {selectedGame.side === 'blue' ? 'Blue Side' : 'Red Side'}
                                </span>
                            )}
                            {selectedGame.result && (
                                <span className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                                    selectedGame.result === 'win' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                )}>
                                    {selectedGame.result}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-zinc-400 ml-auto">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatDuration(selectedGame.duration_seconds)}</span>
                            <span>Kills: {selectedGame.our_team_kills || 0} - {selectedGame.enemy_team_kills || 0}</span>
                            <span>Gold: {((selectedGame.our_team_gold || 0) / 1000).toFixed(1)}k vs {((selectedGame.enemy_team_gold || 0) / 1000).toFixed(1)}k</span>
                        </div>

                        {/* Prev/Next navigation */}
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 text-zinc-500 hover:text-white"
                                onClick={() => setSelectedGameIndex(Math.max(0, selectedGameIndex - 1))}
                                disabled={selectedGameIndex === 0}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 text-zinc-500 hover:text-white"
                                onClick={() => setSelectedGameIndex(Math.min(scrimGames.length - 1, selectedGameIndex + 1))}
                                disabled={selectedGameIndex === scrimGames.length - 1}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Game Content Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="glass-card border border-white/5 p-1 rounded-xl w-full grid grid-cols-4 gap-1 no-scrollbar">
                            <TabsTrigger
                                value="overview"
                                className="data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg text-xs font-bold text-zinc-500"
                            >
                                <Trophy className="h-3.5 w-3.5 mr-2" />
                                Overview
                            </TabsTrigger>
                            <TabsTrigger
                                value="draft"
                                className="data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg text-xs font-bold text-zinc-500"
                            >
                                <Target className="h-3.5 w-3.5 mr-2" />
                                Draft
                            </TabsTrigger>
                            <TabsTrigger
                                value="feedback"
                                className="data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg text-xs font-bold text-zinc-500"
                            >
                                <MessageSquare className="h-3.5 w-3.5 mr-2" />
                                Feedback
                            </TabsTrigger>
                            <TabsTrigger
                                value="analytics"
                                className="data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg text-xs font-bold text-zinc-500"
                            >
                                <BarChart3 className="h-3.5 w-3.5 mr-2" />
                                Analytics
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-6">
                            <TabsContent value="overview" className="mt-0">
                                {participantsLoading ? (
                                    <div className="glass-card p-8 rounded-xl text-center text-zinc-400">Loading game data...</div>
                                ) : (
                                    <GameOverviewTab game={selectedGame} participants={participants} />
                                )}
                            </TabsContent>

                            <TabsContent value="draft" className="mt-0">
                                <DraftView game={selectedGame} participants={participants || []} />
                            </TabsContent>

                            <TabsContent value="feedback" className="mt-0">
                                <CoachFeedback game={selectedGame} participants={participants} />
                            </TabsContent>

                            <TabsContent value="analytics" className="mt-0">
                                <div className="space-y-8">
                                    <ExternalDataAnalytics game={selectedGame} participants={participants} />
                                    <DamageAnalysisChart game={selectedGame} participants={participants} />

                                    {liveData && liveData.length > 0 && (
                                        <div className="space-y-6">
                                            <div className="border-t border-white/5 pt-8">
                                                <h3 className="text-lg font-semibold mb-6 text-white">Live Game Timeline</h3>
                                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                                    <LiveGameChart liveData={liveData} metric="kills" />
                                                    <LiveGameChart liveData={liveData} metric="gold" />
                                                </div>
                                                <div className="mt-6">
                                                    <GameTimeline liveData={liveData} />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {(!liveData || liveData.length === 0) && (
                                        <div className="text-center py-8 glass-card rounded-xl">
                                            <BarChart3 className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                                            <p className="text-sm text-zinc-500">
                                                Live timeline data not available for this game
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            ) : null}
        </div>
    );
};
