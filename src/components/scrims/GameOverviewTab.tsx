import { BarChart3, Clock3, Coins, Map, Shield, Swords, Target, Users } from "lucide-react";

import { DataSurface } from "@/components/workspace/DataSurface";
import { ItemBuild } from "@/components/scrims/ItemBuild";
import { SourceBadge } from "@/components/workspace/SourceBadge";
import { formatGameDuration } from "@/lib/scrim-review";
import type { ScrimGame, ScrimParticipant } from "@/types/scrimGame";

interface GameOverviewTabProps {
  game: ScrimGame;
  participants: ScrimParticipant[];
}

function recordedNumber(value: number | null | undefined, suffix = "") {
  return value === null || value === undefined ? "Not recorded" : `${value.toLocaleString()}${suffix}`;
}

function ParticipantLedger({
  label,
  participants,
}: {
  label: string;
  participants: ScrimParticipant[];
}) {
  return (
    <DataSurface>
      <div className="flex items-center justify-between border-b border-[var(--workspace-rule)] px-5 py-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[var(--workspace-accent)]" />
          <h3 className="font-semibold">{label}</h3>
        </div>
        <span className="ss-mono text-xs text-[var(--workspace-subtle)]">
          {participants.length} players
        </span>
      </div>
      {participants.length ? (
        <div className="divide-y divide-[var(--workspace-rule)]">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="workspace-ledger-row grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{participant.summoner_name || "Unnamed player"}</p>
                <p className="mt-1 text-sm capitalize text-[var(--workspace-muted)]">
                  {participant.champion_name || "Champion not recorded"} ·{" "}
                  {participant.role || "role not recorded"}
                </p>
              </div>
              <div>
                <p className="workspace-eyebrow text-[var(--workspace-subtle)]">KDA</p>
                <p className="ss-mono mt-1 text-sm">
                  {participant.kills ?? "—"}/{participant.deaths ?? "—"}/{participant.assists ?? "—"}
                </p>
              </div>
              <div className="grid grid-cols-4 gap-4 sm:text-right">
                <div>
                  <p className="workspace-eyebrow text-[var(--workspace-subtle)]">CS</p>
                  <p className="ss-mono mt-1 text-sm">{recordedNumber(participant.cs)}</p>
                </div>
                <div>
                  <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Gold</p>
                  <p className="ss-mono mt-1 text-sm">{recordedNumber(participant.gold)}</p>
                </div>
                <div>
                  <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Damage</p>
                  <p className="ss-mono mt-1 text-sm">{recordedNumber(participant.damage_dealt)}</p>
                </div>
                <div>
                  <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Vision</p>
                  <p className="ss-mono mt-1 text-sm">{recordedNumber(participant.vision_score)}</p>
                </div>
              </div>
              <div className="border-t border-[var(--workspace-rule)] pt-3 sm:col-span-3">
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--workspace-subtle)]">
                  <span>Level {recordedNumber(participant.level)}</span>
                  <span>
                    Spells: {participant.summoner_spells.length
                      ? participant.summoner_spells.map((spell) => spell.name).join(" + ")
                      : "Not recorded"}
                  </span>
                  <span>
                    Runes: {[participant.runes.primary_tree, participant.runes.secondary_tree].filter(Boolean).join(" + ") || "Not recorded"}
                  </span>
                </div>
                <ItemBuild items={participant.items} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-5 py-6 text-sm text-[var(--workspace-muted)]">
          Participant statistics were not captured for this game.
        </p>
      )}
    </DataSurface>
  );
}

function PhaseRating({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div>
      <p className="workspace-eyebrow text-[var(--workspace-subtle)]">{label}</p>
      <p className="ss-mono mt-2 text-lg">{value ? `${value}/5` : "Not recorded"}</p>
    </div>
  );
}

export function GameOverviewTab({ game, participants }: GameOverviewTabProps) {
  const ourTeam = participants.filter((participant) => participant.is_our_team);
  const opponent = participants.filter((participant) => !participant.is_our_team);
  const source =
    game.desktop_session_id || game.external_game_id || game.auto_created ? "collector" : "manual";
  const objectiveRows = [
    ["Towers", game.objectives.towers],
    ["Inhibitors", game.objectives.inhibitors],
    ["Dragons", game.objectives.dragons],
    ["Baron / Herald", game.objectives.barons],
  ] as const;
  const hasObjectives = objectiveRows.some(([, rows]) => rows.length > 0);

  return (
    <div className="space-y-5">
      <DataSurface>
        <div className="grid gap-5 p-5 sm:grid-cols-2 xl:grid-cols-5">
          <div className="flex gap-3">
            <Swords className="mt-0.5 h-5 w-5 text-[var(--workspace-accent)]" />
            <div>
              <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Outcome</p>
              <p className="mt-2 text-lg font-semibold capitalize">{game.result || "Not recorded"}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Shield className="mt-0.5 h-5 w-5 text-[var(--workspace-subtle)]" />
            <div>
              <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Our side</p>
              <p className="mt-2 text-lg capitalize">{game.side ? `${game.side} side` : "Not recorded"}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <BarChart3 className="mt-0.5 h-5 w-5 text-[var(--workspace-subtle)]" />
            <div>
              <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Kills</p>
              <p className="ss-mono mt-2 text-lg">
                {game.our_team_kills === null || game.our_team_kills === undefined ||
                game.enemy_team_kills === null || game.enemy_team_kills === undefined
                  ? "Not recorded"
                  : `${game.our_team_kills}–${game.enemy_team_kills}`}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Coins className="mt-0.5 h-5 w-5 text-[var(--workspace-subtle)]" />
            <div>
              <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Final gold</p>
              <p className="ss-mono mt-2 text-lg">
                {game.our_team_gold === null || game.our_team_gold === undefined ||
                game.enemy_team_gold === null || game.enemy_team_gold === undefined
                  ? "Not recorded"
                  : `${game.our_team_gold.toLocaleString()}–${game.enemy_team_gold.toLocaleString()}`}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Clock3 className="mt-0.5 h-5 w-5 text-[var(--workspace-subtle)]" />
            <div>
              <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Duration</p>
              <p className="ss-mono mt-2 text-lg">{formatGameDuration(game.duration_seconds)}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-[var(--workspace-rule)] px-5 py-3">
          <span className="workspace-eyebrow text-[var(--workspace-subtle)]">Evidence source</span>
          <SourceBadge source={source} compact />
          {(game.game_mode || game.map_name) && (
            <span className="ml-auto flex items-center gap-2 text-xs text-[var(--workspace-muted)]">
              <Map className="h-3.5 w-3.5" />
              {[game.game_mode, game.map_name].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>
      </DataSurface>

      {hasObjectives && (
        <DataSurface>
          <div className="flex items-center gap-2 border-b border-[var(--workspace-rule)] px-5 py-4">
            <Target className="h-4 w-4 text-[var(--workspace-accent)]" />
            <h3 className="font-semibold">Objective record</h3>
          </div>
          <div className="grid gap-px bg-[var(--workspace-rule)] sm:grid-cols-2 xl:grid-cols-4">
            {objectiveRows.map(([label, rows]) => {
              const ours = rows.filter((row) => row.team === "our").length;
              const enemy = rows.filter((row) => row.team === "enemy").length;
              return (
                <div key={label} className="bg-[var(--workspace-surface)] p-4">
                  <p className="workspace-eyebrow text-[var(--workspace-subtle)]">{label}</p>
                  <p className="ss-mono mt-2 text-lg">{ours}–{enemy}</p>
                  <p className="mt-1 text-xs text-[var(--workspace-muted)]">Our team · Opponent</p>
                </div>
              );
            })}
          </div>
        </DataSurface>
      )}

      <DataSurface className="grid gap-5 p-5 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Overall performance</p>
          <p className="ss-mono mt-3 text-3xl">
            {game.performance_rating ? `${game.performance_rating}/5` : "Not recorded"}
          </p>
        </div>
        <div>
          <p className="workspace-eyebrow text-[var(--workspace-subtle)]">Team review</p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--workspace-muted)]">
            {game.performance_summary?.trim() || "Performance summary not recorded."}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 border-t border-[var(--workspace-rule)] pt-5 lg:col-span-2">
          <PhaseRating label="Early game" value={game.early_game_rating} />
          <PhaseRating label="Mid game" value={game.mid_game_rating} />
          <PhaseRating label="Late game" value={game.late_game_rating} />
        </div>
      </DataSurface>

      <div className="grid gap-5 xl:grid-cols-2">
        <ParticipantLedger label="Our roster" participants={ourTeam} />
        <ParticipantLedger label="Opponent" participants={opponent} />
      </div>
    </div>
  );
}
