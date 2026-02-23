import {
  Calendar,
  Clock,
  Video,
  MoreHorizontal,
  Plus,
  Filter,
  Search,
  ChevronRight,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ScheduleScrimDialog } from "@/components/scrims/ScheduleScrimDialog";
import { useOptimizedScrimsData, Scrim } from "@/hooks/useOptimizedScrimsData";
import { useScrimsData } from "@/hooks/useScrimsData";
import { EditScrimDialog } from "@/components/scrims/EditScrimDialog";
import { format, parseISO, isAfter, isBefore, startOfToday } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRole } from "@/contexts/RoleContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";

export default function Scrims() {
  const { isManager, isCoach } = useRole();
  const hasEditPermission = isManager || isCoach;
  const [editingScrim, setEditingScrim] = useState<Scrim | null>(null);
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];

  // Upcoming Scrims
  const { data: upcomingData, isLoading: isLoadingUpcoming } = useOptimizedScrimsData({
    dateFrom: today,
    pageSize: 6,
    // We might want to filter out 'Completed' if they are in the future (rare but possible)
  });
  const upcomingScrims = upcomingData?.scrims || [];

  // Match History
  // We want filtering for history, but for now simple fetch
  const { data: historyData, isLoading: isLoadingHistory } = useOptimizedScrimsData({
    // dateTo: today, // causing query overlap if not careful? 
    // specific statuses?
    // For now just fetch all and filter in client or rely on sort? 
    // Actually useOptimizedScrimsData sorts by match_date desc.
    // History is dateTo today.
    dateTo: today,
    pageSize: 20
  });
  const historyScrims = historyData?.scrims || [];

  const { deleteScrim } = useScrimsData();

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this scrim?")) {
      deleteScrim(id);
    }
  }

  // Helper to format time
  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return "TBD";
    // timeStr is "HH:mm:ss" or "HH:mm"
    return timeStr.substring(0, 5);
  };

  // Helper to format date
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "MMM dd");
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-[1920px] mx-auto pb-10">
      {/* 1. Compact Header & Quick Actions Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl sticky top-24 z-20">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground pl-2">
          <span className="text-zinc-500">ScrimStats</span>
          <ChevronRight className="w-4 h-4 text-zinc-700" />
          <span className="text-white font-medium glow-text">Scrimmage Schedule</span>
          {hasEditPermission && (
            <span className="text-xs ml-2 bg-brand-primary/10 px-2 py-0.5 rounded text-brand-primary font-mono uppercase">Editor</span>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <Button variant="outline" className="glass-button h-9 px-4 text-xs font-medium border-white/5 hover:border-brand-primary/30 hover:bg-brand-primary/10 transition-all whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 mr-2" />
            Sync Calendar
          </Button>
          {hasEditPermission && <ScheduleScrimDialog />}
        </div>
      </div>

      {/* Upcoming Blocks */}
      <section>
        <h2 className="text-label text-zinc-500 mb-4 pl-1">Upcoming Blocks</h2>

        {isLoadingUpcoming ? (
          <div className="text-zinc-500">Loading upcoming scrims...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingScrims.filter(s => s.status !== 'Completed').map((scrim) => (
              <div key={scrim.id} className="glass-card p-5 rounded-2xl flex items-center justify-between group cursor-pointer hover:border-brand-primary/30 transition-all"
                onClick={() => navigate(`/scrims/${scrim.id}?opponent=${encodeURIComponent(scrim.opponent_name)}&date=${scrim.match_date}&format=${scrim.format || ''}&result=${scrim.result || ''}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center border border-white/10 font-bold text-lg text-white group-hover:text-brand-primary group-hover:border-brand-primary/30 transition-all">
                    {scrim.opponent_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{scrim.opponent_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] uppercase font-bold", scrim.status === 'Confirmed' ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-500")}>
                        {scrim.status}
                      </span>
                      <span>•</span>
                      <span>{scrim.format}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">{formatTime(scrim.scheduled_time)}</p>
                  <p className="text-xs text-zinc-500">{formatDate(scrim.match_date)}</p>
                </div>
              </div>
            ))}

            {hasEditPermission && (
              <ScheduleScrimDialog trigger={
                <div className="border border-dashed border-zinc-800 rounded-2xl p-5 flex items-center justify-center text-zinc-600 hover:text-brand-primary hover:bg-white/5 cursor-pointer transition-colors h-full min-h-[100px]">
                  <span className="flex items-center font-medium"><Plus className="w-4 h-4 mr-2" /> Schedule New Block</span>
                </div>
              } />
            )}
          </div>
        )}
      </section>

      {/* Match History */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-label text-zinc-500 pl-1">Match History</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <Input placeholder="Search team..." className="h-9 w-64 pl-9 bg-black/20 border-white/5 text-sm" />
            </div>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white"><Filter className="w-4 h-4" /></Button>
          </div>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Opponent</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Result</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Format</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoadingHistory ? (
                <tr><td colSpan={5} className="px-6 py-4 text-zinc-500">Loading history...</td></tr>
              ) : historyScrims.filter(s => s.match_date < today || s.status === 'Completed').length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-4 text-zinc-500">No match history found.</td></tr>
              ) : (
                historyScrims.filter(s => s.match_date < today || s.status === 'Completed').map((match) => (
                  <tr key={match.id} className="hover:bg-white/5 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/scrims/${match.id}?opponent=${encodeURIComponent(match.opponent_name)}&date=${match.match_date}&format=${match.format || ''}&result=${match.result || ''}`)}
                  >
                    <td className="px-6 py-4">
                      <span className="font-bold text-white group-hover:text-brand-primary transition-colors">{match.opponent_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex items-center px-2 py-1 rounded text-xs font-bold", match.result?.startsWith('W') ? "bg-green-500/10 text-green-400" : match.result?.startsWith('L') ? "bg-red-500/10 text-red-400" : "bg-zinc-500/10 text-zinc-400")}>
                        {match.result || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-sm">{match.format}</td>
                    <td className="px-6 py-4 text-zinc-400 text-sm">{formatDate(match.match_date)} <span className="text-zinc-600 ml-1 text-xs">{match.duration_minutes ? `${match.duration_minutes}m` : ""}</span></td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white h-8" onClick={(e) => e.stopPropagation()}>
                        <Video className="w-3.5 h-3.5 mr-2" /> VOD
                      </Button>
                      <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-brand-primary h-8" onClick={(e) => { e.stopPropagation(); navigate(`/scrims/${match.id}?opponent=${encodeURIComponent(match.opponent_name)}&date=${match.match_date}&format=${match.format || ''}&result=${match.result || ''}`); }}>
                        <Eye className="w-3.5 h-3.5 mr-2" /> View
                      </Button>
                      {hasEditPermission && (
                        <>
                          <EditScrimDialog scrim={match} trigger={<span hidden />} open={false} /> {/* Pre-load or conditional render? Better to use state for selected scrim */}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white h-8 w-8 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
                              <DropdownMenuItem onClick={() => setEditingScrim(match)} className="cursor-pointer hover:bg-white/5">
                                <Video className="w-4 h-4 mr-2" /> Edit / Log Result
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(match.id)} className="text-red-400 hover:text-red-300 hover:bg-white/5 cursor-pointer">
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                    </td>
                  </tr>
                )))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Edit Dialog Wrapper */}
      {editingScrim && (
        <EditScrimDialog
          scrim={editingScrim}
          open={!!editingScrim}
          onOpenChange={(open) => !open && setEditingScrim(null)}
        />
      )}

    </div>
  );
}
