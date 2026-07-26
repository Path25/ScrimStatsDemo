import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { ChampionAvatar } from "@/components/scrims/ChampionAvatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { SoloQRecentMatch, SoloQScoreboardParticipant, SoloQTeamContext } from "@/types/soloq";

interface SoloQMatchRowProps {
  match: SoloQRecentMatch;
  selectedPuuid?: string | null;
}

function ItemBuild({ items, version }: { items: number[]; version: string | null }) {
  const patch = version?.split(".").slice(0, 2).join(".");
  if (!items.length) return <span className="text-xs text-[var(--workspace-subtle)]">Not supplied</span>;
  return (
    <div className="flex min-w-28 flex-wrap gap-1">
      {items.map((item, index) => patch ? (
        <img
          key={`${item}-${index}`}
          src={`https://ddragon.leagueoflegends.com/cdn/${patch}.1/img/item/${item}.png`}
          alt={`Item ${item}`}
          className="h-6 w-6 border border-[var(--workspace-rule)] bg-black/20"
          loading="lazy"
        />
      ) : <span key={`${item}-${index}`} className="ss-mono text-xs">{item}</span>)}
    </div>
  );
}

function TeamSummary({ team, participants }: { team?: SoloQTeamContext; participants: SoloQScoreboardParticipant[] }) {
  const teamKills = participants.reduce((sum, participant) => sum + participant.kills, 0);
  const objectives = team?.objectives || {};
  const fact = (key: string) => objectives[key]?.kills;
  const facts = [
    ["Kills", teamKills], ["Dragons", fact("dragon")], ["Barons", fact("baron")],
    ["Towers", fact("tower")], ["Inhibitors", fact("inhibitor")],
    ["Heralds", fact("riftHerald")], ["Grubs", fact("horde")],
  ].filter((entry) => entry[1] !== undefined);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[var(--workspace-rule)] px-4 py-3 text-xs">
      {facts.map(([label, value]) => <span key={String(label)}><strong className="ss-mono text-[var(--workspace-text)]">{value}</strong> <span className="text-[var(--workspace-subtle)]">{label}</span></span>)}
      {team?.bans?.length ? <span className="text-[var(--workspace-subtle)]">Bans: {team.bans.map((ban) => ban.championId).join(", ")}</span> : null}
    </div>
  );
}

function TeamScoreboard({
  label, participants, team, version, selectedPuuid,
}: {
  label: string;
  participants: SoloQScoreboardParticipant[];
  team?: SoloQTeamContext;
  version: string | null;
  selectedPuuid?: string | null;
}) {
  return (
    <section className="min-w-[52rem] flex-1 border border-[var(--workspace-rule)] bg-black/[0.06]">
      <div className="flex items-center justify-between px-4 py-3">
        <h4 className="text-sm font-semibold">{label} side</h4>
        <span className={`text-xs font-semibold uppercase tracking-[0.16em] ${team?.win ? "text-emerald-400" : "text-red-400"}`}>{team ? (team.win ? "Victory" : "Defeat") : "Result unavailable"}</span>
      </div>
      <TeamSummary team={team} participants={participants} />
      <table className="w-full text-left text-xs">
        <thead className="text-[var(--workspace-subtle)]">
          <tr><th className="px-4 py-2 font-medium">Player</th><th className="px-3 py-2 font-medium">KDA</th><th className="px-3 py-2 font-medium">CS</th><th className="px-3 py-2 font-medium">Gold</th><th className="px-3 py-2 font-medium">Damage</th><th className="px-3 py-2 font-medium">Vision</th><th className="px-3 py-2 font-medium">Build</th></tr>
        </thead>
        <tbody>
          {participants.map((participant) => (
            <tr key={participant.puuid} className={`border-t border-[var(--workspace-rule)] ${participant.puuid === selectedPuuid ? "bg-[var(--workspace-accent-soft)]" : ""}`}>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <ChampionAvatar championName={participant.championName} size="sm" className="rounded-none" />
                  <div><p className="font-medium text-[var(--workspace-text)]">{participant.riotName}{participant.riotTag ? `#${participant.riotTag}` : ""}</p><p className="mt-0.5 text-[var(--workspace-subtle)]">{participant.championName} · {participant.role || "Role unavailable"}</p></div>
                </div>
              </td>
              <td className="ss-mono px-3 py-2.5">{participant.kills}/{participant.deaths}/{participant.assists}</td>
              <td className="ss-mono px-3 py-2.5">{participant.cs}</td>
              <td className="ss-mono px-3 py-2.5">{participant.gold.toLocaleString()}</td>
              <td className="ss-mono px-3 py-2.5">{participant.damage.toLocaleString()}</td>
              <td className="ss-mono px-3 py-2.5">{participant.vision}</td>
              <td className="px-3 py-2.5"><ItemBuild items={participant.items} version={version} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function SoloQMatchRow({ match, selectedPuuid }: SoloQMatchRowProps) {
  const [open, setOpen] = useState(false);
  const minutes = Math.max(1, match.game_duration_seconds / 60);
  const context = match.match_context;
  const blue = context?.participants?.filter((participant) => participant.teamId === 100) || [];
  const red = context?.participants?.filter((participant) => participant.teamId === 200) || [];
  const hasScoreboard = blue.length > 0 || red.length > 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={`border-l-2 ${match.win ? "border-l-emerald-400" : "border-l-red-400"}`}>
        <CollapsibleTrigger asChild>
          <button type="button" className="grid w-full gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.025] sm:grid-cols-[minmax(12rem,1.2fr)_repeat(4,minmax(5rem,0.6fr))_2rem] sm:items-center" aria-label={`${open ? "Collapse" : "Expand"} ${match.champion_name} match details`}>
            <div className="flex items-center gap-3">
              <ChampionAvatar championName={match.champion_name} size="md" className="rounded-none" />
              <div><p className="text-sm font-semibold">{match.champion_name}</p><p className="mt-1 text-xs text-[var(--workspace-subtle)]">{match.win ? "Victory" : "Defeat"} · {match.team_position || "Role unavailable"} · {Math.round(minutes)}m</p></div>
            </div>
            <div><p className="workspace-eyebrow">KDA</p><p className="mt-1 ss-mono text-sm">{match.kills}/{match.deaths}/{match.assists}</p></div>
            <div><p className="workspace-eyebrow">CS/min</p><p className="mt-1 ss-mono text-sm">{(match.cs / minutes).toFixed(1)}</p></div>
            <div><p className="workspace-eyebrow">Vision/min</p><p className="mt-1 ss-mono text-sm">{(match.vision_score / minutes).toFixed(1)}</p></div>
            <div><p className="workspace-eyebrow">Played</p><p className="mt-1 text-sm">{new Date(match.played_at).toLocaleDateString()}</p></div>
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {hasScoreboard ? (
            <div className="overflow-x-auto border-t border-[var(--workspace-rule)] p-4">
              <div className="flex min-w-max gap-4">
                <TeamScoreboard label="Blue" participants={blue} team={context.teams?.find((team) => team.teamId === 100)} version={match.game_version} selectedPuuid={selectedPuuid} />
                <TeamScoreboard label="Red" participants={red} team={context.teams?.find((team) => team.teamId === 200)} version={match.game_version} selectedPuuid={selectedPuuid} />
              </div>
            </div>
          ) : <p className="border-t border-[var(--workspace-rule)] px-5 py-4 text-sm text-[var(--workspace-muted)]">Full scoreboard context will be added when this cached match is reconciled on the next synchronization.</p>}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
