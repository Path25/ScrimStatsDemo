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
import { usePlayersData } from "@/hooks/usePlayersData";
import { Plus, UserPlus } from "lucide-react";
import { CHAMPION_ROLES } from "@/lib/constants";
import { toast } from "sonner";

interface AddPlayerDialogProps {
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function AddPlayerDialog({ trigger }: AddPlayerDialogProps) {
    const { createPlayer, isCreating } = usePlayersData();
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        summoner_name: "",
        role: "",
        real_name: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.summoner_name) {
            toast.error("Summoner Name is required");
            return;
        }

        createPlayer(
            {
                summoner_name: formData.summoner_name,
                role: formData.role || null,
                // Default values
                is_active: true,
                rank: "Unranked",
                lp: 0,
                region: "EUW", // Default, could be a setting
            },
            {
                onSuccess: () => {
                    setOpen(false);
                    setFormData({ summoner_name: "", role: "", real_name: "" });
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="bg-brand-primary text-black hover:bg-brand-primary/80 shadow-[0_0_15px_rgba(45,212,191,0.3)]">
                        <UserPlus className="w-4 h-4 mr-2" /> Add Player
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#0A0A0B] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Add New Player</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Add a player to your active roster. We'll automatically fetch their stats.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="ign" className="text-zinc-300">Summoner Name (IGN)</Label>
                        <Input
                            id="ign"
                            value={formData.summoner_name}
                            onChange={(e) => setFormData({ ...formData, summoner_name: e.target.value })}
                            className="bg-black/20 border-white/10 text-white"
                            placeholder="e.g. BrokenBlade"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="role" className="text-zinc-300">Role</Label>
                        <Select
                            value={formData.role}
                            onValueChange={(value) => setFormData({ ...formData, role: value })}
                        >
                            <SelectTrigger className="bg-black/20 border-white/10 text-white">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                {Object.values(CHAMPION_ROLES).map((role) => (
                                    <SelectItem key={role} value={role} className="capitalize hover:bg-white/10 cursor-pointer">
                                        {role}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                        {isCreating ? "Adding..." : "Add Player"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
