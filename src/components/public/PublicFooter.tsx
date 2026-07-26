import { Link } from "@/lib/router";

export function PublicFooter() {
  return (
    <footer className="border-t border-[var(--public-rule)]">
      <div className="mx-auto max-w-[1440px] px-5 py-8 text-sm text-[var(--public-muted)] lg:px-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <img
            src="/ScrimStats logo.png"
            alt="ScrimStats by ProComps"
            className="h-8 w-auto self-start opacity-80"
          />
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <Link
              to="/sign-in"
              className="transition-colors hover:text-[var(--public-foreground)]"
            >
              Member sign in
            </Link>
            <Link
              to="/request-access"
              className="transition-colors hover:text-[var(--public-foreground)]"
            >
              Request access
            </Link>
            <Link to="/support" className="transition-colors hover:text-[var(--public-foreground)]">Support</Link>
            <Link to="/status" className="transition-colors hover:text-[var(--public-foreground)]">Status</Link>
            <Link to="/privacy" className="transition-colors hover:text-[var(--public-foreground)]">Privacy</Link>
            <Link to="/terms" className="transition-colors hover:text-[var(--public-foreground)]">Terms</Link>
          </div>
        </div>
        <p className="mt-7 max-w-5xl border-t border-[var(--public-rule)] pt-5 text-xs leading-5 text-[var(--public-muted)]">
          ScrimStats is not endorsed by Riot Games and does not reflect the views or opinions of
          Riot Games or anyone officially involved in producing or managing Riot Games properties.
          Riot Games and all associated properties are trademarks or registered trademarks of Riot
          Games, Inc.
        </p>
      </div>
    </footer>
  );
}
