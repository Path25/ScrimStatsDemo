import { useQuery } from "@tanstack/react-query";

export interface ItemCatalogEntry { id: number; name: string; iconUrl: string; }
interface DataDragonItemPayload { data: Record<string, { name: string; image?: { full?: string } }>; }

async function loadItemCatalog(): Promise<ItemCatalogEntry[]> {
  const versionsResponse = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
  if (!versionsResponse.ok) throw new Error("Item catalogue versions are unavailable.");
  const versions = (await versionsResponse.json()) as string[];
  const version = versions[0];
  if (!version) throw new Error("No current Data Dragon version was returned.");
  const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`);
  if (!response.ok) throw new Error("The item catalogue is unavailable.");
  const payload = (await response.json()) as DataDragonItemPayload;
  return Object.entries(payload.data).flatMap(([key, item]) => {
    const id = Number(key);
    return Number.isFinite(id) ? [{ id, name: item.name, iconUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item.image?.full || `${id}.png`}` }] : [];
  });
}

export function useItemCatalog() {
  return useQuery({ queryKey: ["data-dragon", "item-catalogue"], queryFn: loadItemCatalog, staleTime: 86_400_000, gcTime: 604_800_000, retry: 1 });
}
