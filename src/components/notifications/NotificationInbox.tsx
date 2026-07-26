import { Bell, CheckCheck, Inbox } from "lucide-react";
import { useNavigate } from "@/lib/router";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useWorkspaceNotifications } from "@/hooks/useWorkspaceNotifications";

export function NotificationInbox() {
  const navigate = useNavigate();
  const { notifications, unread, isLoading, error, markRead } = useWorkspaceNotifications();
  return <DropdownMenu>
    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}><Bell className="h-4 w-4" />{unread > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--workspace-accent)] px-1 text-[11px] font-bold text-[#06100f]">{unread > 9 ? "9+" : unread}</span>}</Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-[min(24rem,calc(100vw-2rem))] border-[var(--workspace-rule-strong)] bg-[var(--workspace-surface-raised)] p-0">
      <DropdownMenuLabel className="flex items-center justify-between px-4 py-3"><span>Notifications</span><span className="ss-mono text-xs font-normal text-[var(--workspace-subtle)]">{unread} unread</span></DropdownMenuLabel><DropdownMenuSeparator />
      {isLoading ? <p className="p-5 text-sm text-[var(--workspace-muted)]">Loading notifications…</p> : error ? <p className="p-5 text-sm text-destructive">Notifications could not be loaded.</p> : notifications.length ? <div className="max-h-96 overflow-y-auto divide-y divide-[var(--workspace-rule)]">{notifications.map((item) => <button key={item.id} type="button" className="block w-full px-4 py-3 text-left hover:bg-[var(--workspace-surface)]" onClick={() => { void markRead(item.id); if (item.href?.startsWith("/")) navigate(item.href); }}><div className="flex items-start gap-3">{item.read_at ? <CheckCheck className="mt-0.5 h-4 w-4 text-[var(--workspace-subtle)]" /> : <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--workspace-accent)]" />}<span><span className="block text-sm font-medium">{item.title}</span><span className="mt-1 block text-xs leading-5 text-[var(--workspace-muted)]">{item.body}</span><span className="mt-2 block text-xs text-[var(--workspace-subtle)]">{new Date(item.created_at).toLocaleString()}</span></span></div></button>)}</div> : <div className="p-6 text-center"><Inbox className="mx-auto h-5 w-5 text-[var(--workspace-subtle)]" /><p className="mt-3 text-sm text-[var(--workspace-muted)]">No notifications yet.</p></div>}
    </DropdownMenuContent>
  </DropdownMenu>;
}
