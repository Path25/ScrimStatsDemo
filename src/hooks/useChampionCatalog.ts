import { useQuery } from "@tanstack/react-query";
import type { ChampionImageCandidate } from "@/lib/champion-avatar";

export interface ChampionCatalogEntry extends ChampionImageCandidate {
  key: string;
}

interface DataDragonChampionPayload {
  data: Record<string, { id: string; key: string; name: string; image?: { full?: string } }>;
}

async function loadChampionCatalog(): Promise<ChampionCatalogEntry[]> {
  const versionsResponse = await fetch(
    "https://ddragon.leagueoflegends.com/api/versions.json",
  );
  if (!versionsResponse.ok) {
    throw new Error("Champion catalogue versions are unavailable.");
  }

  const versions = (await versionsResponse.json()) as string[];
  const currentVersion = versions[0];
  if (!currentVersion) {
    throw new Error("No current Data Dragon version was returned.");
  }

  const championsResponse = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/data/en_US/champion.json`,
  );
  if (!championsResponse.ok) {
    throw new Error("The champion catalogue is unavailable.");
  }

  const payload = (await championsResponse.json()) as DataDragonChampionPayload;
  return Object.values(payload.data)
    .flatMap(({ id, key, name, image }) => image?.full
      ? [{
        id,
        key,
        name,
        imageUrl: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/champion/${image.full}`,
      }]
      : [])
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function useChampionCatalog() {
  return useQuery({
    queryKey: ["data-dragon", "champion-catalogue"],
    queryFn: loadChampionCatalog,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
    retry: 1,
  });
}
