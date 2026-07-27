import { useMemo } from "react";

import { useItemCatalog } from "@/hooks/useItemCatalog";
import type { GameItem } from "@/types/scrimGame";

export function ItemBuild({ items }: { items: GameItem[] }) {
  const { data: catalog = [] } = useItemCatalog();
  const byId = useMemo(() => new Map(catalog.map((item) => [item.id, item])), [catalog]);
  if (!items.length) return <p className="mt-2 text-xs text-[var(--workspace-muted)]">Build: Not recorded</p>;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Final item build">
      {items.map((item) => {
        const resolved = byId.get(item.id);
        const name = resolved?.name || item.name;
        return <span key={`${item.slot}-${item.id}`} className="inline-flex items-center gap-1.5 border border-[var(--workspace-rule)] bg-[var(--workspace-surface-raised)] px-2 py-1 text-xs" title={name}>{resolved?.iconUrl && <img src={resolved.iconUrl} alt="" className="h-5 w-5" loading="lazy" />}<span>{name}</span></span>;
      })}
    </div>
  );
}
