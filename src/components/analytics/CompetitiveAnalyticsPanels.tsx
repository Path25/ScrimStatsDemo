import { useMemo, useState } from "react";
import { BarChart3, Network, Search, ShieldCheck, Swords, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataSurface } from "@/components/workspace/DataSurface";
import { SourceBadge } from "@/components/workspace/SourceBadge";
import { WorkspaceState } from "@/components/workspace/WorkspaceState";
import { useChampionCatalog } from "@/hooks/useChampionCatalog";
import type {
  AnalyticsEvidenceRow,
  AnalyticsRole,
  CompetitiveDraftAnalytics,
  DuoEvidenceRow,
  PlayerEvidenceRow,
} from "@/hooks/useCompetitiveDraftAnalytics";
import { cn } from "@/lib/utils";

type View = "champions" | "matchups" | "duos" | "players" | "compositions";

const roleLabels: Record<AnalyticsRole, string> = {
  top: "Top",
  jungle: "Jungle",
  mid: "Mid",
  adc: "ADC",
  support: "Support",
};

function rate(wins: number, games: number) {
  return games ? `${Math.round((wins / games) * 100)}%` : "Not available";
}

function sampleLabel(row: AnalyticsEvidenceRow) {
  return `${row.wins}W–${row.losses}L · ${row.games} game${row.games === 1 ? "" : "s"}`;
}

function EvidenceMeta({ row }: { row: AnalyticsEvidenceRow }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--workspace-subtle)]">
      <span>{sampleLabel(row)}</span>
      {row.games < 3 && (
        <span className="border border-[var(--workspace-manual)]/35 px-1.5 py-0.5 text-[var(--workspace-manual)]">
          Small sample
        </span>
      )}
      {row.collector_games > 0 && <SourceBadge source="collector" compact />}
      {row.manual_games > 0 && <SourceBadge source="manual" compact />}
    </div>
  );
}

function CoverageHeader({ data }: { data: CompetitiveDraftAnalytics }) {
  const items = [
    ["Qualifying results", data.coverage.qualifying_games],
    ["Champion drafts", data.coverage.games_with_team_picks],
    ["Role matchups", data.coverage.games_with_role_matchups],
    ["Recorded bans", data.coverage.games_with_bans],
  ] as const;

  return (
    <DataSurface className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[var(--workspace-rule)] p-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Draft evidence</p>
          <h2 className="mt-2 text-xl font-semibold">Competitive patterns from saved games</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--workspace-muted)]">
            Every row shows its raw sample and provenance. Completed games without a saved result are
            excluded rather than treated as losses.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.coverage.collector_games > 0 && <SourceBadge source="collector" />}
          {data.coverage.manual_games > 0 && <SourceBadge source="manual" />}
        </div>
      </div>
      <div className="grid divide-y divide-[var(--workspace-rule)] sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        {items.map(([label, value]) => (
          <div key={label} className="p-4">
            <div className="ss-mono text-2xl font-semibold">{value}</div>
            <div className="mt-1 text-sm text-[var(--workspace-muted)]">{label}</div>
          </div>
        ))}
      </div>
      {data.coverage.excluded_games > 0 && (
        <p className="border-t border-[var(--workspace-rule)] px-5 py-3 text-sm text-[var(--workspace-muted)]">
          {data.coverage.excluded_games} completed game{data.coverage.excluded_games === 1 ? " was" : "s were"} excluded because no win/loss result was saved.
        </p>
      )}
    </DataSurface>
  );
}

function ChampionView({ data, query }: { data: CompetitiveDraftAnalytics; query: string }) {
  const { data: catalog = [] } = useChampionCatalog();
  const namesByKey = useMemo(
    () => new Map(catalog.map((champion) => [champion.key, champion.name])),
    [catalog],
  );
  const picks = data.champions.filter((row) =>
    `${row.champion} ${roleLabels[row.role]}`.toLowerCase().includes(query.toLowerCase()),
  );
  const bans = data.bans
    .map((row) => ({ ...row, champion: namesByKey.get(row.champion_key) || row.champion_key }))
    .filter((row) => row.champion.toLowerCase().includes(query.toLowerCase()));

  if (!picks.length && !bans.length) {
    return <WorkspaceState icon={Search} title="No champion evidence matches" description="Clear the search or widen the shared date and opponent filters." />;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.45fr_0.55fr]">
      <DataSurface>
        <div className="border-b border-[var(--workspace-rule)] px-5 py-4">
          <h3 className="font-semibold">Picks by role</h3>
          <p className="mt-1 text-sm text-[var(--workspace-muted)]">Only team-side participants with a recognised competitive role.</p>
        </div>
        <div className="divide-y divide-[var(--workspace-rule)]">
          {picks.map((row) => (
            <div key={`${row.role}-${row.champion}`} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{row.champion}</span>
                  <span className="ss-mono text-xs uppercase text-[var(--workspace-subtle)]">{roleLabels[row.role]}</span>
                </div>
                <EvidenceMeta row={row} />
              </div>
              <div className="sm:text-right">
                <div className="ss-mono text-lg font-semibold">{rate(row.wins, row.games)}</div>
                <div className="text-xs text-[var(--workspace-subtle)]">saved-result win rate</div>
              </div>
            </div>
          ))}
        </div>
      </DataSurface>

      <DataSurface>
        <div className="border-b border-[var(--workspace-rule)] px-5 py-4">
          <h3 className="font-semibold">Team bans</h3>
          <p className="mt-1 text-sm text-[var(--workspace-muted)]">Available only when a completed draft capture includes ban IDs.</p>
        </div>
        {bans.length ? (
          <div className="divide-y divide-[var(--workspace-rule)]">
            {bans.map((row) => (
              <div key={row.champion_key} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <div className="font-medium">{row.champion}</div>
                  <EvidenceMeta row={row} />
                </div>
                <span className="ss-mono text-sm">{row.games}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-5 text-sm leading-6 text-[var(--workspace-muted)]">No qualifying ban captures exist in this filtered sample. Pick statistics remain available independently.</p>
        )}
      </DataSurface>
    </div>
  );
}

function MatchupView({ data, query }: { data: CompetitiveDraftAnalytics; query: string }) {
  const rows = data.matchups.filter((row) =>
    `${row.champion} ${row.opponent_champion} ${roleLabels[row.role]}`.toLowerCase().includes(query.toLowerCase()),
  );
  if (!rows.length) return <WorkspaceState icon={Swords} title="No role matchup evidence" description="Both teams need champion and role records in the same saved-result game." />;

  return (
    <DataSurface>
      <div className="border-b border-[var(--workspace-rule)] px-5 py-4">
        <h3 className="font-semibold">Role matchups</h3>
        <p className="mt-1 text-sm text-[var(--workspace-muted)]">Direct same-role pairings; no lane outcome is inferred.</p>
      </div>
      <div className="divide-y divide-[var(--workspace-rule)]">
        {rows.map((row) => (
          <div key={`${row.role}-${row.champion}-${row.opponent_champion}`} className="grid gap-3 px-5 py-4 md:grid-cols-[110px_1fr_auto] md:items-center">
            <span className="ss-mono text-xs uppercase text-[var(--workspace-subtle)]">{roleLabels[row.role]}</span>
            <div>
              <div className="font-medium">{row.champion} <span className="font-normal text-[var(--workspace-subtle)]">into</span> {row.opponent_champion}</div>
              <EvidenceMeta row={row} />
            </div>
            <div className="md:text-right">
              <div className="ss-mono font-semibold">{rate(row.wins, row.games)}</div>
              <div className="text-xs text-[var(--workspace-subtle)]">{row.games} game{row.games === 1 ? "" : "s"}</div>
            </div>
          </div>
        ))}
      </div>
    </DataSurface>
  );
}

function isPriorityDuo(row: DuoEvidenceRow) {
  const pair = new Set([row.first_role, row.second_role]);
  return (pair.has("jungle") && pair.has("mid")) || (pair.has("adc") && pair.has("support"));
}

function DuoView({ data, query }: { data: CompetitiveDraftAnalytics; query: string }) {
  const [priorityOnly, setPriorityOnly] = useState(true);
  const rows = data.duos.filter((row) => {
    const matches = `${row.first_champion} ${row.second_champion} ${roleLabels[row.first_role]} ${roleLabels[row.second_role]}`.toLowerCase().includes(query.toLowerCase());
    return matches && (!priorityOnly || isPriorityDuo(row));
  });

  return (
    <DataSurface>
      <div className="flex flex-col gap-3 border-b border-[var(--workspace-rule)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">Champion combinations</h3>
          <p className="mt-1 text-sm text-[var(--workspace-muted)]">Raw co-occurrence, with competitive role pairs prioritised by default.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setPriorityOnly((value) => !value)}>
          {priorityOnly ? "Show all role pairs" : "Show Jungle–Mid and bot lane"}
        </Button>
      </div>
      {rows.length ? (
        <div className="divide-y divide-[var(--workspace-rule)]">
          {rows.map((row) => (
            <div key={`${row.first_role}-${row.first_champion}-${row.second_role}-${row.second_champion}`} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="font-medium">{row.first_champion} <span className="font-normal text-[var(--workspace-subtle)]">+</span> {row.second_champion}</div>
                <div className="mt-1 text-xs text-[var(--workspace-subtle)]">{roleLabels[row.first_role]} + {roleLabels[row.second_role]}</div>
                <EvidenceMeta row={row} />
              </div>
              <div className="md:text-right">
                <div className="ss-mono font-semibold">{rate(row.wins, row.games)}</div>
                <div className="text-xs text-[var(--workspace-subtle)]">saved-result win rate</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="p-5 text-sm text-[var(--workspace-muted)]">No qualifying combinations match this view.</p>
      )}
    </DataSurface>
  );
}

function average(total: number | null, samples: number) {
  return total !== null && samples ? (total / samples).toFixed(1) : "Unavailable";
}

function PlayerCoverage({ row }: { row: PlayerEvidenceRow }) {
  const values = [
    ["KDA", Math.min(row.kills_samples, row.deaths_samples, row.assists_samples)],
    ["CS", row.cs_samples],
    ["Gold", row.gold_samples],
    ["Damage", row.damage_samples],
    ["Vision", row.vision_samples],
  ] as const;
  return <div className="mt-3 flex flex-wrap gap-2">{values.map(([label, samples]) => <span key={label} className={cn("border px-2 py-1 text-xs", samples ? "border-[var(--workspace-rule-strong)] text-[var(--workspace-muted)]" : "border-[var(--workspace-rule)] text-[var(--workspace-subtle)]")}>{label} {samples}/{row.games}</span>)}</div>;
}

function PlayerView({ data, query }: { data: CompetitiveDraftAnalytics; query: string }) {
  const rows = data.players.filter((row) => row.player_name.toLowerCase().includes(query.toLowerCase()));
  if (!rows.length) return <WorkspaceState icon={Users} title="No player contribution evidence" description="Participant rows must be assigned to the team side and contain a champion and role." />;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {rows.map((row) => {
        const kdaSamples = Math.min(row.kills_samples, row.deaths_samples, row.assists_samples);
        const kda = kdaSamples ? ((row.total_kills || 0) + (row.total_assists || 0)) / Math.max(1, row.total_deaths || 0) : null;
        return (
          <DataSurface key={row.player_id || row.player_name} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">{row.player_name}</h3>
                <p className="mt-1 text-sm text-[var(--workspace-muted)]">{row.wins} wins from {row.games} saved-result games</p>
              </div>
              <span className="ss-mono text-lg font-semibold">{rate(row.wins, row.games)}</span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-px bg-[var(--workspace-rule)]">
              <div className="bg-[var(--workspace-surface)] p-3"><div className="ss-mono text-lg">{kda === null ? "—" : kda.toFixed(2)}</div><div className="mt-1 text-xs text-[var(--workspace-subtle)]">KDA ratio</div></div>
              <div className="bg-[var(--workspace-surface)] p-3"><div className="ss-mono text-lg">{average(row.total_cs, row.cs_samples)}</div><div className="mt-1 text-xs text-[var(--workspace-subtle)]">CS / game</div></div>
              <div className="bg-[var(--workspace-surface)] p-3"><div className="ss-mono text-lg">{average(row.total_vision, row.vision_samples)}</div><div className="mt-1 text-xs text-[var(--workspace-subtle)]">Vision / game</div></div>
            </div>
            <PlayerCoverage row={row} />
          </DataSurface>
        );
      })}
    </div>
  );
}

export function CompetitiveAnalyticsPanels({
  data,
  error,
  isLoading,
}: {
  data?: CompetitiveDraftAnalytics;
  error: Error | null;
  isLoading: boolean;
}) {
  const [view, setView] = useState<View>("champions");
  const [query, setQuery] = useState("");
  const views: Array<{ id: View; label: string; icon: typeof BarChart3 }> = [
    { id: "champions", label: "Champions", icon: BarChart3 },
    { id: "matchups", label: "Matchups", icon: Swords },
    { id: "duos", label: "Duos", icon: Users },
    { id: "players", label: "Players", icon: ShieldCheck },
    { id: "compositions", label: "Compositions", icon: Network },
  ];

  if (isLoading) return <WorkspaceState icon={BarChart3} title="Building draft evidence…" description="Aggregating qualifying participant and draft records inside this workspace." />;
  if (error || !data) return <WorkspaceState icon={BarChart3} title="Draft analytics unavailable" description="Draft analysis could not be loaded. No estimates or sample results are shown." />;

  return (
    <section className="space-y-5">
      <CoverageHeader data={data} />
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex gap-1 overflow-x-auto border border-[var(--workspace-rule)] p-1">
          {views.map(({ id, label, icon: Icon }) => (
            <Button key={id} size="sm" variant={view === id ? "secondary" : "ghost"} onClick={() => setView(id)} className="shrink-0">
              <Icon className="mr-1.5 h-4 w-4" />{label}
            </Button>
          ))}
        </div>
        {view !== "compositions" && (
          <label className="relative block w-full xl:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--workspace-subtle)]" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter this evidence view" className="pl-9" />
          </label>
        )}
      </div>
      {view === "champions" && <ChampionView data={data} query={query} />}
      {view === "matchups" && <MatchupView data={data} query={query} />}
      {view === "duos" && <DuoView data={data} query={query} />}
      {view === "players" && <PlayerView data={data} query={query} />}
      {view === "compositions" && (
        <WorkspaceState icon={Network} title="Composition identities are awaiting taxonomy coverage" description="This panel will activate only after every champion in a five-player draft is covered by the same versioned trait taxonomy. Partial drafts are not classified." />
      )}
    </section>
  );
}
