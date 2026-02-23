import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChampionAvatar } from '@/components/scrims/ChampionAvatar';
import { ChevronDown, ChevronUp, Trash2, Calendar, FileText, ExternalLink, Trophy } from 'lucide-react';
import { useOpponentDrafts } from '@/hooks/useOpponentDrafts';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ScoutingSavedScenariosProps {
    opponentTeamId: string;
}

export function ScoutingSavedScenarios({ opponentTeamId }: ScoutingSavedScenariosProps) {
    const { data: drafts, deleteDraft, isLoading } = useOpponentDrafts(opponentTeamId);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const savedScenarios = drafts
        .filter(d => d.tournament_context === 'SAVED_SCENARIO')
        .slice(0, 50);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this scenario?')) {
            await deleteDraft(id);
        }
    };

    if (isLoading) {
        return <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl" />)}
        </div>;
    }

    if (savedScenarios.length === 0) {
        return (
            <div className="glass-panel p-12 text-center rounded-2xl border-dashed border-white/5">
                <FileText className="w-12 h-12 mx-auto text-zinc-700 mb-4" />
                <h3 className="text-lg font-bold text-zinc-400 mb-2 uppercase tracking-tight">No Saved Scenarios</h3>
                <p className="text-zinc-500 text-sm max-w-xs mx-auto">
                    Complete a draft simulation above and save it to build your tactical dossier.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-brand-primary" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Matchup Dossier</h3>
                </div>
                <Badge variant="outline" className="text-[10px] border-white/10 text-zinc-500">
                    {savedScenarios.length} / 50 SLOTS
                </Badge>
            </div>

            <div className="grid gap-3">
                {savedScenarios.map((scenario) => {
                    const isExpanded = expandedId === scenario.id;
                    const draftData = scenario.draft_data as any;

                    return (
                        <Card key={scenario.id} className={cn(
                            "glass-card border-white/5 overflow-hidden transition-all duration-300",
                            isExpanded ? "ring-1 ring-brand-primary/20" : ""
                        )}>
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                                onClick={() => setExpandedId(isExpanded ? null : scenario.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex -space-x-2">
                                        {draftData.picks?.our_picks?.slice(0, 3).map((champ: string, i: number) => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-950 overflow-hidden relative z-[5-i]">
                                                <ChampionAvatar championName={champ} size="xs" />
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-white group-hover:text-brand-primary transition-colors">
                                            SCENARIO_{scenario.id.slice(0, 4).toUpperCase()}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Calendar className="w-3 h-3 text-zinc-600" />
                                            <span className="text-[10px] font-bold text-zinc-600">
                                                {new Date(scenario.match_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-zinc-600 hover:text-red-500 hover:bg-red-500/10"
                                        onClick={(e) => handleDelete(e, scenario.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                    {isExpanded ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="p-6 pt-0 border-t border-white/5 bg-black/40 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                                        {/* Our Side */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-black">BLUE_SIDE_PROTOCOL</Badge>
                                            </div>
                                            <div className="grid grid-cols-5 gap-2">
                                                {draftData.picks?.our_picks?.map((champ: string, i: number) => (
                                                    <div key={i} className="flex flex-col items-center gap-1">
                                                        <div className="w-10 h-10 rounded-lg border border-white/10 overflow-hidden">
                                                            <ChampionAvatar championName={champ} size="sm" />
                                                        </div>
                                                        <span className="text-[8px] font-bold text-zinc-500 uppercase truncate w-full text-center">{champ}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 opacity-60">
                                                {draftData.bans?.our_bans?.map((champ: string, i: number) => (
                                                    <div key={i} className="w-6 h-6 rounded border border-white/5 overflow-hidden grayscale">
                                                        <ChampionAvatar championName={champ} size="xs" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Opponent Side */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-end gap-2 mb-2">
                                                <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] font-black">OPP_RESPONSE_LOG</Badge>
                                            </div>
                                            <div className="grid grid-cols-5 gap-2">
                                                {draftData.picks?.enemy_picks?.map((champ: string, i: number) => (
                                                    <div key={i} className="flex flex-col items-center gap-1">
                                                        <div className="w-10 h-10 rounded-lg border border-white/10 overflow-hidden">
                                                            <ChampionAvatar championName={champ} size="sm" />
                                                        </div>
                                                        <span className="text-[8px] font-bold text-zinc-500 uppercase truncate w-full text-center">{champ}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex flex-wrap justify-end gap-1.5 opacity-60">
                                                {draftData.bans?.enemy_bans?.map((champ: string, i: number) => (
                                                    <div key={i} className="w-6 h-6 rounded border border-white/5 overflow-hidden grayscale">
                                                        <ChampionAvatar championName={champ} size="xs" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {scenario.notes && (
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FileText className="w-3 h-3 text-brand-primary" />
                                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Simulation Notes</span>
                                            </div>
                                            <p className="text-xs text-zinc-400 italic leading-relaxed">{scenario.notes}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
