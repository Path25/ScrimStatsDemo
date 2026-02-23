import { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  MoreHorizontal,
  Video,
  Swords,
  Users,
  CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AvailabilityCalendar from "@/components/calendar/AvailabilityCalendar";
import AvailabilityInput from "@/components/calendar/AvailabilityInput";
import { useCalendarEvents, CalendarEvent } from "@/hooks/useCalendarEvents";
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isToday,
  parseISO,
  isAfter,
  isBefore
} from "date-fns";

export default function Calendar() {
  const { events, isLoading } = useCalendarEvents();
  const [view, setView] = useState<'week' | 'month'>('month');
  const [calendarMode, setCalendarMode] = useState<'events' | 'availability'>('events');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAvailabilityInput, setShowAvailabilityInput] = useState(false);

  const handleTodayClick = () => {
    setCurrentDate(new Date());
  };

  const navigatePrevious = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const currentDateDisplay = view === 'month'
    ? format(currentDate, "MMMM yyyy")
    : `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d")} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d, yyyy")}`;

  const getEventsForDay = (date: Date) => {
    return events.filter(event => isSameDay(parseISO(event.start_time), date));
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return (
      <div className="glass-panel rounded-2xl overflow-hidden h-[700px] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-7 border-b border-white/5 bg-white/5 backdrop-blur-sm">
          {weekDays.map(day => (
            <div key={day} className="py-4 text-center text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 flex-1 bg-black/20">
          {days.map((day, i) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = day.getMonth() === monthStart.getMonth();

            return (
              <div key={day.toISOString()} className={cn(
                "border-b border-r border-white/5 p-3 relative hover:bg-white/[0.03] transition-all group",
                isToday(day) && "bg-brand-primary/5",
                !isCurrentMonth && "opacity-20 grayscale bg-black/40"
              )}>
                <div className="flex justify-between items-start">
                  <span className={cn(
                    "text-xs font-bold w-7 h-7 flex items-center justify-center rounded-lg transition-all",
                    isToday(day)
                      ? "bg-brand-primary text-black shadow-[0_0_15px_rgba(45,212,191,0.4)]"
                      : "text-zinc-500 group-hover:text-zinc-300"
                  )}>
                    {format(day, "d")}
                  </span>
                </div>

                {/* Event Bars for Month View */}
                <div className="mt-1.5 space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={cn(
                        "flex items-center rounded-[4px] px-1.5 py-[2px] text-[10px] font-semibold leading-tight truncate cursor-default transition-all hover:brightness-125",
                        event.event_type === 'scrim'
                          ? "bg-brand-primary/15 text-brand-primary border-l-2 border-brand-primary"
                          : event.event_type === 'official'
                            ? "bg-red-500/15 text-red-400 border-l-2 border-red-500"
                            : "bg-purple-500/15 text-purple-400 border-l-2 border-purple-500"
                      )}
                      title={event.title}
                    >
                      <span className="truncate">{event.title}</span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && <span className="text-[10px] text-zinc-600 font-bold pl-1">+{dayEvents.length - 3} more</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

    return (
      <div className="glass-panel rounded-2xl overflow-hidden min-h-[700px] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-7 flex-1 divide-x divide-white/5">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(day);

            return (
              <div key={day.toISOString()} className="flex flex-col">
                {/* Column Header */}
                <div className={cn(
                  "p-5 border-b border-white/5 text-center transition-all",
                  isToday(day) ? "bg-brand-primary/10" : "bg-white/[0.02]"
                )}>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">{format(day, "EEE")}</span>
                  <span className={cn(
                    "text-2xl font-black transition-all",
                    isToday(day) ? "text-brand-primary glow-text scale-110 block" : "text-white"
                  )}>
                    {format(day, "d")}
                  </span>
                </div>

                {/* Events Column */}
                <div className="flex-1 p-3 space-y-3 bg-black/20 hover:bg-black/30 transition-colors relative">
                  {/* Current Day Highlight Overlay */}
                  {isToday(day) && <div className="absolute inset-0 bg-brand-primary/[0.03] pointer-events-none" />}

                  {dayEvents.map(event => (
                    <div key={event.id} className={cn(
                      "p-3 rounded-xl border text-sm flex flex-col gap-1.5 cursor-pointer hover:scale-[1.02] hover:brightness-110 active:scale-95 transition-all group relative z-10",
                      event.event_type === 'scrim' ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary" :
                        event.event_type === 'official' ? "bg-red-500/10 border-red-500/30 text-red-400" :
                          "bg-zinc-900/60 border-white/10 text-zinc-300"
                    )}>
                      <span className="font-bold flex items-center justify-between">
                        {event.title}
                        {event.event_type === 'scrim' && <Swords className="w-3.5 h-3.5 opacity-50" />}
                      </span>
                      <span className="text-[10px] uppercase font-black tracking-widest opacity-70 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> {format(parseISO(event.start_time), "HH:mm")}
                      </span>
                    </div>
                  ))}

                  {dayEvents.length === 0 && (
                    <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="text-zinc-600 hover:text-white glass-button border-transparent hover:border-white/10">
                        <Plus className="w-4 h-4 mr-2" /> Quick Add
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  };

  return (
    <div className="space-y-6 max-w-[1920px] mx-auto pb-10">

      {/* Compact Header & Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl sticky top-24 z-20">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground pl-2">
          <span className="text-zinc-500">ScrimStats</span>
          <ChevronRight className="w-4 h-4 text-zinc-700" />
          <span className="text-white font-medium glow-text">Calendar</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/5 no-scrollbar">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs font-bold text-zinc-400 hover:text-white"
              onClick={handleTodayClick}
            >
              Today
            </Button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={navigatePrevious}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-black text-white px-2 min-w-[140px] text-center uppercase tracking-tighter">
              {currentDateDisplay}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={navigateNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
            {[
              { id: 'events', label: 'Events', icon: CalendarIcon },
              { id: 'availability', label: 'Team', icon: CalendarDays }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setCalendarMode(mode.id as any)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                  calendarMode === mode.id
                    ? "bg-brand-primary/20 text-brand-primary glow-border"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <mode.icon className="w-3.5 h-3.5" />
                {mode.label}
              </button>
            ))}
          </div>

          {calendarMode === 'events' && (
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
              {['Week', 'Month'].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v.toLowerCase() as any)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                    view === v.toLowerCase()
                      ? "bg-brand-primary/20 text-brand-primary glow-border"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          )}

          <Button
            size="sm"
            className="h-9 px-4 bg-brand-primary text-black hover:bg-brand-primary/90 font-bold shadow-[0_0_20px_rgba(45,212,191,0.2)]"
            onClick={() => calendarMode === 'events' ? undefined : setShowAvailabilityInput(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            {calendarMode === 'events' ? 'Add Event' : 'Add Availability'}
          </Button>
        </div>
      </div>

      {/* Main View Area */}
      {calendarMode === 'events' ? (
        <>
          {view === 'week' && renderWeekView()}
          {view === 'month' && renderMonthView()}
        </>
      ) : (
        <AvailabilityCalendar weekDays={
          eachDayOfInterval({
            start: startOfWeek(currentDate, { weekStartsOn: 1 }),
            end: endOfWeek(currentDate, { weekStartsOn: 1 })
          }).map(date => ({
            day: format(date, "EEE"),
            date: date.getDate(),
            fullDate: date
          }))
        } />
      )
      }

      {/* Upcoming Events Bottom Section */}
      {
        calendarMode === 'events' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest pl-1">Upcoming This Week</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {events
                .filter(event => {
                  const eventDate = parseISO(event.start_time);
                  const today = new Date();
                  const nextWeek = addDays(today, 7);
                  return isAfter(eventDate, today) && isBefore(eventDate, nextWeek);
                })
                .slice(0, 4)
                .map((event) => (
                  <div key={event.id} className="glass-card p-4 rounded-xl border border-white/5 hover:border-brand-primary/30 transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider",
                        event.event_type === 'scrim' ? "text-teal-400 bg-teal-500/10 border-teal-500/20" :
                          "text-zinc-400 bg-zinc-500/10 border-zinc-500/20"
                      )}>
                        {event.event_type}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">{format(parseISO(event.start_time), "MMM d")}</span>
                    </div>
                    <h4 className="font-bold text-zinc-200 group-hover:text-white transition-colors">{event.title}</h4>
                    <p className="text-xs text-zinc-500 mt-1">{format(parseISO(event.start_time), "HH:mm")}</p>
                  </div>
                ))}
            </div>
          </div>
        )
      }

      {/* Availability Input Modal */}
      {
        showAvailabilityInput && (
          <AvailabilityInput
            onClose={() => setShowAvailabilityInput(false)}
            onSave={(data) => {
              console.log('Availability saved:', data);
              // In a real app, this would save to the database
            }}
          />
        )
      }

    </div >
  );
}


