
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Eye, Shield, Target } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ScrimGame } from '@/types/scrimGame';

interface GameHeatmapProps {
    game?: ScrimGame;
    killEvents?: { x: number; y: number; team: string }[];
    wardEvents?: { x: number; y: number; team: string; type: string }[];
    isStatic?: boolean;
}

export const GameHeatmap: React.FC<GameHeatmapProps> = ({ game, killEvents: explicitKills, wardEvents: explicitWards, isStatic }) => {
    const [view, setView] = useState<'kills' | 'wards'>('kills');

    const killEvents = explicitKills || game?.external_game_data?.post_game_data?.kill_events || [
        { x: 12000, y: 12000, team: 'blue' },
        { x: 2500, y: 2500, team: 'red' },
        { x: 7500, y: 7500, team: 'blue' },
        { x: 4000, y: 11000, team: 'red' },
        { x: 11000, y: 4000, team: 'blue' },
        { x: 6000, y: 8000, team: 'red' },
        { x: 9000, y: 7000, team: 'blue' },
        { x: 13000, y: 2000, team: 'red' },
        { x: 2000, y: 13000, team: 'blue' },
    ];

    const wardEvents = explicitWards || [
        { x: 8000, y: 8000, team: 'blue', type: 'control' },
        { x: 7000, y: 7000, team: 'red', type: 'stealth' },
        { x: 12500, y: 12500, team: 'blue', type: 'stealth' },
        { x: 2500, y: 2500, team: 'red', type: 'control' },
        { x: 11000, y: 4500, team: 'red', type: 'stealth' },
    ];

    const transformCoord = (coord: number) => (coord / 15000) * 100;

    return (
        <Card className="glass-card overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <Target className="h-4 w-4" />
                    Rift Activity Map
                </CardTitle>
                <Tabs value={view} onValueChange={(v: any) => setView(v)} className="w-[110px]">
                    <TabsList className="grid w-full grid-cols-2 h-7 p-0.5">
                        <TabsTrigger value="kills" className="text-[10px] py-1">Kills</TabsTrigger>
                        <TabsTrigger value="wards" className="text-[10px] py-1">Wards</TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent className="p-3">
                <div className="aspect-square w-full max-w-[260px] mx-auto relative rounded-lg overflow-hidden shadow-2xl border border-white/10 bg-[#06090f]">
                    {/* Custom Rift Image Background */}
                    <img
                        src="/assets/rift_underlay.png"
                        alt="Summoner's Rift"
                        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-lighten"
                    />

                    {/* Heatmap Layer */}
                    <div className="absolute inset-0 overflow-hidden">
                        {view === 'kills' ? (
                            <div className="relative w-full h-full">
                                {/* 1. Underlying Heat Blobs (The "Gooey" Heat) */}
                                <div className="absolute inset-0 filter blur-[12px] opacity-80 contrast-150">
                                    {killEvents.map((event: any, i: number) => (
                                        <div
                                            key={`heat-${i}`}
                                            className="absolute rounded-full"
                                            style={{
                                                left: `${transformCoord(event.x)}%`,
                                                bottom: `${transformCoord(event.y)}%`,
                                                width: '32px',
                                                height: '32px',
                                                transform: 'translate(-50%, 50%)',
                                                background: `radial-gradient(circle, ${event.team === 'blue' ? 'rgba(59,130,246,0.8) 0%, rgba(59,130,246,0) 70%' : 'rgba(239,68,68,0.8) 0%, rgba(239,68,68,0) 70%'
                                                    })`
                                            }}
                                        />
                                    ))}
                                </div>

                                {/* 2. Intensity Centers (Hot spots) */}
                                <div className="absolute inset-0">
                                    {killEvents.map((event: any, i: number) => (
                                        <div
                                            key={`center-${i}`}
                                            className={`absolute w-3 h-3 rounded-full blur-[2px] border border-white/20 ${event.team === 'blue' ? 'bg-blue-400' : 'bg-red-500'
                                                }`}
                                            style={{
                                                left: `${transformCoord(event.x)}%`,
                                                bottom: `${transformCoord(event.y)}%`,
                                                transform: 'translate(-50%, 50%) shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                                            }}
                                        >
                                            {/* Inner heat core */}
                                            <div className="absolute inset-0.5 rounded-full bg-white opacity-40" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* Wards Layer - Keeps icons for clarity */
                            wardEvents.map((event: any, i: number) => (
                                <div
                                    key={i}
                                    className={`absolute w-4 h-4 flex items-center justify-center ${event.team === 'blue' ? 'text-blue-400' : 'text-red-400'
                                        }`}
                                    style={{
                                        left: `${transformCoord(event.x)}%`,
                                        bottom: `${transformCoord(event.y)}%`,
                                        transform: 'translate(-50%, 50%)'
                                    }}
                                >
                                    <div className="absolute inset-0 bg-current opacity-30 blur-sm rounded-full animate-pulse" />
                                    {event.type === 'control' ? <Shield className="w-full h-full relative z-10" /> : <Eye className="w-full h-full relative z-10" />}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Ambient Overlay for depth */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-black/20 via-transparent to-black/20" />
                </div>

                <div className="mt-3 flex justify-between items-center text-[8px] uppercase font-black text-zinc-500">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 font-bold">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3B82F6]" />
                            <span>Blue Intensity</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#EF4444]" />
                            <span>Red Intensity</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
