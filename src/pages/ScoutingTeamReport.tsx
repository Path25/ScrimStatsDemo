import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Users,
    BarChart3,
    Target,
    LayoutDashboard,
    Shield,
    Sword,
    Trophy,
    Calendar,
    ExternalLink,
    Edit,
    ArrowUpRight,
    TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useOpponentPlayers } from "@/hooks/useOpponentPlayers";
import { useOpponentDrafts } from "@/hooks/useOpponentDrafts";
import { OpponentPlayerCard } from "@/components/scouting/OpponentPlayerCard";
import { OpponentPerformanceAnalytics } from "@/components/scouting/OpponentPerformanceAnalytics";
import { OpponentTrendChart } from "@/components/scouting/OpponentTrendChart";
import { OpponentInsightsPanel } from "@/components/scouting/OpponentInsightsPanel";
import { OpponentMatchupMatrix } from "@/components/scouting/OpponentMatchupMatrix";
import { OpponentDraftCard } from "@/components/scouting/OpponentDraftCard";
import { DraftScenarioBuilder } from "@/components/scouting/DraftScenarioBuilder";
import { OpponentTargetBans } from "@/components/scouting/OpponentTargetBans";
import { ScoutingSavedScenarios } from "@/components/scouting/ScoutingSavedScenarios";
import { Loader2, Save, Info } from "lucide-react";
import { useOpponentTeams } from "@/hooks/useOpponentTeams";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ScoutingTeamReport() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("overview");

    const { data: teams = [], isLoading: teamsLoading, updateTeam } = useOpponentTeams();
    const team = teams.find(t => t.id === id);

    const { data: players = [], isLoading: playersLoading } = useOpponentPlayers(id);
    const { data: drafts = [], isLoading: draftsLoading } = useOpponentDrafts(id);

    const [tacticalNotes, setTacticalNotes] = useState(team?.strategic_notes || "");
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    const handleSaveNotes = async () => {
        if (!team?.id) return;
        setIsSavingNotes(true);
        try {
            await updateTeam({
                id: team.id,
                strategic_notes: tacticalNotes
            });
            toast.success("Tactical notes updated");
        } catch (error) {
            toast.error("Failed to update notes");
        } finally {
            setIsSavingNotes(false);
        }
    };

    if (teamsLoading || playersLoading || draftsLoading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
            </div>
        );
    }

    if (!team) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-white">Team not found</h2>
                <Button variant="link" onClick={() => navigate("/scouting")} className="mt-4">
                    Back to Scouting
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-[1920px] mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col gap-6">
                {/* Breadcrumb style navigation like Overview */}
                <div className="flex items-center space-x-2 text-sm text-muted-foreground pl-2">
                    <span className="text-zinc-500">Scouting</span>
                    <ChevronRight className="w-4 h-4 text-zinc-700" />
                    <span className="text-white font-medium glow-text">Team Report</span>
                    <Badge variant="outline" className="ml-2 border-brand-primary/30 text-brand-primary bg-brand-primary/5 uppercase text-[10px]">{team.region || 'GLOBAL'}</Badge>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-panel p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-32 bg-brand-primary/5 blur-[100px] rounded-full pointer-events-none" />

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-20 h-20 rounded-2xl bg-zinc-900/80 flex items-center justify-center border border-white/10 text-3xl font-bold text-white shadow-2xl overflow-hidden ring-1 ring-white/5">
                            {team.logo_url ? (
                                <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                            ) : (
                                team.name.substring(0, 2).toUpperCase()
                            )}
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white glow-text tracking-tighter mb-1">{team.name}</h1>
                            <div className="flex items-center gap-5 text-sm text-zinc-400">
                                <span className="flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-brand-primary" />
                                    <span className="font-bold text-white">{drafts.filter(d => d.result === 'win').length}W</span>
                                    <span className="text-zinc-600">-</span>
                                    <span className="font-bold text-white">{drafts.filter(d => d.result === 'loss').length}L</span>
                                </span>
                                <span className="text-zinc-700">|</span>
                                <span className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-brand-secondary" />
                                    Last Faced: <span className="text-zinc-200">{drafts[0]?.match_date || 'N/A'}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 relative z-10">
                        <Button variant="outline" className="glass-button h-10 px-6 border-white/10 text-white hover:border-brand-primary/50 transition-all">
                            <Edit className="w-4 h-4 mr-2 text-brand-primary" /> Edit Team
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="overview" className="space-y-6" onValueChange={setActiveTab}>
                    <TabsList className="w-auto inline-flex justify-start overflow-x-auto no-scrollbar">
                        <TabsTrigger value="overview" className="flex items-center gap-2">
                            <LayoutDashboard className="w-4 h-4" /> Overview
                        </TabsTrigger>
                        <TabsTrigger value="players" className="flex items-center gap-2">
                            <Users className="w-4 h-4" /> Players
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" /> Team Analytics
                        </TabsTrigger>
                        <TabsTrigger value="prep" className="flex items-center gap-2">
                            <Target className="w-4 h-4" /> Game Prep
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <Card className="glass-card overflow-hidden">
                                    <div className="h-1 w-full bg-brand-primary/20" />
                                    <CardHeader>
                                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                                            <Info className="w-5 h-5 text-brand-primary" />
                                            Team Intelligence
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-zinc-300 leading-relaxed italic text-lg mb-6">
                                            "{team.description || "No description provided for this team."}"
                                        </p>
                                        {team.strategic_notes && (
                                            <div className="p-5 rounded-2xl bg-brand-primary/5 border border-brand-primary/10 shadow-inner">
                                                <h4 className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <Target className="w-3.5 h-3.5" /> High-Level Strategy
                                                </h4>
                                                <p className="text-zinc-200 whitespace-pre-wrap leading-relaxed">{team.strategic_notes}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="glass-card">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <div>
                                            <CardTitle className="text-xl font-bold">Battle History</CardTitle>
                                            <CardDescription className="text-zinc-500">Tracked performance in recent competitive encounters</CardDescription>
                                        </div>
                                        <Badge variant="outline" className="border-white/10 text-zinc-400">{drafts.length} Games Total</Badge>
                                    </CardHeader>
                                    <CardContent>
                                        {drafts.length > 0 ? (
                                            <div className="space-y-4">
                                                {drafts.slice(0, 5).map((draft) => (
                                                    <div key={draft.id} className="group relative flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-brand-primary/30 hover:bg-white/10 transition-all duration-300">
                                                        <div className="flex items-center gap-6">
                                                            <div className={cn("w-1.5 h-10 rounded-full", draft.result === 'win' ? "bg-brand-primary shadow-[0_0_10px_rgba(45,212,191,0.5)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]")} />
                                                            <div>
                                                                <div className="font-bold text-white text-lg group-hover:text-brand-primary transition-colors">{draft.opponent_name}</div>
                                                                <div className="flex items-center gap-3 text-xs text-zinc-500 uppercase tracking-wider">
                                                                    <span>{draft.match_date}</span>
                                                                    <span className="text-zinc-800">•</span>
                                                                    <span>{draft.tournament_context || 'Scrim'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="text-right">
                                                                <Badge variant="secondary" className={cn(
                                                                    "px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                                                                    draft.result === 'win' ? "bg-brand-primary/10 text-brand-primary border-brand-primary/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                                                                )}>
                                                                    {draft.result === 'win' ? 'Victory' : 'Defeat'}
                                                                </Badge>
                                                                <span className="block text-[10px] text-zinc-600 mt-1 font-bold">{draft.our_side?.toUpperCase()} SIDE</span>
                                                            </div>
                                                            <ChevronLeft className="w-5 h-5 text-zinc-700 rotate-180 group-hover:text-brand-primary transition-colors" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-zinc-600 italic flex flex-col items-center gap-3">
                                                <Trophy className="w-10 h-10 opacity-10" />
                                                No games tracked against this team yet.
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-6">
                                <Card className="glass-card">
                                    <CardHeader>
                                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                                            <ExternalLink className="w-5 h-5 text-brand-secondary" />
                                            Data Sources
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {[
                                            { name: 'Leaguepedia', icon: <ExternalLink className="w-4 h-4" /> },
                                            { name: 'LoL Esports', icon: <ExternalLink className="w-4 h-4" /> }
                                        ].map((link, i) => (
                                            <Button key={i} variant="outline" className="glass-button w-full justify-between h-12 px-4 hover:border-brand-secondary/40 group overflow-hidden">
                                                <div className="absolute inset-0 bg-brand-secondary/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                                                <span className="flex items-center gap-3 relative z-10"><span className="text-brand-secondary">{link.icon}</span> {link.name}</span>
                                                <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors relative z-10" />
                                            </Button>
                                        ))}
                                    </CardContent>
                                </Card>

                                <Card className="glass-card">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-xl font-bold flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-5 h-5 text-brand-accent" /> Roster
                                            </div>
                                            <Badge variant="outline" className="font-mono text-zinc-500 border-white/5">{players.length}/5</Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {players.map((player) => (
                                            <div key={player.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer group border border-transparent hover:border-white/5" onClick={() => setActiveTab("players")}>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center font-bold text-zinc-500 border border-white/5 group-hover:border-brand-primary/30 group-hover:text-brand-primary transition-all shadow-inner">
                                                        {player.summoner_name.substring(0, 1).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white group-hover:text-brand-primary transition-colors text-lg">{player.summoner_name}</div>
                                                        <div className="text-[10px] text-zinc-600 uppercase font-black tracking-widest flex items-center gap-1.5">
                                                            <div className="w-2 h-2 rounded-full bg-brand-accent/50" />
                                                            {player.role || 'Unknown'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant="outline" className="border-brand-primary/10 text-[9px] text-zinc-500 uppercase tracking-tighter">Verified</Badge>
                                                </div>
                                            </div>
                                        ))}
                                        {players.length === 0 && (
                                            <div className="text-center py-6 text-xs text-zinc-600 italic font-medium">No players added to this roster.</div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="players">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {players.map((player) => (
                                <OpponentPlayerCard key={player.id} player={player} />
                            ))}
                            {players.length === 0 && (
                                <div className="col-span-full py-12 text-center text-zinc-500">
                                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="font-bold">No Players Tracked</p>
                                    <p className="text-sm max-w-sm mx-auto mt-1 mb-6">Add opponent players to begin detailed performance analysis and champion pool scouting.</p>
                                    <Button>Add Opponent Player</Button>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="analytics">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                <OpponentPerformanceAnalytics opponentTeamId={team.id!} />
                            </div>
                            <div className="space-y-8">
                                <OpponentInsightsPanel opponentTeamId={team.id!} drafts={drafts} />
                                <Card className="bg-black/40 border-white/10">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Recent Drafts</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {drafts.slice(0, 3).map(draft => (
                                            <OpponentDraftCard
                                                key={draft.id}
                                                draft={draft as any}
                                                onEdit={() => { }}
                                                onDelete={() => { }}
                                                onView={() => { }}
                                            />
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="prep">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                <Card className="glass-card overflow-hidden">
                                    <div className="h-1 w-full bg-orange-500/20" />
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                                            <Sword className="w-5 h-5 text-orange-500" />
                                            Draft Simulator
                                        </CardTitle>
                                        <CardDescription className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Standard Pick/Ban Sequence</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <DraftScenarioBuilder opponentTeamId={id!} />
                                    </CardContent>
                                </Card>

                                <Card className="glass-card">
                                    <CardHeader>
                                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                                            <Edit className="w-5 h-5 text-brand-primary" />
                                            Strategic Directives
                                        </CardTitle>
                                        <CardDescription className="text-zinc-500">Define high-priority win conditions for this specific matchup</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="relative group">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary/20 to-transparent rounded-xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                                            <Textarea
                                                placeholder="Enter game plan, jungle routes, and specific tactical notes..."
                                                className="min-h-[250px] bg-black/60 border-white/10 focus:border-brand-primary placeholder:text-zinc-700 text-zinc-200 leading-relaxed rounded-xl relative"
                                                value={tacticalNotes}
                                                onChange={(e) => setTacticalNotes(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <Button
                                                onClick={handleSaveNotes}
                                                disabled={isSavingNotes || tacticalNotes === team.strategic_notes}
                                                className="bg-brand-primary text-black font-black hover:bg-brand-primary/90 px-8 h-12 rounded-xl shadow-[0_0_20px_rgba(45,212,191,0.2)] hover:shadow-[0_0_30px_rgba(45,212,191,0.4)] transition-all"
                                            >
                                                {isSavingNotes ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                                                CONFIRM STRATEGY
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-6">
                                <OpponentTargetBans opponentTeamId={id!} />
                                <ScoutingSavedScenarios opponentTeamId={id!} />

                                <div className="glass-panel p-6 rounded-2xl border-orange-500/20 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500/50" />
                                    <h4 className="text-xs font-black flex items-center gap-2 text-orange-400 uppercase tracking-widest mb-6">
                                        <Info className="w-4 h-4" />
                                        Scouting Protocol
                                    </h4>
                                    <ul className="space-y-4">
                                        {[
                                            "Identify 3 target bans",
                                            "Review top-laner champion pool",
                                            "Simulate at least 2 draft scenarios",
                                            "Define early game priority lanes"
                                        ].map((step, i) => (
                                            <li key={i} className="flex items-start gap-4 text-xs font-medium text-zinc-400 group cursor-default">
                                                <div className="w-5 h-5 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-zinc-600 group-hover:border-orange-500/40 group-hover:text-orange-400 transition-all">
                                                    {i + 1}
                                                </div>
                                                <span className="pt-0.5 group-hover:text-zinc-200 transition-colors">{step}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
