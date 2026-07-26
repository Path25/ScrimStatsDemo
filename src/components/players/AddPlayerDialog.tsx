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
import { UserPlus } from "lucide-react";
import { CHAMPION_ROLES } from "@/lib/constants";
import {
    normalizeChampionPool,
    normalizeOptionalText,
    normalizeRequiredName,
} from "@/lib/roster-profile";
import { toast } from "sonner";

interface AddPlayerDialogProps {
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function AddPlayerDialog({ trigger, open: controlledOpen, onOpenChange }: AddPlayerDialogProps) {
    const { createPlayer, isCreating } = usePlayersData();
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen ?? internalOpen;
    const setOpen = (nextOpen: boolean) => {
        if (controlledOpen === undefined) setInternalOpen(nextOpen);
        onOpenChange?.(nextOpen);
    };
    const [formData, setFormData] = useState({
        summoner_name: "",
        role: "",
        riot_id: "",
        riot_tag_line: "",
        region: "",
        champions: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const summonerName = normalizeRequiredName(formData.summoner_name);
        if (!summonerName) {
            toast.error("Player name is required");
            return;
        }

        createPlayer(
            {
                summoner_name: summonerName,
                role: normalizeOptionalText(formData.role) || null,
                is_active: true,
                riot_id: normalizeOptionalText(formData.riot_id) || null,
                riot_tag_line: normalizeOptionalText(formData.riot_tag_line) || null,
                region: normalizeOptionalText(formData.region)?.toUpperCase() || null,
                main_champions: normalizeChampionPool(formData.champions),
            },
            {
                onSuccess: () => {
                    setOpen(false);
                    setFormData({
                        summoner_name: "",
                        role: "",
                        riot_id: "",
                        riot_tag_line: "",
                        region: "",
                        champions: "",
                    });
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <UserPlus className="w-4 h-4 mr-2" /> Add Player
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Player</DialogTitle>
                    <DialogDescription>
                        Create the roster profile used for scheduling, reviews, and recorded results.
                    </DialogDescription>
                </DialogHeader>
                <form id="add-roster-player-form" onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="ign">Summoner name</Label>
                        <Input
                            id="ign"
                            value={formData.summoner_name}
                            onChange={(e) => setFormData({ ...formData, summoner_name: e.target.value })}
                            className="border-white/10 bg-white/[0.035]"
                            placeholder="e.g. BrokenBlade"
                            maxLength={80}
                            autoFocus
                        />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
                        <div className="grid gap-2">
                            <Label htmlFor="riot-id">Riot ID</Label>
                            <Input
                                id="riot-id"
                                value={formData.riot_id}
                                onChange={(e) => setFormData({ ...formData, riot_id: e.target.value })}
                                className="border-white/10 bg-white/[0.035]"
                                placeholder="Game name"
                                maxLength={80}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="tag-line">Tagline</Label>
                            <Input
                                id="tag-line"
                                value={formData.riot_tag_line}
                                onChange={(e) => setFormData({ ...formData, riot_tag_line: e.target.value })}
                                className="border-white/10 bg-white/[0.035]"
                                placeholder="EUW"
                                maxLength={12}
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="region">Server</Label>
                        <Select
                            value={formData.region}
                            onValueChange={(value) => setFormData({ ...formData, region: value })}
                        >
                            <SelectTrigger id="region" className="border-white/10 bg-white/[0.035]">
                                <SelectValue placeholder="Select server" />
                            </SelectTrigger>
                            <SelectContent className="border-white/10 bg-zinc-900 text-white">
                                {["EUW", "EUNE", "NA", "KR", "BR", "LAN", "LAS", "OCE", "TR", "RU", "JP"].map((region) => (
                                    <SelectItem key={region} value={region}>{region}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                            value={formData.role}
                            onValueChange={(value) => setFormData({ ...formData, role: value })}
                        >
                            <SelectTrigger id="role" className="border-white/10 bg-white/[0.035]">
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
                    <div className="grid gap-2">
                        <Label htmlFor="champions">Champion pool</Label>
                        <Input
                            id="champions"
                            value={formData.champions}
                            onChange={(e) => setFormData({ ...formData, champions: e.target.value })}
                            className="border-white/10 bg-white/[0.035]"
                            placeholder="Renekton, K'Sante, Gnar"
                            maxLength={240}
                        />
                        <p className="text-xs text-muted-foreground">
                            Optional, comma-separated. No rank or server is inferred.
                        </p>
                    </div>
                </form>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isCreating}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="add-roster-player-form"
                        disabled={isCreating || !formData.summoner_name.trim()}
                    >
                        {isCreating ? "Adding..." : "Add Player"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
