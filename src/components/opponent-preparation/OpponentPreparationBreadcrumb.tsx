import { ShieldCheck } from "lucide-react";

import { Link } from "@/lib/router";
import type { OpponentPreparationBreadcrumb as Breadcrumb } from "@/types/opponentPreparation";

export function OpponentPreparationBreadcrumb({ breadcrumb }: { breadcrumb?: Breadcrumb }) {
  if (!breadcrumb) return null;
  return (
    <Link
      to={`/scouting/${breadcrumb.opponentId}`}
      className="mt-3 inline-flex max-w-full items-center gap-2 border border-violet-300/25 bg-violet-300/[0.05] px-2.5 py-1.5 text-xs text-violet-100 hover:border-violet-300/50"
    >
      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">Opponent preparation · {breadcrumb.opponentName} · {breadcrumb.revisionTitle}</span>
    </Link>
  );
}
