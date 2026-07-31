import { Navigate, useLocation } from '@/lib/router';
import { ShieldAlert } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';

export function WorkspaceGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { tenant, isLoading: tenantLoading, hasNoTenant, requiresWorkspaceSelection, error } = useTenant();
  const location = useLocation();

  if (authLoading || tenantLoading) {
    return <main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">Opening workspace…</main>;
  }

  if (!user) return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  if (requiresWorkspaceSelection) return <Navigate to="/workspaces" replace />;
  if (hasNoTenant) return <Navigate to="/create-workspace" replace />;

  if (error || !tenant) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 text-center">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl">
          <ShieldAlert className="mx-auto h-7 w-7 text-amber-300" />
          <h1 className="mt-4 text-xl font-semibold">Workspace access unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {error || 'Your account is not currently attached to a ScrimStats team. Ask your team manager to send an invitation.'}
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
