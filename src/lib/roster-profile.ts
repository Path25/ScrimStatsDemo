import type { Json } from "@/integrations/supabase/types";

export const UNSET_ROSTER_VALUE = "__not_recorded__";

export function normalizeRequiredName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeOptionalText(value: string) {
  const normalized = value.trim();
  return normalized || undefined;
}

export function normalizeChampionPool(values: string[] | string) {
  const candidates = Array.isArray(values) ? values : values.split(",");
  const seen = new Set<string>();

  return candidates.reduce<string[]>((champions, value) => {
    const champion = value.trim().replace(/\s+/g, " ");
    const key = champion.toLocaleLowerCase();
    if (!champion || seen.has(key) || champions.length >= 12) return champions;
    seen.add(key);
    champions.push(champion);
    return champions;
  }, []);
}

export function championPoolFromJson(value: Json | null) {
  if (!Array.isArray(value)) return [];
  return normalizeChampionPool(value.filter((entry): entry is string => typeof entry === "string"));
}

export function displayRiotIdentity(riotId: string | null, tagLine: string | null) {
  if (!riotId) return null;
  return tagLine ? `${riotId}#${tagLine}` : riotId;
}
