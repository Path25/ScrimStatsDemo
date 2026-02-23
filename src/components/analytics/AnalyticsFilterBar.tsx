import { Button } from "@/components/ui/button";
import { Download, Filter, Calendar as CalendarIcon, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";

interface AnalyticsFilterBarProps {
    timeRange: 'week' | 'month' | 'season';
    onTimeRangeChange: (range: 'week' | 'month' | 'season') => void;
    matchType: 'all' | 'scrim' | 'official';
    onMatchTypeChange: (type: 'all' | 'scrim' | 'official') => void;
}

export function AnalyticsFilterBar({
    timeRange,
    onTimeRangeChange,
    matchType,
    onMatchTypeChange
}: AnalyticsFilterBarProps) {
    return (
        <div className="flex items-center gap-4 w-full">

            <div className="flex items-center gap-1 glass-panel p-1 rounded-xl shrink-0">
                {/* Time Range Toggle */}
                {['Week', 'Month', 'Season'].map((range) => (
                    <button
                        key={range}
                        onClick={() => onTimeRangeChange(range.toLowerCase() as any)}
                        className={cn(
                            "px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap",
                            timeRange === range.toLowerCase()
                                ? "bg-brand-primary/20 text-brand-primary shadow-[0_0_10px_rgba(45,212,191,0.1)] glow-border"
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                        )}
                    >
                        {range}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-3 shrink-0">
                {/* Match Type Filter */}
                <div className="flex items-center gap-1 glass-panel p-1 rounded-xl">
                    <button
                        onClick={() => onMatchTypeChange('all')}
                        className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap", matchType === 'all' ? "bg-brand-primary/20 text-brand-primary glow-border" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5")}
                    >
                        All
                    </button>
                    <button
                        onClick={() => onMatchTypeChange('scrim')}
                        className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition-all whitespace-nowrap", matchType === 'scrim' ? "bg-brand-primary/20 text-brand-primary glow-border" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5")}
                    >
                        <Swords className="w-3.5 h-3.5" /> Scrims
                    </button>
                    <button
                        onClick={() => onMatchTypeChange('official')}
                        className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition-all whitespace-nowrap", matchType === 'official' ? "bg-brand-primary/20 text-brand-primary glow-border" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5")}
                    >
                        <TrophyIcon className="w-3.5 h-3.5" /> Official
                    </button>
                </div>

                {/* Opponent Filter (Stub) */}
                <Button variant="outline" className="h-9 border-dashed border-white/20 text-zinc-500 hover:text-white glass-button text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                    <Filter className="w-3.5 h-3.5 mr-2" />
                    Filter
                </Button>

                {/* Export */}
                <Button variant="outline" className="h-9 glass-button border-brand-primary/20 text-brand-primary hover:bg-brand-primary/10 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                    <Download className="w-3.5 h-3.5 mr-2" />
                    Export
                </Button>
            </div>
        </div>
    );
}

// Icon helper
function TrophyIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 0 0 5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
    )
}
