import { Link2 } from "lucide-react";

import { practiceDevelopmentStatusLabel } from "@/lib/practice-development";
import { Link } from "@/lib/router";
import type { PracticeDevelopmentActionBreadcrumb as Breadcrumb } from "@/types/practiceDevelopment";

interface PracticeDevelopmentActionBreadcrumbProps {
  breadcrumb?: Breadcrumb;
}

export function PracticeDevelopmentActionBreadcrumb({ breadcrumb }: PracticeDevelopmentActionBreadcrumbProps) {
  if (!breadcrumb) return null;

  return (
    <Link
      to={`/scrims/${breadcrumb.scrimId}`}
      className="mt-3 inline-flex max-w-full items-center gap-2 border-l-2 border-violet-300/60 pl-3 text-sm text-violet-200 hover:text-violet-100"
    >
      <Link2 className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">Block objective: {breadcrumb.objectiveTitle}</span>
      <span className="ss-mono shrink-0 text-[0.68rem] uppercase text-violet-300/75">{breadcrumb.isArchived ? "Archived" : breadcrumb.availability === "unavailable" ? "Unavailable" : practiceDevelopmentStatusLabel(breadcrumb.objectiveStatus)}</span>
    </Link>
  );
}
