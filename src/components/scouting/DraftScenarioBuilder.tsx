import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChampionAvatar } from '@/components/scrims/ChampionAvatar';
import { CHAMPION_ID_MAP } from '@/utils/championUtils';
import { Search, RotateCcw, Shield, Sword, ChevronRight, Info, Save, Loader2 } from 'lucide-react';
import { useOpponentDrafts } from '@/hooks/useOpponentDrafts';
import { useOpponentTeams } from '@/hooks/useOpponentTeams';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';

interface DraftSlot {
    type: 'pick' | 'ban';
    team: 'blue' | 'red';
    champion: string | null;
    label: string;
}

const DRAFT_SEQUENCE: { type: 'pick' | 'ban'; team: 'blue' | 'red'; label: string }[] = [
    // Phase 1 Bans
    { type: 'ban', team: 'blue', label: 'B1' },
    { type: 'ban', team: 'red', label: 'R1' },
    { type: 'ban', team: 'blue', label: 'B2' },
    { type: 'ban', team: 'red', label: 'R2' },
    { type: 'ban', team: 'blue', label: 'B3' },
    { type: 'ban', team: 'red', label: 'R3' },
    // Phase 1 Picks
    { type: 'pick', team: 'blue', label: 'B1' },
    { type: 'pick', team: 'red', label: 'R1' },
    { type: 'pick', team: 'red', label: 'R2' },
    { type: 'pick', team: 'blue', label: 'B2' },
    { type: 'pick', team: 'blue', label: 'B3' },
    { type: 'pick', team: 'red', label: 'R3' },
    // Phase 2 Bans
    { type: 'ban', team: 'red', label: 'R4' },
    { type: 'ban', team: 'blue', label: 'B4' },
    { type: 'ban', team: 'red', label: 'R5' },
    { type: 'ban', team: 'blue', label: 'B5' },
    // Phase 2 Picks
    { type: 'pick', team: 'red', label: 'R4' },
    { type: 'pick', team: 'blue', label: 'B4' },
    { type: 'pick', team: 'blue', label: 'B5' },
    { type: 'pick', team: 'red', label: 'R5' },
];

interface DraftScenarioBuilderProps {
    opponentTeamId: string;
}

export function DraftScenarioBuilder({ opponentTeamId }: DraftScenarioBuilderProps) {
    const [slots, setSlots] = useState<DraftSlot[]>(
        DRAFT_SEQUENCE.map(s => ({ ...s, champion: null }))
    );
    const [currentStep, setCurrentStep] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const { isCoach, isManager } = useRole();
    const canSave = isCoach || isManager;

    const { createDraft } = useOpponentDrafts(opponentTeamId);
    const { data: teams } = useOpponentTeams();
    const team = teams?.find(t => t.id === opponentTeamId);

    const champions = useMemo(() => Object.values(CHAMPION_ID_MAP).sort(), []);

    const filteredChampions = useMemo(() => {
        const usedChampions = slots.map(s => s.champion).filter(Boolean);
        return champions.filter(c =>
            c.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !usedChampions.includes(c)
        );
    }, [champions, searchQuery, slots]);

    const handleSelectChampion = (champion: string) => {
        if (currentStep >= slots.length) return;

        const newSlots = [...slots];
        newSlots[currentStep].champion = champion;
        setSlots(newSlots);
        setCurrentStep(prev => prev + 1);
        setSearchQuery('');
    };

    const resetDraft = () => {
        setSlots(DRAFT_SEQUENCE.map(s => ({ ...s, champion: null })));
        setCurrentStep(0);
        setSearchQuery('');
    };

    const undoStep = () => {
        if (currentStep === 0) return;
        const newSlots = [...slots];
        newSlots[currentStep - 1].champion = null;
        setSlots(newSlots);
        setCurrentStep(prev => prev - 1);
    };

    const handleSaveScenario = async () => {
        try {
            setIsSaving(true);
            const bluePicks = slots.filter(s => s.team === 'blue' && s.type === 'pick').map(s => s.champion);
            const redPicks = slots.filter(s => s.team === 'red' && s.type === 'pick').map(s => s.champion);
            const blueBans = slots.filter(s => s.team === 'blue' && s.type === 'ban').map(s => s.champion);
            const redBans = slots.filter(s => s.team === 'red' && s.type === 'ban').map(s => s.champion);

            await createDraft({
                opponent_team_id: opponentTeamId,
                opponent_name: team?.name || 'Unknown Opponent',
                match_date: new Date().toISOString(),
                result: 'simulation',
                tournament_context: 'SAVED_SCENARIO',
                our_side: 'blue', // Default, could be made configurable
                draft_data: {
                    picks: {
                        enemy_picks: redPicks,
                        our_picks: bluePicks
                    },
                    bans: {
                        enemy_bans: redBans,
                        our_bans: blueBans
                    }
                },
                notes: `Simulated draft scenario saved on ${new Date().toLocaleDateString()}`
            });
            resetDraft();
        } finally {
            setIsSaving(false);
        }
    };

    const activeSlot = slots[currentStep];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Left: Blue Side */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2 p-2 border-b border-blue-500/10">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        <span className="text-[10px] font-black text-blue-400 tracking-widest uppercase">OUR TEAM</span>
                    </div>
                    <div className="space-y-3">
                        {slots.filter(s => s.team === 'blue' && s.type === 'pick').map((slot, i) => (
                            <div key={i} className={cn(
                                "flex items-center gap-3 p-3 rounded-xl border transition-all duration-300",
                                slot.champion ? "bg-blue-500/5 border-blue-500/20" : "bg-black/20 border-white/5 opacity-50"
                            )}>
                                <div className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center bg-zinc-900 overflow-hidden shadow-inner">
                                    {slot.champion ? <ChampionAvatar championName={slot.champion} size="sm" /> : <div className="text-[10px] text-zinc-700 font-black">{slot.label}</div>}
                                </div>
                                <div className="flex-1">
                                    <div className={cn(
                                        "text-xs font-black tracking-tight",
                                        slot.champion ? "text-white" : "text-zinc-600 uppercase"
                                    )}>
                                        {slot.champion || 'Awaiting Pick'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-5 gap-2 mt-6">
                        {slots.filter(s => s.team === 'blue' && s.type === 'ban').map((slot, i) => (
                            <div key={i} className={cn(
                                "aspect-square rounded-lg border flex items-center justify-center transition-all duration-300",
                                slot.champion ? "bg-zinc-900 border-white/10 grayscale-0 shadow-lg" : "bg-black/40 border-white/5 grayscale"
                            )}>
                                {slot.champion ? <ChampionAvatar championName={slot.champion} size="xs" /> : <div className="text-[8px] text-zinc-800 font-bold">{slot.label}</div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Center: Selection Area */}
                <div className="xl:col-span-2 space-y-4">
                    <Card className="glass-card overflow-hidden border-white/5">
                        <div className="h-1 w-full bg-gradient-to-r from-blue-500/40 via-brand-primary/40 to-red-500/40" />
                        <CardHeader className="bg-white/5 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                        <Sword className="w-5 h-5 text-brand-primary" />
                                        Interactive Simulator
                                    </CardTitle>
                                    <CardDescription className="text-xs font-medium uppercase tracking-widest text-zinc-500">Pick/Ban Sequence Protocol</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={undoStep} disabled={currentStep === 0} className="h-8 text-xs font-bold hover:bg-white/5 rounded-lg">
                                        UNDO
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={resetDraft} className="h-8 text-xs font-bold text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg">
                                        <RotateCcw className="w-3 h-3 mr-1" /> RESET
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {currentStep < slots.length ? (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-center gap-8 mb-4">
                                        <div className="text-center space-y-3">
                                            <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">ENGAGEMENT STATUS</div>
                                            <div className={cn(
                                                "flex items-center gap-4 px-8 py-4 rounded-2xl border-2 transition-all duration-500",
                                                activeSlot.team === 'blue'
                                                    ? 'bg-blue-500/5 border-blue-500/30 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                                                    : 'bg-red-500/5 border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                                            )}>
                                                {activeSlot.type === 'ban' ? <Shield className="w-6 h-6 animate-pulse" /> : <Sword className="w-6 h-6 animate-pulse" />}
                                                <div className="text-left">
                                                    <div className="text-[10px] font-black uppercase opacity-60">{activeSlot.team.toUpperCase()} SIDE</div>
                                                    <div className="font-black text-2xl tracking-tighter">{activeSlot.type.toUpperCase()} PHASE {activeSlot.label}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute -inset-0.5 bg-brand-primary/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-1000"></div>
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                        <Input
                                            placeholder="Search champions..."
                                            className="pl-12 bg-black/60 border-white/5 h-14 text-lg font-bold rounded-xl focus:border-brand-primary focus:ring-0 placeholder:text-zinc-700 relative"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && filteredChampions.length > 0) {
                                                    handleSelectChampion(filteredChampions[0]);
                                                }
                                            }}
                                            autoFocus
                                        />
                                    </div>

                                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                        {filteredChampions.map((champ) => (
                                            <button
                                                key={champ}
                                                onClick={() => handleSelectChampion(champ)}
                                                className="group flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
                                            >
                                                <ChampionAvatar championName={champ} size="md" className="group-hover:scale-110 group-active:scale-95 transition-transform" />
                                                <span className="text-[10px] font-black text-zinc-500 group-hover:text-white truncate w-full text-center tracking-tight">
                                                    {champ.toUpperCase()}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 space-y-6">
                                    <div className="relative inline-block">
                                        <div className="absolute -inset-4 bg-brand-primary/20 rounded-full blur-2xl animate-pulse" />
                                        <div className="relative w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center border border-brand-primary/30">
                                            <Shield className="w-10 h-10 text-brand-primary" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black text-white tracking-tighter">SIMULATION COMPLETE</h3>
                                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest max-w-xs mx-auto">Composition established. Prepare for tactical evaluation.</p>
                                    </div>
                                    <div className="flex items-center justify-center gap-4">
                                        <Button onClick={resetDraft} variant="outline" className="h-12 px-8 rounded-xl border-white/10 text-zinc-400 hover:text-white font-bold">
                                            DISCARD
                                        </Button>
                                        <Button
                                            onClick={handleSaveScenario}
                                            disabled={isSaving || !canSave}
                                            className="h-12 px-10 rounded-xl bg-brand-primary text-black font-black hover:bg-brand-primary/90 shadow-[0_0_20px_rgba(45,212,191,0.2)]"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                            {canSave ? 'SAVE SCENARIO' : 'VIEW ONLY'}
                                        </Button>
                                    </div>
                                    {!canSave && (
                                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-4">
                                            Saving simulations is restricted to authorized coaching personnel.
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="p-5 rounded-2xl bg-brand-primary/5 border border-brand-primary/10 flex items-start gap-4 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 bg-brand-primary/5 blur-2xl rounded-full" />
                        <Info className="w-5 h-5 text-brand-primary mt-0.5 shrink-0 relative z-10" />
                        <div className="text-xs text-zinc-400 leading-relaxed relative z-10">
                            <span className="text-brand-primary font-black uppercase tracking-widest block mb-1">STRATEGIC DOCTRINE</span>
                            Test counters against predicted opponent picks. High-value simulations should be saved to the Matchup Dossier for future verification.
                        </div>
                    </div>
                </div>

                {/* Right: Red Side */}
                <div className="space-y-4">
                    <div className="flex items-center justify-end gap-2 mb-2 p-2 border-b border-red-500/10 text-right">
                        <span className="text-[10px] font-black text-red-400 tracking-widest uppercase">OPPONENT</span>
                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                    </div>
                    <div className="space-y-3">
                        {slots.filter(s => s.team === 'red' && s.type === 'pick').map((slot, i) => (
                            <div key={i} className={cn(
                                "flex items-center flex-row-reverse gap-3 p-3 rounded-xl border transition-all duration-300",
                                slot.champion ? "bg-red-500/5 border-red-500/20" : "bg-black/20 border-white/5 opacity-50"
                            )}>
                                <div className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center bg-zinc-900 overflow-hidden shadow-inner">
                                    {slot.champion ? <ChampionAvatar championName={slot.champion} size="sm" /> : <div className="text-[10px] text-zinc-700 font-black">{slot.label}</div>}
                                </div>
                                <div className="flex-1 text-right">
                                    <div className={cn(
                                        "text-xs font-black tracking-tight",
                                        slot.champion ? "text-white" : "text-zinc-600 uppercase"
                                    )}>
                                        {slot.champion || 'Awaiting Pick'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-5 gap-2 mt-6">
                        {slots.filter(s => s.team === 'red' && s.type === 'ban').map((slot, i) => (
                            <div key={i} className={cn(
                                "aspect-square rounded-lg border flex items-center justify-center transition-all duration-300",
                                slot.champion ? "bg-zinc-900 border-white/10 grayscale-0 shadow-lg" : "bg-black/40 border-white/5 grayscale"
                            )}>
                                {slot.champion ? <ChampionAvatar championName={slot.champion} size="xs" /> : <div className="text-[8px] text-zinc-800 font-bold">{slot.label}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
