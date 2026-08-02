import { Link, Navigate, useNavigate } from '@/lib/router';
import { Building2, Plus } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';

export default function Workspaces() {
  const { memberships, chooseTenant } = useTenant();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) return <main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">Checking access...</main>;
  if (!user) return <Navigate to="/sign-in" replace />;
  if (!memberships.length) return <Navigate to="/create-workspace" replace />;

  const canCreateAdditionalWorkspace = memberships.some((membership) => membership.userRole === 'owner');
  const hasMultipleWorkspaces = memberships.length > 1;

  return (
    <main className="grid min-h-screen place-items-center bg-background px-5">
      <section className="w-full max-w-lg">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-brand-primary">ScrimStats by ProComps</p>
        <h1 className="mt-3 text-3xl font-semibold">{hasMultipleWorkspaces ? 'Choose a team workspace' : 'Manage team workspaces'}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{hasMultipleWorkspaces ? 'Your account belongs to more than one team. Choose where you want to work now.' : 'Open your current team workspace or create another independent workspace.'}</p>
        <div className="mt-8 space-y-3">
          {memberships.map((membership) => (
            <button key={membership.id} onClick={() => { chooseTenant(membership.id); navigate('/overview', { replace: true }); }} className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-5 text-left transition hover:border-brand-primary/50 hover:bg-accent">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-primary/10 text-brand-primary"><Building2 className="h-5 w-5" /></div>
              <span><strong className="block">{membership.name}</strong><span className="mt-1 block text-xs uppercase tracking-[.14em] text-muted-foreground">{membership.userRole}</span></span>
            </button>
          ))}
        </div>
        {canCreateAdditionalWorkspace && (
          <Link to="/create-workspace" className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-lg border border-brand-primary/45 px-4 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/10">
            <Plus className="h-4 w-4" aria-hidden="true" />Create another workspace
          </Link>
        )}
      </section>
    </main>
  );
}
