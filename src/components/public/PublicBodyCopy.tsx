import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type PublicBodyCopyProps = HTMLAttributes<HTMLParagraphElement>;

export function PublicBodyCopy({ className, ...props }: PublicBodyCopyProps) {
  return <p className={cn("public-body-copy", className)} {...props} />;
}
