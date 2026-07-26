import { useState, type FormEvent, type ReactNode } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import type { Scrim } from "@/hooks/useOptimizedScrimsData";
import { useScrimsData } from "@/hooks/useScrimsData";

interface EditScrimDialogProps {
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  scrim: Scrim;
  trigger?: ReactNode;
}

export function EditScrimDialog({
  onOpenChange,
  open: controlledOpen,
  scrim,
  trigger,
}: EditScrimDialogProps) {
  const { isUpdating, updateScrim } = useScrimsData();
  const [internalOpen, setInternalOpen] = useState(false);
  const [opponent, setOpponent] = useState(scrim.opponent_name);
  const [notes, setNotes] = useState(scrim.notes || "");
  const [status, setStatus] = useState(scrim.status || "scheduled");
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateScrim(
      {
        id: scrim.id,
        opponent_name: opponent.trim(),
        notes: notes.trim() || null,
        status,
      },
      { onSuccess: () => setOpen(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit practice block</DialogTitle>
          <DialogDescription>
            Update confirmed block details. Final scores are completed from the review workflow.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="scrim-status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="scrim-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="scrim-opponent">Opponent</Label>
            <Input
              id="scrim-opponent"
              required
              value={opponent}
              onChange={(event) => setOpponent(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="scrim-notes">Block focus and notes</Label>
            <Textarea
              id="scrim-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-28"
              placeholder="Objectives, constraints, or preparation focus."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isUpdating || !opponent.trim()}>
              {isUpdating ? "Saving…" : "Save block"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
