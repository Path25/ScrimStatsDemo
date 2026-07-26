import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DataSurface } from "@/components/workspace/DataSurface";
import { useNotificationPreferences } from "@/hooks/useWorkspaceNotifications";

const defaults = { in_app_enabled: true, email_enabled: true, schedule_enabled: true, coaching_enabled: true, integration_enabled: true, reminder_24h: true, reminder_2h: true };

export function NotificationPreferencesPanel() {
  const { preferences, isLoading, error, save, isSaving } = useNotificationPreferences();
  const [form, setForm] = useState(defaults);
  useEffect(() => { if (preferences) setForm({ ...defaults, ...preferences }); }, [preferences]);
  const row = (id: keyof typeof defaults, title: string, detail: string) => <div className="flex items-center justify-between gap-4"><div><Label htmlFor={id}>{title}</Label><p className="mt-1 text-sm text-[var(--workspace-muted)]">{detail}</p></div><Switch id={id} checked={form[id]} onCheckedChange={(checked) => setForm((current) => ({ ...current, [id]: checked }))} /></div>;
  return <DataSurface>
    <div className="flex items-start gap-3 border-b border-[var(--workspace-rule)] p-5"><BellRing className="mt-0.5 h-5 w-5 text-[var(--workspace-accent)]" /><div><h2 className="font-semibold">Notifications</h2><p className="mt-1 text-sm text-[var(--workspace-muted)]">Choose how schedule changes and coaching follow-ups reach you.</p></div></div>
    {isLoading ? <p className="p-5 text-sm text-[var(--workspace-muted)]">Loading preferences…</p> : error ? <p className="p-5 text-sm text-destructive">Notification preferences could not be loaded.</p> : <div className="grid gap-5 p-5">
      {row("in_app_enabled", "In-app notifications", "Keep delivery visible in the dashboard inbox.")}
      {row("email_enabled", "Email notifications", "Receive enabled categories at your account email.")}
      {row("schedule_enabled", "Schedule changes", "New, rescheduled and cancelled team events.")}
      {row("coaching_enabled", "Coaching actions", "Assignment, due-date and review updates.")}
      {row("integration_enabled", "Integration health", "Staff-only delivery and connection failures.")}
      <div className="grid gap-5 border-t border-[var(--workspace-rule)] pt-5 sm:grid-cols-2">{row("reminder_24h", "24-hour reminder", "Practice preparation notice.")}{row("reminder_2h", "Two-hour reminder", "Final upcoming-block notice.")}</div>
      <Button className="justify-self-start" disabled={isSaving} onClick={() => void save(form).then(() => toast.success("Notification preferences saved.")).catch((reason: unknown) => toast.error(reason instanceof Error ? reason.message : "Preferences could not be saved."))}>{isSaving ? "Saving…" : "Save notifications"}</Button>
    </div>}
  </DataSurface>;
}
