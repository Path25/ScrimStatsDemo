import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, Link2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { useTenant } from "@/contexts/TenantContext";
import { usePlayersData } from "@/hooks/usePlayersData";
import { supabase } from "@/integrations/supabase/client";
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

type InviteRole = "admin" | "member" | "viewer";

export function InviteTeamMemberDialog() {
  const { tenant } = useTenant();
  const { players } = usePlayersData();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("member");
  const [playerId, setPlayerId] = useState("staff-only");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function createInvitation(event: React.FormEvent) {
    event.preventDefault();
    if (!tenant) return;

    setIsSubmitting(true);
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } =
      playerId === "staff-only"
        ? await supabase.rpc("create_team_invitation", {
            p_tenant_id: tenant.id,
            p_email: normalizedEmail,
            p_role: role,
          })
        : await supabase.rpc("create_roster_invitation", {
            p_tenant_id: tenant.id,
            p_player_id: playerId,
            p_email: normalizedEmail,
            p_role: role,
          });
    setIsSubmitting(false);

    const invitation = data?.[0];
    if (error || !invitation?.token) {
      toast.error(error?.message || "The invitation could not be created.");
      return;
    }

    setInviteUrl(`${window.location.origin}/sign-in?invite=${encodeURIComponent(invitation.token)}`);
    void queryClient.invalidateQueries({ queryKey: ["players", tenant.id] });
    void queryClient.invalidateQueries({ queryKey: ["workspace-administration", tenant.id] });
    toast.success("Secure invitation link created.");
  }

  async function copyInvitation() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    toast.success("Invitation link copied.");
  }

  function reset() {
    setEmail("");
    setRole("member");
    setPlayerId("staff-only");
    setInviteUrl(null);
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm"><UserPlus className="mr-2 h-4 w-4" />Invite team member</Button>
      </DialogTrigger>
      <DialogContent className="border-border bg-surface text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to {tenant?.name}</DialogTitle>
          <DialogDescription>
            Invitations are restricted to this team and expire after seven days.
          </DialogDescription>
        </DialogHeader>
        {inviteUrl ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Send this secure link to {email}. It can be accepted only after signing in with that email address.</p>
            <Input value={inviteUrl} readOnly className="bg-background font-mono text-xs" />
            <Button type="button" onClick={() => void copyInvitation()} className="w-full"><Copy className="mr-2 h-4 w-4" />Copy invitation link</Button>
          </div>
        ) : (
          <form onSubmit={(event) => void createInvitation(event)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input id="invite-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="analyst@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-roster-profile">Roster profile</Label>
              <Select value={playerId} onValueChange={setPlayerId}>
                <SelectTrigger id="invite-roster-profile">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff-only">Staff access without a player profile</SelectItem>
                  {players
                    .filter((player) => !player.linked_user_id && player.membership_state !== "linked")
                    .map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.summoner_name}
                        {player.riot_id
                          ? ` · ${player.riot_id}${player.riot_tag_line ? `#${player.riot_tag_line}` : ""}`
                          : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs leading-5 text-muted-foreground">
                Linking a player keeps roster, membership and captured identity history together.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Access level</Label>
              <Select value={role} onValueChange={(value) => setRole(value as InviteRole)}>
                <SelectTrigger id="invite-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Manager — manage roster, scrims and access</SelectItem>
                  <SelectItem value="member">Member — contribute to the workspace</SelectItem>
                  <SelectItem value="viewer">Viewer — read operational data</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting || !email}><Link2 className="mr-2 h-4 w-4" />{isSubmitting ? "Creating…" : "Create secure link"}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
