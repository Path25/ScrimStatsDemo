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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useScrimsData } from "@/hooks/useScrimsData";
import { toast } from "sonner";
import { Scrim } from "@/hooks/useOptimizedScrimsData";
import { Pencil } from "lucide-react";

interface EditScrimDialogProps {
    scrim: Scrim;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function EditScrimDialog({ scrim, trigger, open: controlledOpen, onOpenChange }: EditScrimDialogProps) {
    const { updateScrim, isUpdating } = useScrimsData();
    const [internalOpen, setInternalOpen] = useState(false);

    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setIsOpen = onOpenChange || setInternalOpen;

    const [formData, setFormData] = useState({
        opponent_name: scrim.opponent_name,
        result: scrim.result || "",
        notes: scrim.notes || "",
        status: scrim.status,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        updateScrim(
            {
                id: scrim.id,
                opponent_name: formData.opponent_name,
                result: formData.result || null,
                notes: formData.notes || null,
                status: formData.status
            },
            {
                onSuccess: () => {
                    setIsOpen(false);
                    // Toast handled by hook
                },
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#0A0A0B] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Edit Scrim Details</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Update result, notes, or status.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="status" className="text-zinc-300">Status</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(value) => setFormData({ ...formData, status: value })}
                        >
                            <SelectTrigger className="bg-black/20 border-white/10 text-white">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Confirmed">Confirmed</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="opponent" className="text-zinc-300">Opponent</Label>
                        <Input
                            id="opponent"
                            value={formData.opponent_name}
                            onChange={(e) => setFormData({ ...formData, opponent_name: e.target.value })}
                            className="bg-black/20 border-white/10 text-white"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="result" className="text-zinc-300">Result (e.g. W 2-1)</Label>
                        <Input
                            id="result"
                            value={formData.result}
                            onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                            className="bg-black/20 border-white/10 text-white"
                            placeholder="W 3-0, L 1-2..."
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="notes" className="text-zinc-300">Notes / VOD Link</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="bg-black/20 border-white/10 text-white min-h-[100px]"
                            placeholder="VOD: https://...&#10;Key takeaways: ..."
                        />
                    </div>
                </form>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isUpdating}
                        className="bg-brand-primary text-black hover:bg-brand-primary/80"
                    >
                        {isUpdating ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
