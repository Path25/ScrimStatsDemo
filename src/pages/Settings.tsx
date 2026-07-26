import { useEffect, useState } from "react";
import { Copy, Database, KeyRound, RefreshCw, ShieldCheck, Trash2, UserRound, Users } from "lucide-react";
import { toast } from "sonner";

import { DesktopCollectorIntegration } from "@/components/integrations/DesktopCollectorIntegration";
import { DesktopAppStatus } from "@/components/scrims/DesktopAppStatus";
import { InviteTeamMemberDialog } from "@/components/team/InviteTeamMemberDialog";
import { NotificationPreferencesPanel } from "@/components/notifications/NotificationPreferencesPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataSurface } from "@/components/workspace/DataSurface";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { useTenant } from "@/contexts/TenantContext";
import { usePlayersData } from "@/hooks/usePlayersData";
import { useWorkspaceAdministration } from "@/hooks/useWorkspaceAdministration";
import type { Database as SupabaseDatabase } from "@/integrations/supabase/types";

type TenantRole = SupabaseDatabase["public"]["Enums"]["tenant_role"];
const commonTimezones = ["UTC", "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Warsaw", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Asia/Seoul", "Asia/Tokyo", "Australia/Sydney"];

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-[var(--workspace-rule)] py-4 last:border-b-0 sm:grid-cols-[10rem_1fr] sm:items-center">
      <dt className="workspace-eyebrow text-[var(--workspace-subtle)]">{label}</dt>
      <dd className="text-sm text-[var(--workspace-foreground)]">{value}</dd>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { activeRole, isManager } = useRole();
  const administration = useWorkspaceAdministration();
  const { players } = usePlayersData();
  const displayName =
    user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Team member";
  const [timezone, setTimezone] = useState(
    (tenant?.settings.timezone as string) ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      "UTC",
  );
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (typeof tenant?.settings.timezone === "string") setTimezone(tenant.settings.timezone);
  }, [tenant?.settings.timezone]);

  async function copyInvitation(token: string) {
    await navigator.clipboard.writeText(
      `${window.location.origin}/accept-invite?token=${encodeURIComponent(token)}`,
    );
    toast.success("Invitation link copied.");
  }

  return (
    <div className="space-y-8 pb-12">
      <WorkspacePageHeader
        eyebrow="Workspace administration"
        title="Settings"
        description="Account security, team membership, scheduling preferences and collector configuration."
        actions={isManager ? <InviteTeamMemberDialog /> : undefined}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <DataSurface>
            <div className="flex items-start gap-3 border-b border-[var(--workspace-rule)] p-5">
              <UserRound className="mt-0.5 h-5 w-5 text-[var(--workspace-accent)]" />
              <div>
                <h2 className="font-semibold">Account</h2>
                <p className="mt-1 text-sm text-[var(--workspace-muted)]">
                  Identity comes from the authenticated ScrimStats account.
                </p>
              </div>
            </div>
            <dl className="px-5">
              <DetailRow label="Display name" value={displayName} />
              <DetailRow label="Email" value={user?.email || "Unavailable"} />
              <DetailRow label="Workspace role" value={activeRole || "Unavailable"} />
            </dl>
            <form
              className="border-t border-[var(--workspace-rule)] p-5"
              onSubmit={(event) => {
                event.preventDefault();
                administration.changePassword(password, {
                  onSuccess: () => setPassword(""),
                });
              }}
            >
              <Label htmlFor="new-password">New password</Label>
              <div className="mt-2 flex gap-2">
                <Input
                  id="new-password"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <Button type="submit" variant="outline" disabled={password.length < 8}>
                  <KeyRound className="h-4 w-4" />
                  Update
                </Button>
              </div>
            </form>
          </DataSurface>

          <DataSurface>
            <div className="flex items-start gap-3 border-b border-[var(--workspace-rule)] p-5">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-[var(--team-accent)]" />
              <div>
                <h2 className="font-semibold">Workspace preferences</h2>
                <p className="mt-1 text-sm text-[var(--workspace-muted)]">
                  The workspace timezone is the default when scheduling blocks and reminders.
                </p>
              </div>
            </div>
            <div className="grid gap-5 p-5">
              <div className="grid gap-2">
                <Label htmlFor="workspace-timezone">IANA timezone</Label>
                <Select value={timezone} onValueChange={setTimezone} disabled={!isManager}>
                  <SelectTrigger id="workspace-timezone"><SelectValue /></SelectTrigger>
                  <SelectContent>{[...new Set([timezone, ...commonTimezones])].map((zone) => <SelectItem key={zone} value={zone}>{zone}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {isManager && (
                <Button
                  className="justify-self-start"
                  disabled={administration.isSaving || !timezone.trim()}
                  onClick={() =>
                    administration.savePreferences({ timezone })
                  }
                >
                  Save preferences
                </Button>
              )}
            </div>
          </DataSurface>
          <NotificationPreferencesPanel />
        </div>

        <div className="space-y-6">
          <DesktopAppStatus />
          {isManager ? (
            <DesktopCollectorIntegration />
          ) : (
            <DataSurface className="p-5">
              <div className="flex gap-3">
                <Database className="mt-0.5 h-5 w-5 text-[var(--workspace-subtle)]" />
                <div>
                  <h2 className="font-semibold">Collector administration</h2>
                  <p className="mt-2 text-sm text-[var(--workspace-muted)]">
                    An owner or admin can pair the Windows collector.
                  </p>
                </div>
              </div>
            </DataSurface>
          )}

          <DataSurface>
            <div className="flex items-start gap-3 border-b border-[var(--workspace-rule)] p-5">
              <Users className="mt-0.5 h-5 w-5 text-[var(--workspace-accent)]" />
              <div>
                <h2 className="font-semibold">Team access</h2>
                <p className="mt-1 text-sm text-[var(--workspace-muted)]">
                  Roles are database permissions, not presentation-only labels.
                </p>
              </div>
            </div>
            {administration.isLoading ? (
              <p className="p-5 text-sm text-[var(--workspace-muted)]">Loading memberships…</p>
            ) : administration.error ? (
              <p className="p-5 text-sm text-destructive">Memberships could not be loaded.</p>
            ) : (
              <div className="divide-y divide-[var(--workspace-rule)]">
                {administration.data?.members.map((member) => (
                  <div
                    key={member.id}
                    className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_9rem_auto] sm:items-center"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {member.profile?.display_name || member.profile?.email || member.user_id}
                      </p>
                      <p className="mt-1 text-xs text-[var(--workspace-subtle)]">
                        {member.profile?.email || "Profile email unavailable"}
                      </p>
                    </div>
                    {isManager && member.user_id !== user?.id ? (
                      <Select value={member.role} onValueChange={(role) => administration.updateRole({ membershipId: member.id, role: role as TenantRole })}>
                        <SelectTrigger aria-label={`Role for ${member.profile?.display_name || member.profile?.email || "team member"}`}><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="member">Member</SelectItem><SelectItem value="viewer">Viewer</SelectItem></SelectContent>
                      </Select>
                    ) : (
                      <span className="ss-mono text-xs uppercase">{member.role}</span>
                    )}
                    {isManager && member.user_id !== user?.id && (
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Revoke workspace access"
                        onClick={() => {
                          if (window.confirm("Revoke this member's workspace access?")) {
                            administration.removeMember({
                              membershipId: member.id,
                              userId: member.user_id,
                            });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </DataSurface>

          {isManager && (administration.data?.invitations.length || 0) > 0 && (
            <DataSurface>
              <div className="border-b border-[var(--workspace-rule)] p-5">
                <h2 className="font-semibold">Pending invitations</h2>
              </div>
              <div className="divide-y divide-[var(--workspace-rule)]">
                {administration.data?.invitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div>
                      <p className="text-sm font-medium">{invitation.email}</p>
                      <p className="mt-1 text-xs text-[var(--workspace-subtle)]">
                        {invitation.player_id
                          ? `${players.find((player) => player.id === invitation.player_id)?.summoner_name || "Linked roster profile"} · `
                          : ""}
                        {invitation.role} · expires{" "}
                        {new Date(invitation.expires_at).toLocaleDateString()}
                      </p>
                      <p className="mt-1 text-xs capitalize text-[var(--workspace-muted)]">
                        Delivery: {invitation.delivery_status.replaceAll("_", " ")}
                        {invitation.last_sent_at ? ` · last sent ${new Date(invitation.last_sent_at).toLocaleString()}` : ""}
                      </p>
                      {invitation.delivery_error && <p className="mt-1 text-xs text-destructive">Delivery failed. Copy the secure link or resend.</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => void copyInvitation(invitation.token)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" aria-label={`Resend invitation to ${invitation.email}`} onClick={() => administration.resendInvitation(invitation.id)} disabled={administration.isSaving}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => administration.cancelInvitation(invitation.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </DataSurface>
          )}
        </div>
      </div>
    </div>
  );
}
