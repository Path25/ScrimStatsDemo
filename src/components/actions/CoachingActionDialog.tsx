import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCoachingActions } from "@/hooks/useCoachingActions";
import { usePlayersData } from "@/hooks/usePlayersData";
import { useScrimsData } from "@/hooks/useScrimsData";

export function CoachingActionDialog({ scrimId, scrimGameId }: { scrimId?: string; scrimGameId?: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [assignee, setAssignee] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [followUpScrimId, setFollowUpScrimId] = useState("none");
  const { players } = usePlayersData();
  const { scrims } = useScrimsData();
  const { createAction, isSaving } = useCoachingActions();
  const upcoming = useMemo(() => scrims.filter((scrim) => new Date(scrim.starts_at || scrim.scheduled_time || scrim.match_date).getTime() > Date.now() && scrim.status !== "cancelled"), [scrims]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const player = players.find((item) => item.id === assignee);
    await createAction({
      title,
      description,
      priority,
      assigneePlayerId: player?.id,
      assigneeUserId: player?.linked_user_id || undefined,
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      scrimId,
      scrimGameId,
      followUpScrimId: followUpScrimId === "none" ? undefined : followUpScrimId,
    });
    setOpen(false);
    setTitle("");
    setDescription("");
    setAssignee("");
    setDueAt("");
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4" /> Assign action</Button></DialogTrigger>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader><DialogTitle>Assign coaching action</DialogTitle><DialogDescription>Turn review evidence into an owned follow-up for the next practice cycle.</DialogDescription></DialogHeader>
      <form className="grid gap-5" onSubmit={(event) => void submit(event)}>
        <div className="grid gap-2"><Label htmlFor="action-title">Action</Label><Input id="action-title" required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} /></div>
        <div className="grid gap-2"><Label htmlFor="action-description">Success evidence</Label><Textarea id="action-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What should change, and how will the team know it improved?" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2"><Label>Assignee</Label><Select value={assignee} onValueChange={setAssignee}><SelectTrigger><SelectValue placeholder="Select player" /></SelectTrigger><SelectContent>{players.filter((player) => player.is_active !== false && !player.archived_at).map((player) => <SelectItem key={player.id} value={player.id}>{player.summoner_name}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-2"><Label>Priority</Label><Select value={priority} onValueChange={(value) => setPriority(value as typeof priority)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select></div>
        </div>
        <div className="grid gap-2"><Label htmlFor="action-due">Due date</Label><Input id="action-due" type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></div>
        <div className="grid gap-2"><Label>Follow-up practice</Label><Select value={followUpScrimId} onValueChange={setFollowUpScrimId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Not linked yet</SelectItem>{upcoming.map((scrim) => <SelectItem key={scrim.id} value={scrim.id}>{scrim.opponent_name} · {new Date(scrim.starts_at || scrim.scheduled_time || scrim.match_date).toLocaleDateString()}</SelectItem>)}</SelectContent></Select></div>
        <DialogFooter><Button type="submit" disabled={isSaving || !title.trim() || !assignee}>{isSaving ? "Assigning…" : "Assign action"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
