import { useEffect, useMemo, useState } from "react";
import { Check, ExternalLink, RefreshCw, ScrollText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataSurface } from "@/components/workspace/DataSurface";
import { WorkspaceState } from "@/components/workspace/WorkspaceState";
import { useLeaguepediaDraftHistory } from "@/hooks/useLeaguepediaDraftHistory";
import type { Json } from "@/integrations/supabase/types";

type Brief = { id: string; title: string; status: string };

function championList(value: Json) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").join(" · ")
    : "";
}

export function LeaguepediaDraftHistory({
  opponentTeamId,
  opponentName,
  briefs,
  canEdit,
}: {
  opponentTeamId: string;
  opponentName: string;
  briefs: Brief[];
  canEdit: boolean;
}) {
  const history = useLeaguepediaDraftHistory(opponentTeamId, true, canEdit);
  const draftBriefs = briefs.filter((brief) => brief.status === "draft");
  const [providerName, setProviderName] = useState(opponentName);
  const [briefId, setBriefId] = useState(draftBriefs[0]?.id || "");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (history.data?.team.leaguepedia_name) {
      setProviderName(history.data.team.leaguepedia_name);
    }
  }, [history.data?.team.leaguepedia_name]);

  const linkedForBrief = useMemo(
    () => (history.data?.links || [])
      .filter((link) => link.brief_id === briefId)
      .map((link) => link.external_draft_game_id),
    [briefId, history.data?.links],
  );

  useEffect(() => setSelected(linkedForBrief), [linkedForBrief]);

  function toggle(gameId: string) {
    setSelected((current) => current.includes(gameId)
      ? current.filter((id) => id !== gameId)
      : [...current, gameId]);
  }

  return (
    <DataSurface>
      <div className="border-b border-[var(--workspace-rule)] px-5 py-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="workspace-eyebrow">Attributed public evidence</p>
            <h2 className="mt-2 text-lg font-semibold">Leaguepedia draft history</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--workspace-muted)]">
              Import bounded pick/ban records from Leaguepedia’s structured Cargo API. Source page,
              source game ID, import time, patch, and revision are retained with every game.
            </p>
          </div>
          {canEdit && (
            <div className="grid gap-2 sm:grid-cols-[minmax(14rem,1fr)_auto]">
              <div>
                <Label htmlFor="leaguepedia-team">Exact Leaguepedia team name</Label>
                <Input
                  id="leaguepedia-team"
                  value={providerName}
                  onChange={(event) => setProviderName(event.target.value)}
                  maxLength={160}
                  className="mt-1.5"
                />
              </div>
              <Button
                className="self-end"
                disabled={!providerName.trim() || history.importing}
                onClick={() => void history.importHistory(providerName)}
              >
                <RefreshCw className={`h-4 w-4 ${history.importing ? "animate-spin" : ""}`} />
                {history.importing ? "Importing" : "Import history"}
              </Button>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--workspace-subtle)]">
          <span>Source: Leaguepedia / League of Legends Esports Wiki</span>
          <a href="https://lol.fandom.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-[var(--workspace-foreground)]">
            CC BY-SA 3.0 <ExternalLink className="h-3.5 w-3.5" />
          </a>
          {history.data?.team.leaguepedia_last_synced_at && (
            <span>Fetched {new Date(history.data.team.leaguepedia_last_synced_at).toLocaleString()}</span>
          )}
        </div>
      </div>

      {history.isLoading ? (
        <WorkspaceState icon={ScrollText} title="Loading draft history…" description="Reading attributed opponent draft records." className="m-5" />
      ) : history.error ? (
        <WorkspaceState icon={ScrollText} title="Draft history unavailable" description="Imported draft history could not be loaded for this workspace." className="m-5" />
      ) : !history.data?.games.length ? (
        <WorkspaceState
          icon={ScrollText}
          title="No imported draft games yet."
          description={canEdit
            ? "Use the exact team name used by Leaguepedia, then import. No placeholder drafts are shown."
            : "No attributed draft history is available for this opponent yet."}
          className="m-5"
        />
      ) : (
        <>
          {canEdit && (
            <div className="flex flex-col gap-4 border-b border-[var(--workspace-rule)] px-5 py-4 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0 flex-1">
                <Label htmlFor="draft-brief">Attach selected games to a draft brief</Label>
                <select
                  id="draft-brief"
                  value={briefId}
                  onChange={(event) => setBriefId(event.target.value)}
                  className="mt-1.5 h-10 w-full max-w-md border border-input bg-background px-3 text-sm"
                >
                  {!draftBriefs.length && <option value="">No editable brief available</option>}
                  {draftBriefs.map((brief) => <option key={brief.id} value={brief.id}>{brief.title}</option>)}
                </select>
              </div>
              <Button
                variant="outline"
                disabled={!briefId || history.savingSelection}
                onClick={() => void history.setBriefDrafts({ briefId, gameIds: selected })}
              >
                <Check className="h-4 w-4" /> Save evidence selection
              </Button>
            </div>
          )}
          <div className="divide-y divide-[var(--workspace-rule)]">
            {history.data.games.map((game) => (
              <article key={game.id} className={`grid gap-4 px-5 py-5 lg:items-start ${canEdit ? "lg:grid-cols-[auto_12rem_1fr_auto]" : "lg:grid-cols-[12rem_1fr_auto]"}`}>
                {canEdit && (
                  <Checkbox
                    checked={selected.includes(game.id)}
                    onCheckedChange={() => toggle(game.id)}
                    disabled={!briefId}
                    aria-label={`Attach ${game.blue_team} versus ${game.red_team}`}
                  />
                )}
                <div>
                  <p className="text-sm font-medium">{game.blue_team} vs {game.red_team}</p>
                  <p className="mt-1 ss-mono text-xs text-[var(--workspace-subtle)]">
                    {game.played_at ? new Date(game.played_at).toLocaleDateString() : "Date unavailable"}
                    {game.patch ? ` · Patch ${game.patch}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-[var(--workspace-subtle)]">{game.provider_tournament || "Tournament unavailable"}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="workspace-eyebrow">Blue draft</p>
                    <p className="mt-1 text-sm leading-6">{championList(game.blue_picks) || "Picks unavailable"}</p>
                    <p className="mt-1 text-xs text-[var(--workspace-subtle)]">Bans: {championList(game.blue_bans) || "unavailable"}</p>
                  </div>
                  <div>
                    <p className="workspace-eyebrow">Red draft</p>
                    <p className="mt-1 text-sm leading-6">{championList(game.red_picks) || "Picks unavailable"}</p>
                    <p className="mt-1 text-xs text-[var(--workspace-subtle)]">Bans: {championList(game.red_bans) || "unavailable"}</p>
                  </div>
                </div>
                <a href={game.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-[var(--workspace-accent)] hover:underline">
                  Source <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </article>
            ))}
          </div>
        </>
      )}
    </DataSurface>
  );
}
