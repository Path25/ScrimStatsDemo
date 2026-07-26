import { format } from "date-fns";
import { Calendar, Clock, Loader2, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { useAvailability } from "@/hooks/useAvailability";
import { usePlayersData } from "@/hooks/usePlayersData";
import { cn } from "@/lib/utils";

interface AvailabilityInputProps {
  initialDate: Date;
  onClose: () => void;
}

export default function AvailabilityInput({ initialDate, onClose }: AvailabilityInputProps) {
  const { saveAvailability } = useAvailability();
  const { players, isLoading: playersLoading, error: playersError, refetch } = usePlayersData();
  const { user } = useAuth();
  const { activeRole, isManager } = useRole();
  const [isSaving, setIsSaving] = useState(false);
  const eligiblePlayers = useMemo(
    () =>
      isManager
        ? players
        : activeRole === "member"
          ? players.filter((player) => player.linked_user_id === user?.id)
          : [],
    [activeRole, isManager, players, user?.id],
  );
  const [formData, setFormData] = useState({
    playerId: "",
    date: format(initialDate, "yyyy-MM-dd"),
    startTime: "18:00",
    endTime: "21:00",
    isAvailable: true,
    notes: "",
  });

  useEffect(() => {
    if (eligiblePlayers.length === 1 && !formData.playerId) {
      setFormData((current) => ({ ...current, playerId: eligiblePlayers[0].id }));
    }
  }, [eligiblePlayers, formData.playerId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!formData.playerId) return toast.error("Please select a player");
    if (!formData.date) return toast.error("Please select a date");
    if (formData.endTime <= formData.startTime) {
      return toast.error("End time must be after the start time");
    }

    setIsSaving(true);
    try {
      await saveAvailability({
        playerId: formData.playerId,
        startTime: new Date(`${formData.date}T${formData.startTime}:00`),
        endTime: new Date(`${formData.date}T${formData.endTime}:00`),
        isAvailable: formData.isAvailable,
        notes: formData.notes,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSaving) onClose();
      }}
    >
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add availability</DialogTitle>
          <DialogDescription>
            Record a confirmed window for practice planning. Times use your local timezone.
          </DialogDescription>
        </DialogHeader>

        <form id="availability-form" onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="availability-player">Player</Label>
            <Select
              value={formData.playerId}
              onValueChange={(playerId) => setFormData({ ...formData, playerId })}
              disabled={playersLoading || Boolean(playersError) || eligiblePlayers.length === 0}
              required
            >
              <SelectTrigger id="availability-player">
                <SelectValue placeholder={playersLoading ? "Loading roster…" : "Select a player"} />
              </SelectTrigger>
              <SelectContent>
                {eligiblePlayers.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.summoner_name || "Unnamed player"} · {player.role || "Role not set"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {playersError ? (
              <div className="flex items-center justify-between gap-3 text-sm text-destructive">
                <span>The roster could not be loaded.</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => void refetch()}>
                  Try again
                </Button>
              </div>
            ) : eligiblePlayers.length === 0 && !playersLoading ? (
              <p className="text-sm text-[var(--workspace-muted)]">
                {activeRole === "member"
                  ? "Your workspace account is not linked to an active roster profile."
                  : "Add an active roster profile before recording availability."}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="availability-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[var(--workspace-accent)]" aria-hidden="true" />
              Date
            </Label>
            <Input
              id="availability-date"
              type="date"
              value={formData.date}
              onChange={(event) => setFormData({ ...formData, date: event.target.value })}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="availability-start" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[var(--workspace-accent)]" aria-hidden="true" />
                Start
              </Label>
              <Input
                id="availability-start"
                type="time"
                value={formData.startTime}
                onChange={(event) => setFormData({ ...formData, startTime: event.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="availability-end">End</Label>
              <Input
                id="availability-end"
                type="time"
                value={formData.endTime}
                onChange={(event) => setFormData({ ...formData, endTime: event.target.value })}
                required
              />
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Status</legend>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: true, label: "Available" },
                { value: false, label: "Unavailable" },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  aria-pressed={formData.isAvailable === option.value}
                  onClick={() => setFormData({ ...formData, isAvailable: option.value })}
                  className={cn(
                    "min-h-11 border px-3 text-sm font-medium transition-colors",
                    formData.isAvailable === option.value
                      ? "border-[var(--workspace-accent)] bg-[color:rgba(17,226,208,.1)] text-[var(--workspace-foreground)]"
                      : "border-[var(--workspace-rule)] text-[var(--workspace-muted)] hover:border-[var(--workspace-rule-strong)] hover:text-[var(--workspace-foreground)]",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-2">
            <Label htmlFor="availability-notes">
              Notes <span className="font-normal text-[var(--workspace-subtle)]">(optional)</span>
            </Label>
            <Textarea
              id="availability-notes"
              value={formData.notes}
              onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
              rows={3}
              maxLength={500}
              placeholder="Travel, class, work, or another confirmed constraint."
            />
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="availability-form"
            disabled={isSaving || !formData.playerId || !formData.date}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {isSaving ? "Saving…" : "Save availability"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
