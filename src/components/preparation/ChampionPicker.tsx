import { useId, useMemo } from "react";

import { Input } from "@/components/ui/input";
import { useChampionCatalog } from "@/hooks/useChampionCatalog";

interface ChampionPickerProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

export function ChampionPicker({ id, value, onChange }: ChampionPickerProps) {
  const generatedId = useId();
  const listId = `champion-catalogue-${generatedId.replaceAll(":", "")}`;
  const catalog = useChampionCatalog();
  const canonicalName = useMemo(() => {
    const normalized = value.trim().toLocaleLowerCase();
    return catalog.data?.find(
      (champion) => champion.name.toLocaleLowerCase() === normalized,
    )?.name;
  }, [catalog.data, value]);

  return (
    <div className="space-y-2">
      <Input
        id={id}
        list={catalog.data?.length ? listId : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => canonicalName && onChange(canonicalName)}
        autoComplete="off"
        placeholder={catalog.isError ? "Enter champion name" : "Search champions"}
      />
      {catalog.data?.length ? (
        <datalist id={listId}>
          {catalog.data.map((champion) => (
            <option key={champion.id} value={champion.name} />
          ))}
        </datalist>
      ) : (
        <p className="text-xs leading-5 text-[var(--workspace-subtle)]">
          {catalog.isLoading
            ? "Loading the current Data Dragon champion catalogue…"
            : "Champion catalogue unavailable. You can still enter the exact champion name."}
        </p>
      )}
    </div>
  );
}
