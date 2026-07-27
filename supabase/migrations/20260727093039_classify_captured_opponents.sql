update public.scrim_participants participant
set identity_status = 'ignored',
    updated_at = now()
where participant.is_our_team = false
  and participant.player_id is null
  and participant.identity_status in ('unresolved', 'ambiguous')
  and exists (
    select 1
    from public.scrim_game_evidence evidence
    where evidence.scrim_game_id = participant.scrim_game_id
      and evidence.provider = 'desktop_collector'
  );
