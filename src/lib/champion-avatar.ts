export interface ChampionImageCandidate {
  id: string;
  name: string;
  imageUrl: string;
}

export const normalizeChampionIdentity = (value?: string | null) =>
  (value || "").toLocaleLowerCase().replace(/[^a-z0-9]/g, "");

export const dedupeChampionImageCandidates = <TCandidate extends ChampionImageCandidate>(
  candidates: TCandidate[],
) => {
  const byIdentity = new Map<string, TCandidate>();

  for (const candidate of candidates) {
    const identity = normalizeChampionIdentity(candidate.name) || normalizeChampionIdentity(candidate.id);
    if (!identity) continue;

    const current = byIdentity.get(identity);
    if (!current || compareChampionCandidates(candidate, current) < 0) {
      byIdentity.set(identity, candidate);
    }
  }

  return [...byIdentity.values()].sort((left, right) => left.name.localeCompare(right.name));
};

const compareChampionCandidates = (left: ChampionImageCandidate, right: ChampionImageCandidate) =>
  right.name.length - left.name.length
  || left.name.localeCompare(right.name)
  || left.id.localeCompare(right.id)
  || left.imageUrl.localeCompare(right.imageUrl);

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

export const STAGING_AVATAR_QA_FAILURE_URL = "https://ddragon.leagueoflegends.com/cdn/16.15.1/img/champion/__scrimstats_avatar_qa_missing__.png";

export const isStagingAvatarQaFixtureEnabled = () =>
  typeof window !== "undefined"
  && window.location.hostname === "staging.scrimstats.gg"
  && new URLSearchParams(window.location.search).get("avatar-qa") === "1";
