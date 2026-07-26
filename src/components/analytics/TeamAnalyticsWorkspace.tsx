import { useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  DatabaseZap,
  LineChart as LineChartIcon,
  Network,
  ShieldCheck,
  Swords,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AnalyticsGameDrilldown } from "@/components/analytics/AnalyticsGameDrilldown";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataSurface } from "@/components/workspace/DataSurface";
import { MetricStrip } from "@/components/workspace/MetricStrip";
import { WorkspaceState } from "@/components/workspace/WorkspaceState";
import {
  draftAnalytics,
  filterTeamAnalytics,
  improvementComparison,
  playerAnalytics,
  summarizeTeamAnalytics,
  type DraftAnalyticsRow,
  type EvidenceCapability,
  type EvidenceProvider,
  type MetricValue,
  type TeamAnalyticsDataset,
  type TeamAnalyticsFilters,
  type TeamAnalyticsGame,
} from "@/lib/analytics/team-analytics";
import { cn } from "@/lib/utils";

type View = "overview" | "team" | "draft" | "players";

const providerLabels: Record<EvidenceProvider, string> = {
  desktop_collector: "Desktop Collector",
  grid: "GRID",
  manual: "Manual",
};

function percent(value: number, total: number) {
  return total ? `${Math.round((value / total) * 100)}%` : "Not recorded";
}

function decimal(value: number | null, digits = 1, suffix = "") {
  return value === null ? "Not recorded" : `${value.toFixed(digits)}${suffix}`;
}

function gamesForIds(dataset: TeamAnalyticsDataset, ids: string[]) {
  const wanted = new Set(ids);
  return dataset.games.filter((game) => wanted.has(game.id));
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-[var(--workspace-muted)]">
      {label}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="border-[var(--workspace-rule-strong)] bg-[var(--workspace-surface)]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </label>
  );
}

function AnalyticsFilters({
  dataset,
  filters,
  onChange,
}: {
  dataset: TeamAnalyticsDataset;
  filters: TeamAnalyticsFilters;
  onChange: (filters: TeamAnalyticsFilters) => void;
}) {
  const playerOptions = useMemo(() => playerAnalytics(dataset), [dataset]);
  const active = Object.values(filters).some(Boolean);
  return (
    <DataSurface className="p-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <FilterSelect label="Opponent" value={filters.opponentKey || "all"} onChange={(value) => onChange({ ...filters, opponentKey: value === "all" ? undefined : value })}>
          <SelectItem value="all">All opponents</SelectItem>
          {dataset.filter_options.opponents.map((option) => <SelectItem key={option.key} value={option.key}>{option.name}</SelectItem>)}
        </FilterSelect>
        <FilterSelect label="Side" value={filters.side || "all"} onChange={(value) => onChange({ ...filters, side: value === "all" ? undefined : value as "blue" | "red" })}>
          <SelectItem value="all">Both sides</SelectItem><SelectItem value="blue">Blue</SelectItem><SelectItem value="red">Red</SelectItem>
        </FilterSelect>
        <FilterSelect label="Format" value={filters.format || "all"} onChange={(value) => onChange({ ...filters, format: value === "all" ? undefined : value })}>
          <SelectItem value="all">All formats</SelectItem>
          {dataset.filter_options.formats.map((format) => <SelectItem key={format} value={format}>{format}</SelectItem>)}
        </FilterSelect>
        <FilterSelect label="Result" value={filters.result || "all"} onChange={(value) => onChange({ ...filters, result: value === "all" ? undefined : value as TeamAnalyticsFilters["result"] })}>
          <SelectItem value="all">All results</SelectItem><SelectItem value="win">Wins</SelectItem><SelectItem value="loss">Losses</SelectItem><SelectItem value="draw">Draws</SelectItem>
        </FilterSelect>
        <FilterSelect label="Patch" value={filters.patch || "all"} onChange={(value) => onChange({ ...filters, patch: value === "all" ? undefined : value })}>
          <SelectItem value="all">All patches</SelectItem>
          {dataset.filter_options.patches.map((patch) => <SelectItem key={patch} value={patch}>{patch}</SelectItem>)}
        </FilterSelect>
        <FilterSelect label="Capture" value={filters.provider || "all"} onChange={(value) => onChange({ ...filters, provider: value === "all" ? undefined : value as EvidenceProvider })}>
          <SelectItem value="all">All compatible evidence</SelectItem><SelectItem value="desktop_collector">Desktop Collector</SelectItem><SelectItem value="grid">GRID</SelectItem><SelectItem value="manual">Manual</SelectItem>
        </FilterSelect>
        <FilterSelect label="Evidence" value={filters.completeness || "all"} onChange={(value) => onChange({ ...filters, completeness: value === "all" ? undefined : value as "core" | "advanced" })}>
          <SelectItem value="all">Any completeness</SelectItem><SelectItem value="core">Core complete</SelectItem><SelectItem value="advanced">Advanced evidence</SelectItem>
        </FilterSelect>
        <FilterSelect label="Lineup" value={filters.playerId || "all"} onChange={(value) => onChange({ ...filters, playerId: value === "all" ? undefined : value })}>
          <SelectItem value="all">Any lineup</SelectItem>
          {playerOptions.map((player) => <SelectItem key={player.key} value={player.key}>{player.name}</SelectItem>)}
        </FilterSelect>
      </div>
      <div className="mt-3 flex items-center justify-between gap-4 border-t border-[var(--workspace-rule)] pt-3">
        <p className="text-xs leading-5 text-[var(--workspace-subtle)]">Every metric declares its own qualifying sample. Provider filters are diagnostic, not separate dashboards.</p>
        <Button size="sm" variant="ghost" disabled={!active} onClick={() => onChange({})}>Clear filters</Button>
      </div>
    </DataSurface>
  );
}

function TrendChart({ games }: { games: TeamAnalyticsGame[] }) {
  const points = [...games]
    .filter((game) => game.result === "win" || game.result === "loss")
    .sort((a, b) => a.played_at.localeCompare(b.played_at))
    .map((game, index, all) => {
      const window = all.slice(Math.max(0, index - 4), index + 1);
      const winRate = Math.round((window.filter((item) => item.result === "win").length / window.length) * 100);
      const killDifference = game.our_team_kills === null || game.enemy_team_kills === null ? null : game.our_team_kills - game.enemy_team_kills;
      return { id: game.id, date: new Date(game.played_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }), winRate, killDifference, opponent: game.opponent_name };
    });
  if (!points.length) return <WorkspaceState icon={LineChartIcon} title="No saved-result trend" description="Record explicit game outcomes to build the performance timeline." />;
  return (
    <DataSurface>
      <div className="border-b border-[var(--workspace-rule)] p-5">
        <h2 className="font-semibold">Performance timeline</h2>
        <p className="mt-1 text-sm text-[var(--workspace-muted)]">Five-game rolling win rate. Missing days are not interpolated.</p>
      </div>
      <div className="h-72 p-4" role="img" aria-label="Five-game rolling win rate chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 12, right: 16, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,.07)" vertical={false} />
            <XAxis dataKey="date" stroke="#73808a" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis domain={[0, 100]} stroke="#73808a" tickLine={false} axisLine={false} fontSize={11} tickFormatter={(value) => `${value}%`} />
            <Tooltip contentStyle={{ background: "#0c131a", border: "1px solid rgba(255,255,255,.12)", borderRadius: 0 }} formatter={(value: number) => [`${value}%`, "Rolling win rate"]} labelFormatter={(_, payload) => payload[0]?.payload?.opponent ? `vs ${payload[0].payload.opponent}` : ""} />
            <Line type="monotone" dataKey="winRate" stroke="#11e2d0" strokeWidth={2} dot={{ r: 3, fill: "#11e2d0" }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </DataSurface>
  );
}

function ImprovementPanel({ dataset }: { dataset: TeamAnalyticsDataset }) {
  const comparison = improvementComparison(dataset);
  if (!comparison.available) {
    return (
      <WorkspaceState
        icon={Activity}
        title="Improvement comparison needs more evidence"
        description={`${comparison.recordedGames} of ${comparison.requiredGames} saved-result games recorded. The comparison activates at two complete ten-game windows.`}
      />
    );
  }
  return (
    <DataSurface>
      <div className="border-b border-[var(--workspace-rule)] p-5">
        <p className="workspace-eyebrow">Improvement comparison</p>
        <h2 className="mt-2 font-semibold">Latest 10 vs previous 10</h2>
        <p className="mt-1 text-sm text-[var(--workspace-muted)]">Directional changes only; this view does not claim that one metric caused another.</p>
      </div>
      <div className="divide-y divide-[var(--workspace-rule)]">
        {comparison.metrics.map((item) => {
          const delta = item.recent.value === null || item.previous.value === null ? null : item.recent.value - item.previous.value;
          const positive = delta !== null && (item.inverse ? delta < 0 : delta > 0);
          const games = gamesForIds(dataset, [...new Set([...item.recent.gameIds, ...item.previous.gameIds])]);
          return (
            <div key={item.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
              <div><p className="text-sm font-medium">{item.label}</p><p className="mt-1 text-xs text-[var(--workspace-subtle)]">{item.recent.samples} recent · {item.previous.samples} previous samples</p></div>
              <span className="ss-mono text-sm">{decimal(item.previous.value, 1, item.suffix)}</span>
              <span className="ss-mono text-sm font-semibold">{decimal(item.recent.value, 1, item.suffix)}</span>
              <div className="flex items-center justify-end gap-2">
                <span className={cn("ss-mono min-w-16 text-right text-xs", delta === null ? "text-[var(--workspace-subtle)]" : positive ? "text-emerald-300" : delta === 0 ? "text-[var(--workspace-muted)]" : "text-rose-300")}>{delta === null ? "Not comparable" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}${item.suffix || ""}`}</span>
                <AnalyticsGameDrilldown games={games} title={item.label} label="Evidence" />
              </div>
            </div>
          );
        })}
      </div>
    </DataSurface>
  );
}

function OverviewView({ dataset }: { dataset: TeamAnalyticsDataset }) {
  const summary = summarizeTeamAnalytics(dataset);
  return (
    <div className="space-y-6">
      <MetricStrip items={[
        { label: "Saved record", value: summary.resultGames.length ? `${summary.wins}–${summary.losses}` : "Not recorded", detail: `${summary.resultGames.length} games with explicit outcomes` },
        { label: "Games analysed", value: summary.games.length, detail: `${summary.blocks} practice blocks` },
        { label: "Core completeness", value: summary.games.length ? percent(summary.coreComplete, summary.games.length) : "Not recorded", detail: `${summary.coreComplete}/${summary.games.length} with result, side, duration, and participants` },
        { label: "Average duration", value: decimal(summary.averageDuration.value, 1, " min"), detail: `${summary.averageDuration.samples} qualifying games` },
      ]} />
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <TrendChart games={summary.games} />
        <DataSurface>
          <div className="border-b border-[var(--workspace-rule)] p-5"><h2 className="font-semibold">Recent form</h2><p className="mt-1 text-sm text-[var(--workspace-muted)]">Latest five games with explicit saved outcomes.</p></div>
          {summary.recentForm.length ? <div className="divide-y divide-[var(--workspace-rule)]">{summary.recentForm.map((game) => <div key={game.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-4"><span className={cn("ss-mono grid h-7 w-7 place-items-center border text-xs", game.result === "win" ? "border-emerald-400/30 text-emerald-300" : "border-rose-400/30 text-rose-300")}>{game.result === "win" ? "W" : "L"}</span><div><p className="text-sm font-medium">vs {game.opponent_name}</p><p className="mt-1 text-xs text-[var(--workspace-subtle)]">{new Date(game.played_at).toLocaleDateString()} · {game.side ? `${game.side} side` : "Side not recorded"}</p></div><AnalyticsGameDrilldown games={[game]} title={`Game ${game.game_number} vs ${game.opponent_name}`} label="Review" /></div>)}</div> : <p className="p-5 text-sm text-[var(--workspace-muted)]">No saved results in this filter.</p>}
        </DataSurface>
      </div>
      <ImprovementPanel dataset={dataset} />
      <div className="grid gap-6 lg:grid-cols-2">
        <CoveragePanel dataset={dataset} />
        <DataSurface className="p-5">
          <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-[var(--workspace-accent)]" /><div><h2 className="font-semibold">Evidence boundary</h2><p className="mt-2 text-sm leading-6 text-[var(--workspace-muted)]">Shared metrics combine only equivalent factual fields. GRID movement and Desktop timeline analysis activate independently when their required evidence exists.</p><p className="mt-3 text-xs text-[var(--workspace-subtle)]">Active profile: {dataset.capture_profile === "grid_manual" ? "GRID + Manual" : "Desktop Collector + Manual"}. Historical evidence from either profile remains usable.</p></div></div>
        </DataSurface>
      </div>
    </div>
  );
}

const capabilityLabels: Record<EvidenceCapability, string> = {
  result: "Results", draft: "Draft", participant_stats: "Participants", timeline: "Timeline", objectives: "Objectives", position_samples: "Positions", movement_detail: "Movement", coach_review: "Coach review",
};

function CoveragePanel({ dataset }: { dataset: TeamAnalyticsDataset }) {
  const summary = summarizeTeamAnalytics(dataset);
  return <DataSurface><div className="border-b border-[var(--workspace-rule)] p-5"><h2 className="font-semibold">Data coverage</h2><p className="mt-1 text-sm text-[var(--workspace-muted)]">Capability availability across the current filtered sample.</p></div><div className="divide-y divide-[var(--workspace-rule)]">{summary.capabilityCounts.map((item) => <div key={item.capability} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3"><span className="text-sm">{capabilityLabels[item.capability]}</span><span className="ss-mono text-xs text-[var(--workspace-subtle)]">{item.games}/{summary.games.length}</span><span className="ss-mono w-12 text-right text-xs">{summary.games.length ? percent(item.games, summary.games.length) : "—"}</span></div>)}</div></DataSurface>;
}

function MetricCard({ title, metric, dataset, suffix = "" }: { title: string; metric: MetricValue; dataset: TeamAnalyticsDataset; suffix?: string }) {
  return <DataSurface className="p-5"><p className="workspace-eyebrow">{title}</p><p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{decimal(metric.value, 1, suffix)}</p><div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-[var(--workspace-subtle)]">{metric.samples} qualifying samples</span><AnalyticsGameDrilldown games={gamesForIds(dataset, metric.gameIds)} title={title} label="View games" /></div></DataSurface>;
}

function CapabilityModule({ title, capability, dataset, description }: { title: string; capability: EvidenceCapability; dataset: TeamAnalyticsDataset; description: string }) {
  const games = dataset.games.filter((game) => game.capabilities.includes(capability));
  return <DataSurface className="p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--workspace-muted)]">{games.length ? description : "Not available for this capture profile or filtered evidence."}</p></div>{games.length ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : <DatabaseZap className="h-5 w-5 text-[var(--workspace-subtle)]" />}</div><div className="mt-4 flex items-center justify-between border-t border-[var(--workspace-rule)] pt-3"><span className="ss-mono text-xs text-[var(--workspace-subtle)]">{games.length} qualifying games</span><AnalyticsGameDrilldown games={games} title={title} label="Evidence" /></div></DataSurface>;
}

function TeamView({ dataset }: { dataset: TeamAnalyticsDataset }) {
  const summary = summarizeTeamAnalytics(dataset);
  return <div className="space-y-6"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><MetricCard title="Kill differential" metric={summary.averageKillDifferential} dataset={dataset} /><MetricCard title="Final gold differential" metric={summary.averageGoldDifferential} dataset={dataset} /><MetricCard title="Coach rating" metric={summary.performance} dataset={dataset} suffix="/5" /><MetricCard title="Game duration" metric={summary.averageDuration} dataset={dataset} suffix=" min" /></div><div className="grid gap-6 xl:grid-cols-2"><DataSurface><div className="border-b border-[var(--workspace-rule)] p-5"><h2 className="font-semibold">Side performance</h2><p className="mt-1 text-sm text-[var(--workspace-muted)]">Only games with explicit side and result.</p></div>{[["Blue", summary.blue], ["Red", summary.red]].map(([label, rows]) => { const games = rows as TeamAnalyticsGame[]; const wins = games.filter((game) => game.result === "win").length; return <div key={label as string} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-[var(--workspace-rule)] px-5 py-4 last:border-0"><span className="text-sm font-medium">{label as string} side</span><span className="ss-mono text-sm">{percent(wins, games.length)}</span><AnalyticsGameDrilldown games={games} title={`${label} side performance`} /></div>; })}</DataSurface><DataSurface><div className="border-b border-[var(--workspace-rule)] p-5"><h2 className="font-semibold">Coach phase ratings</h2><p className="mt-1 text-sm text-[var(--workspace-muted)]">Qualitative review evidence, kept separate from captured facts.</p></div>{[["Early game", summary.earlyGame], ["Mid game", summary.midGame], ["Late game", summary.lateGame]].map(([label, value]) => { const item = value as MetricValue; return <div key={label as string} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-[var(--workspace-rule)] px-5 py-4 last:border-0"><span className="text-sm font-medium">{label as string}</span><span className="ss-mono text-sm">{decimal(item.value, 1, "/5")}</span><AnalyticsGameDrilldown games={gamesForIds(dataset, item.gameIds)} title={`${label} ratings`} /></div>; })}</DataSurface></div><section><div className="mb-4"><p className="workspace-eyebrow">Advanced evidence</p><h2 className="mt-2 text-xl font-semibold">Source-capability modules</h2></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><CapabilityModule title="Objectives" capability="objectives" dataset={dataset} description="Objective records are available for factual sequencing and totals." /><CapabilityModule title="Riot timeline" capability="timeline" dataset={dataset} description="State and event timelines are available for future economy-state analysis." /><CapabilityModule title="GRID positions" capability="position_samples" dataset={dataset} description="Position observations are available for spatial analysis." /><CapabilityModule title="GRID movement" capability="movement_detail" dataset={dataset} description="Movement detail is available for advanced pathing analysis." /></div></section></div>;
}

function DraftRows({ rows, dataset, empty }: { rows: DraftAnalyticsRow[]; dataset: TeamAnalyticsDataset; empty: string }) {
  if (!rows.length) return <WorkspaceState icon={Swords} title={empty} description="Both champion identity and a saved result are required. Missing evidence is not inferred." />;
  return <DataSurface><div className="divide-y divide-[var(--workspace-rule)]">{rows.slice(0, 20).map((row) => <div key={row.key} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="text-sm font-medium">{row.label}</p><p className="mt-1 text-xs capitalize text-[var(--workspace-subtle)]">{row.detail} · {row.games} games</p></div><span className="ss-mono text-sm">{percent(row.wins, row.games)}</span><AnalyticsGameDrilldown games={gamesForIds(dataset, row.gameIds)} title={row.label} /></div>)}</div></DataSurface>;
}

function DraftView({ dataset }: { dataset: TeamAnalyticsDataset }) {
  const data = draftAnalytics(dataset);
  const [view, setView] = useState<"champions" | "matchups" | "duos" | "compositions">("champions");
  return <div className="space-y-5"><div className="flex gap-1 overflow-x-auto border border-[var(--workspace-rule)] p-1"><Button size="sm" variant={view === "champions" ? "secondary" : "ghost"} onClick={() => setView("champions")}>Champions</Button><Button size="sm" variant={view === "matchups" ? "secondary" : "ghost"} onClick={() => setView("matchups")}>Matchups</Button><Button size="sm" variant={view === "duos" ? "secondary" : "ghost"} onClick={() => setView("duos")}>Duos</Button><Button size="sm" variant={view === "compositions" ? "secondary" : "ghost"} onClick={() => setView("compositions")}>Compositions</Button></div>{view === "champions" && <DraftRows rows={data.champions} dataset={dataset} empty="No champion performance evidence" />}{view === "matchups" && <DraftRows rows={data.matchups} dataset={dataset} empty="No same-role matchup evidence" />}{view === "duos" && <DraftRows rows={data.duos} dataset={dataset} empty="No champion pairing evidence" />}{view === "compositions" && <WorkspaceState icon={Network} title="Composition identities await the versioned taxonomy" description="Complete five-player drafts will activate here only after the forthcoming JSON and champion taxonomy are mapped consistently." />}</div>;
}

function PlayersView({ dataset }: { dataset: TeamAnalyticsDataset }) {
  const rows = playerAnalytics(dataset);
  if (!rows.length) return <div className="space-y-5"><WorkspaceState icon={Users} title="Player analytics will appear here" description="Participant rows must be assigned to the team side before contribution metrics can be calculated." /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{["KDA", "CS/min", "Gold/min", "Damage share", "Vision/min"].map((metric) => <DataSurface key={metric} className="p-5"><p className="workspace-eyebrow">{metric}</p><p className="mt-3 text-2xl font-semibold text-[var(--workspace-subtle)]">Not recorded</p><p className="mt-2 text-xs leading-5 text-[var(--workspace-muted)]">Calculated per player from qualifying participant evidence.</p></DataSurface>)}</div></div>;
  return <div className="grid gap-4 xl:grid-cols-2">{rows.map((row) => <DataSurface key={row.key} className="p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{row.name}</h3><p className="mt-1 text-sm text-[var(--workspace-muted)]">{row.wins} wins · {row.games} games · {row.champions.slice(0, 3).map((item) => `${item.champion} ${item.games}`).join(" · ") || "Champion not recorded"}</p></div><AnalyticsGameDrilldown games={gamesForIds(dataset, row.gameIds)} title={`${row.name} games`} /></div><div className="mt-5 grid grid-cols-2 gap-px bg-[var(--workspace-rule)] sm:grid-cols-5">{[["KDA", row.kda, ""], ["CS/min", row.csPerMinute, ""], ["Gold/min", row.goldPerMinute, ""], ["Damage share", row.damageShare, "%"], ["Vision/min", row.visionPerMinute, ""]].map(([label, value, suffix]) => { const metricValue = value as MetricValue; return <div key={label as string} className="bg-[var(--workspace-surface)] p-3"><p className="ss-mono text-lg">{decimal(metricValue.value, 2, suffix as string)}</p><p className="mt-1 text-xs text-[var(--workspace-subtle)]">{label as string}</p><p className="mt-2 text-[10px] text-[var(--workspace-subtle)]">{metricValue.samples}/{row.games} samples</p></div>; })}</div></DataSurface>)}</div>;
}

export function TeamAnalyticsWorkspace({ dataset }: { dataset: TeamAnalyticsDataset }) {
  const [filters, setFilters] = useState<TeamAnalyticsFilters>({});
  const [view, setView] = useState<View>("overview");
  const filtered = useMemo(() => filterTeamAnalytics(dataset, filters), [dataset, filters]);
  const hasActiveFilters = Object.values(filters).some(Boolean);
  const hasHistory = dataset.games.length > 0;
  return (
    <div className="space-y-6">
      {!hasHistory && <DataSurface className="border-[var(--workspace-accent)]/30 p-5"><div className="flex items-start gap-3"><BarChart3 className="mt-0.5 h-5 w-5 text-[var(--workspace-accent)]" /><div><h2 className="font-semibold">Your analytics workspace is ready</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--workspace-muted)]">The sections below preview the team, draft, player, improvement, and evidence views that populate as completed games are recorded. Empty metrics remain visible and are never replaced with sample data.</p></div></div></DataSurface>}
      <AnalyticsFilters dataset={dataset} filters={filters} onChange={setFilters} />
      <div className="flex flex-col gap-3 border-b border-[var(--workspace-rule)] pb-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={view} onValueChange={(value) => setView(value as View)}>
          <TabsList className="grid h-auto w-full grid-cols-4 border border-[var(--workspace-rule)] bg-[var(--workspace-surface)] p-1 lg:w-auto">
            <TabsTrigger value="overview"><BarChart3 className="mr-2 h-4 w-4" />Overview</TabsTrigger><TabsTrigger value="team"><Swords className="mr-2 h-4 w-4" />Team</TabsTrigger><TabsTrigger value="draft"><Network className="mr-2 h-4 w-4" />Draft</TabsTrigger><TabsTrigger value="players"><Users className="mr-2 h-4 w-4" />Players</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="ss-mono text-xs uppercase tracking-[0.12em] text-[var(--workspace-subtle)]">{filtered.games.length} qualifying games</p>
      </div>
      {hasHistory && hasActiveFilters && !filtered.games.length && <WorkspaceState icon={BarChart3} title="No games match these filters" description="The analytical surfaces remain available below. Clear one or more filters to restore the recorded sample." action={<Button onClick={() => setFilters({})}>Clear filters</Button>} />}
      <div className={view === "overview" ? "block" : "hidden"}><OverviewView dataset={filtered} /></div><div className={view === "team" ? "block" : "hidden"}><TeamView dataset={filtered} /></div><div className={view === "draft" ? "block" : "hidden"}><DraftView dataset={filtered} /></div><div className={view === "players" ? "block" : "hidden"}><PlayersView dataset={filtered} /></div>
    </div>
  );
}
