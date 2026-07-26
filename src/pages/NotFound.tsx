import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "@/lib/router";
import { Button } from "@/components/ui/button";

const NotFound = ({ authenticated = false }: { authenticated?: boolean }) => {
  const location = useLocation();

  return (
    <div className={authenticated ? "grid min-h-[65vh] place-items-center px-5" : "workspace-shell grid min-h-screen place-items-center px-5"}>
      <div className="max-w-lg text-center">
        <p className="workspace-eyebrow text-[var(--workspace-accent)]">404 · Route unavailable</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">This page is not part of the workspace.</h1>
        <p className="mt-4 text-sm leading-6 text-[var(--workspace-muted)]">
          No page is registered at <span className="font-mono text-[var(--workspace-foreground)]">{location.pathname}</span>. The link may be outdated or your access may have changed.
        </p>
        <Button asChild className="mt-7">
          <Link to={authenticated ? "/overview" : "/"}><ArrowLeft className="h-4 w-4" />{authenticated ? "Return to overview" : "Return home"}</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
