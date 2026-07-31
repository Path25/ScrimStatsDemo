export interface ChampionImageCandidate {
  id: string;
  name: string;
  imageUrl: string;
}

export const normalizeChampionIdentity = (value?: string | null) =>
  (value || "").toLocaleLowerCase().replace(/[^a-z0-9]/g, "");

export const isMissingChampionIdentity = (value?: string | null) => {
  const normalized = normalizeChampionIdentity(value);
  return normalized.length === 0 || normalized === "none";
};

export const resolveChampionImageUrl = (
  championName: string | null | undefined,
  catalogue: ChampionImageCandidate[] | undefined,
) => {
  if (isMissingChampionIdentity(championName)) return null;
  const identity = normalizeChampionIdentity(championName);
  return catalogue?.find((champion) =>
    normalizeChampionIdentity(champion.name) === identity
    || normalizeChampionIdentity(champion.id) === identity,
  )?.imageUrl ?? null;
};

export const championFallbackLabel = (championName?: string | null) => {
  if (isMissingChampionIdentity(championName)) return "Champion not recorded";
  return `${championName!.trim()} icon unavailable`;
};

export const championFallbackInitials = (championName?: string | null) => {
  if (isMissingChampionIdentity(championName)) return null;
  return championName!.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || null;
};
