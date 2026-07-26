import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useScrimsData } from "@/hooks/useScrimsData";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { useOpponentTeams } from "@/hooks/useOpponentTeams";
import { useTenant } from "@/contexts/TenantContext";

interface ScheduleScrimDialogProps {
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function ScheduleScrimDialog({ trigger, open: controlledOpen, onOpenChange: setControlledOpen }: ScheduleScrimDialogProps) {
    const { scheduleScrim, isCreating } = useScrimsData();
    const { data: opponentTeams } = useOpponentTeams();
    const { tenant } = useTenant();
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = (val: boolean) => {
        if (setControlledOpen) setControlledOpen(val);
        setInternalOpen(val);
    };
    const [date, setDate] = useState<Date>();
    const [formData, setFormData] = useState({
        opponent_name: "",
        opponent_team_id: "",
        time: "19:00", // Default time
        format: "BO3",
        duration_minutes: 180,
        notes: "",
    });
    const timezone =
        (typeof tenant?.settings?.timezone === "string" && tenant.settings.timezone)
        || Intl.DateTimeFormat().resolvedOptions().timeZone
        || "UTC";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.opponent_name) {
            toast.error("Opponent name is required");
            return;
        }
        if (!date) {
            toast.error("Date is required");
            return;
        }

        const startsAt = fromZonedTime(
            `${format(date, "yyyy-MM-dd")}T${formData.time}:00`,
            timezone,
        ).toISOString();

        scheduleScrim(
            {
                opponent_name: formData.opponent_name,
                opponent_team_id: formData.opponent_team_id || null,
                starts_at: startsAt,
                timezone,
                duration_minutes: formData.duration_minutes,
                format: formData.format,
                notes: formData.notes || null,
            },
            {
                onSuccess: () => {
                    setOpen(false);
                    setFormData({
                        opponent_name: "",
                        opponent_team_id: "",
                        time: "19:00",
                        format: "BO3",
                        duration_minutes: 180,
                        notes: "",
                    });
                    setDate(undefined);
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="w-4 h-4 mr-2" /> Schedule Scrim
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Schedule Scrimmage</DialogTitle>
                    <DialogDescription>
                        Set up a new scrim block against an opponent.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {opponentTeams.length > 0 && (
                        <div className="grid gap-2">
                            <Label htmlFor="opponent-record">Private opponent record</Label>
                            <Select
                                value={formData.opponent_team_id || "manual"}
                                onValueChange={(value) => {
                                    const team = opponentTeams.find((item) => item.id === value);
                                    setFormData({
                                        ...formData,
                                        opponent_team_id: value === "manual" ? "" : value,
                                        opponent_name: team?.name || formData.opponent_name,
                                    });
                                }}
                            >
                                <SelectTrigger id="opponent-record" className="border-white/10 bg-white/[0.035]">
                                    <SelectValue placeholder="Choose a saved opponent" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                    <SelectItem value="manual">Manual name only</SelectItem>
                                    {opponentTeams.map((team) => (
                                        <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor="opponent">Opponent team</Label>
                        <Input
                            id="opponent"
                            value={formData.opponent_name}
                            onChange={(e) => setFormData({ ...formData, opponent_name: e.target.value })}
                            className="border-white/10 bg-white/[0.035]"
                            placeholder="e.g. G2 Academy"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start border-white/10 bg-white/[0.035] text-left font-normal text-white hover:bg-white/[0.06] hover:text-white",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-zinc-900 border-white/10 text-white" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                    className="bg-zinc-900 text-white"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="time">Local time</Label>
                            <Input
                                id="time"
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="border-white/10 bg-white/[0.035]"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="format">Format</Label>
                            <Select
                                value={formData.format}
                                onValueChange={(value) => {
                                    const durations: Record<string, number> = {
                                        BO1: 60,
                                        BO3: 180,
                                        BO5: 300,
                                        BLOCK_3: 180,
                                        BLOCK_5: 300,
                                    };
                                    setFormData({
                                        ...formData,
                                        format: value,
                                        duration_minutes: durations[value] || 180,
                                    });
                                }}
                            >
                                <SelectTrigger className="border-white/10 bg-white/[0.035]">
                                    <SelectValue placeholder="Format" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                    <SelectItem value="BO1">BO1</SelectItem>
                                    <SelectItem value="BO3">BO3</SelectItem>
                                    <SelectItem value="BO5">BO5</SelectItem>
                                    <SelectItem value="BLOCK_3">3 Game Block</SelectItem>
                                    <SelectItem value="BLOCK_5">5 Game Block</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="scrim-notes">Block notes</Label>
                        <Input
                            id="scrim-notes"
                            value={formData.notes}
                            onChange={(event) =>
                                setFormData({ ...formData, notes: event.target.value })
                            }
                            placeholder="Focus, contact, or lobby context"
                        />
                        <p className="text-xs text-muted-foreground">
                            Scheduled in {timezone}.
                        </p>
                    </div>
                </form>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isCreating}
                    >
                        {isCreating ? "Scheduling..." : "Schedule Scrim"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
