import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const navigation = [
  { label: "Product", href: "#product" },
  { label: "Platform", href: "#platform" },
  { label: "Workflow", href: "#workflow" },
];

export function PublicHeader({
  action = "request-access",
}: {
  action?: "request-access" | "sign-in";
}) {
  return (
    <header className="border-b border-[var(--public-rule)] bg-[var(--public-bg)]">
      <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-6 px-5 lg:px-9">
        <Link to="/" aria-label="ScrimStats home" className="shrink-0">
          <img
            src="/ScrimStats logo.png"
            alt="ScrimStats by ProComps"
            className="h-8 w-auto sm:h-9"
          />
        </Link>

        <nav aria-label="Public navigation" className="hidden items-center gap-8 lg:flex">
          {navigation.map((item) => (
            <a
              key={item.label}
              href={`/${item.href}`}
              className="text-[15px] font-medium text-[var(--public-muted)] transition-colors hover:text-[var(--public-foreground)]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {action === "request-access" ? (
            <>
              <Link
                to="/sign-in"
                className="hidden px-3 py-2 text-[15px] font-medium text-[var(--public-muted)] transition-colors hover:text-[var(--public-foreground)] sm:inline-flex"
              >
                Member sign in
              </Link>
              <Link
                to="/request-access"
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--public-foreground)] px-4 text-[15px] font-semibold text-[var(--public-bg)] transition-colors hover:bg-[var(--public-action)]"
              >
                Request access
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </>
          ) : (
            <Link
              to="/sign-in"
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--public-foreground)] px-4 text-[15px] font-semibold text-[var(--public-bg)] transition-colors hover:bg-[var(--public-action)]"
            >
              Member sign in
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
