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

interface ScheduleScrimDialogProps {
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function ScheduleScrimDialog({ trigger, open: controlledOpen, onOpenChange: setControlledOpen }: ScheduleScrimDialogProps) {
    const { createScrim, isCreating } = useScrimsData();
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = (val: boolean) => {
        if (setControlledOpen) setControlledOpen(val);
        setInternalOpen(val);
    };
    const [date, setDate] = useState<Date>();
    const [formData, setFormData] = useState({
        opponent_name: "",
        time: "19:00", // Default time
        format: "BO3",
    });

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

        createScrim(
            {
                opponent_name: formData.opponent_name,
                match_date: format(date, "yyyy-MM-dd"), // Store as YYYY-MM-DD
                scheduled_time: formData.time,
                format: formData.format,
                status: "Pending", // Default scheduled status
                result: null,
                notes: null
            },
            {
                onSuccess: () => {
                    setOpen(false);
                    setFormData({ opponent_name: "", time: "19:00", format: "BO3" });
                    setDate(undefined);
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="bg-brand-primary text-black hover:bg-brand-primary/80 shadow-[0_0_15px_rgba(45,212,191,0.3)]">
                        <Plus className="w-4 h-4 mr-2" /> Schedule Scrim
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#0A0A0B] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Schedule Scrimmage</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Set up a new scrim block against an opponent.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="opponent" className="text-zinc-300">Opponent Team</Label>
                        <Input
                            id="opponent"
                            value={formData.opponent_name}
                            onChange={(e) => setFormData({ ...formData, opponent_name: e.target.value })}
                            className="bg-black/20 border-white/10 text-white"
                            placeholder="e.g. G2 Academy"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-zinc-300">Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal bg-black/20 border-white/10 text-white hover:bg-white/5 hover:text-white",
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
                            <Label htmlFor="time" className="text-zinc-300">Time (CET)</Label>
                            <Input
                                id="time"
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="bg-black/20 border-white/10 text-white"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="format" className="text-zinc-300">Format</Label>
                            <Select
                                value={formData.format}
                                onValueChange={(value) => setFormData({ ...formData, format: value })}
                            >
                                <SelectTrigger className="bg-black/20 border-white/10 text-white">
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
                </form>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400 hover:text-white">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isCreating}
                        className="bg-brand-primary text-black hover:bg-brand-primary/80"
                    >
                        {isCreating ? "Scheduling..." : "Schedule Scrim"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
