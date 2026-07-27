alter table public.scrim_game_evidence
  drop constraint if exists scrim_game_evidence_capabilities_check;

alter table public.scrim_game_evidence
  add constraint scrim_game_evidence_capabilities_check
  check (capabilities <@ array[
    'result', 'draft', 'participant_stats', 'timeline', 'objectives',
    'position_samples', 'movement_detail', 'champion_select',
    'post_game_stats', 'coach_review'
  ]::text[]);

comment on constraint scrim_game_evidence_capabilities_check on public.scrim_game_evidence is
  'Allow-list of evidence available to product analytics; v4 adds transient League champion-select and post-game capture.';
