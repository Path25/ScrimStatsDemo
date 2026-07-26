export type DraftSide = "blue" | "red";
export type DraftOwner = "ours" | "opponent";
export type DraftActionType = "pick" | "ban";
export type DraftPhase = "ban_1" | "pick_1" | "ban_2" | "pick_2";

export interface DraftSequenceSlot {
  sequence: number;
  colour: DraftSide;
  actionType: DraftActionType;
  phase: DraftPhase;
}

const colours: DraftSide[] = [
  "blue", "red", "blue", "red", "blue", "red",
  "blue", "red", "red", "blue", "blue", "red",
  "red", "blue", "red", "blue",
  "red", "blue", "blue", "red",
];

export const DRAFT_SEQUENCE: DraftSequenceSlot[] = colours.map((colour, index) => {
  const sequence = index + 1;
  const actionType: DraftActionType = sequence <= 6 || (sequence >= 13 && sequence <= 16) ? "ban" : "pick";
  const phase: DraftPhase = sequence <= 6 ? "ban_1" : sequence <= 12 ? "pick_1" : sequence <= 16 ? "ban_2" : "pick_2";
  return { sequence, colour, actionType, phase };
});

export interface DraftActionRecord {
  id: string;
  scenario_id: string;
  sequence_number: number;
  phase: string;
  team_side: DraftOwner;
  action_type: DraftActionType;
  champion_name: string;
  assigned_role: string | null;
  rationale: string;
}

export function sequenceSlot(sequence: number, ourSide: DraftSide) {
  const slot = DRAFT_SEQUENCE[sequence - 1];
  if (!slot) return null;
  return { ...slot, teamSide: slot.colour === ourSide ? "ours" as const : "opponent" as const };
}

export function validateDraftScenario(
  actions: DraftActionRecord[],
  ourSide: DraftSide,
  restrictions: string[] = [],
) {
  const issues: string[] = [];
  const names = new Map<string, number>();
  const restricted = new Set(restrictions.map((name) => name.trim().toLocaleLowerCase()));
  const ourRoles = new Set<string>();

  for (const action of actions) {
    const expected = sequenceSlot(action.sequence_number, ourSide);
    if (!expected) {
      issues.push(`Action ${action.sequence_number} is outside the tournament sequence.`);
      continue;
    }
    if (expected.actionType !== action.action_type || expected.teamSide !== action.team_side) {
      issues.push(`Action ${action.sequence_number} does not match the expected ${expected.colour} ${expected.actionType}.`);
    }
    const champion = action.champion_name.trim().toLocaleLowerCase();
    names.set(champion, (names.get(champion) || 0) + 1);
    if (restricted.has(champion)) issues.push(`${action.champion_name} is unavailable for this series game.`);
    if (action.action_type === "ban" && action.assigned_role) issues.push(`${action.champion_name} is a ban and cannot have a role.`);
    if (action.action_type === "pick" && action.team_side === "ours" && action.assigned_role) {
      if (ourRoles.has(action.assigned_role)) issues.push(`The ${action.assigned_role} role is assigned more than once.`);
      ourRoles.add(action.assigned_role);
    }
  }
  for (const [champion, count] of names) if (count > 1) issues.push(`${champion} appears more than once.`);
  if (actions.length < 20) issues.push(`${20 - actions.length} draft actions remain.`);
  if (ourRoles.size < 5) issues.push(`${5 - ourRoles.size} team role assignments remain.`);
  return [...new Set(issues)];
}

export interface DraftWorkspaceDataset {
  contract_version: string;
  playbooks: DraftPlaybook[];
  plans: DraftPlan[];
  scenarios: DraftScenario[];
  actions: DraftActionRecord[];
  restrictions: DraftRestriction[];
  opponents: Array<{ id: string; name: string }>;
  fixtures: Array<{ id: string; opponent_name: string; opponent_team_id: string | null; starts_at: string; format: string | null }>;
  external_drafts: ExternalDraftEvidence[];
  team_drafts: TeamDraftEvidence[];
  players: DraftPlayer[];
  champion_pools: ChampionPoolEvidence[];
  scouting_evidence: ScoutingDraftEvidence[];
  linked_player_id: string | null;
}

export interface DraftPlaybook {
  id: string; tenant_id: string; title: string; description: string; patch_label: string | null;
  preferred_side: "blue" | "red" | "either"; composition_identity: string | null; priorities: unknown;
  role_assignments: unknown; flex_picks: unknown; execution_goals: unknown; vulnerabilities: unknown;
  contingency_notes: string; tags: unknown; status: "draft" | "published" | "archived"; revision: number;
  parent_playbook_id: string | null; snapshot: unknown; created_by: string; published_by: string | null;
  created_at: string; updated_at: string; published_at: string | null; archived_at: string | null;
}

export interface DraftPlan {
  id: string; tenant_id: string; opponent_team_id: string; scrim_id: string | null; title: string;
  scheduled_for: string | null; patch_label: string | null; status: "draft" | "published" | "archived";
  revision: number; parent_brief_id: string | null; executive_summary: string; priorities: unknown;
  snapshot: unknown; created_at: string; updated_at: string; published_at: string | null;
  draft_format: "standard" | "series_restricted"; series_game_number: number;
  preferred_side: "blue" | "red" | "either"; source_playbook_id: string | null;
}

export interface DraftScenario {
  id: string; tenant_id: string; brief_id: string | null; playbook_id: string | null;
  parent_scenario_id: string | null; branch_sequence: number | null; name: string;
  side: "blue" | "red" | "either"; rationale: string; contingency_notes: string;
  status: "draft" | "published" | "archived"; created_at: string; updated_at: string;
}

export interface DraftRestriction { id: string; brief_id: string; champion_name: string; source_game_number: number | null; reason: string; }
export interface ExternalDraftEvidence { id: string; opponent_team_id: string; blue_team: string; red_team: string; blue_picks: unknown; red_picks: unknown; blue_bans: unknown; red_bans: unknown; patch: string | null; played_at: string | null; tournament: string | null; source_url: string; }
export interface TeamDraftEvidence { id: string; scrim_game_id: string; draft_data: unknown; completed_at: string | null; opponent_name: string; played_at: string | null; }
export interface DraftPlayer { id: string; name: string; role: string | null; linked_user_id: string | null; main_champions: unknown; }
export interface ChampionPoolEvidence { id: string; player_id: string; champion_name: string; role: string; comfort_level: number; priority: number; games_played: number; win_rate: number | null; }
export interface ScoutingDraftEvidence { id: string; opponent_team_id: string; title: string; observation: string; evidence_type: string; confidence: number; observed_at: string; }

function names(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => typeof item === "string" ? [item] : item && typeof item === "object" && "champion" in item && typeof item.champion === "string" ? [item.champion] : []);
}

export interface DraftEvidenceInsight {
  id: string; title: string; detail: string; samples: number; dateLabel: string; kind: "opponent" | "team" | "pool" | "scouting";
}

export function draftEvidenceInsights(dataset: DraftWorkspaceDataset, opponentId?: string, tournament?: string): DraftEvidenceInsight[] {
  const insights: DraftEvidenceInsight[] = [];
  const external = dataset.external_drafts.filter((game) =>
    (!opponentId || game.opponent_team_id === opponentId)
    && (!tournament || game.tournament === tournament),
  );
  const counts = new Map<string, number>();
  for (const game of external) for (const champion of [...names(game.blue_picks), ...names(game.red_picks)]) counts.set(champion, (counts.get(champion) || 0) + 1);
  for (const [champion, samples] of [...counts].sort((a, b) => b[1] - a[1]).slice(0, 3)) {
    insights.push({ id: `opponent-${champion}`, title: `${champion} appears frequently`, detail: `Observed in ${samples} of ${external.length} imported opponent drafts.`, samples, dateLabel: tournament || "All imported splits", kind: "opponent" });
  }
  const pools = dataset.champion_pools.filter((pool) => pool.priority >= 4 || pool.comfort_level >= 8);
  if (pools.length) insights.push({ id: "pool-priority", title: "Declared comfort pool available", detail: `${pools.length} high-priority or high-comfort player–champion entries can be checked against the plan.`, samples: pools.length, dateLabel: "Roster declarations", kind: "pool" });
  if (dataset.team_drafts.length) insights.push({ id: "team-history", title: "Team draft history available", detail: `${dataset.team_drafts.length} saved game drafts can be used for factual comparison.`, samples: dataset.team_drafts.length, dateLabel: "Saved scrim drafts", kind: "team" });
  for (const evidence of dataset.scouting_evidence.filter((item) => !opponentId || item.opponent_team_id === opponentId).slice(0, 3)) {
    insights.push({ id: `scouting-${evidence.id}`, title: evidence.title, detail: evidence.observation, samples: 1, dateLabel: new Date(evidence.observed_at).toLocaleDateString(), kind: "scouting" });
  }
  return insights;
}
