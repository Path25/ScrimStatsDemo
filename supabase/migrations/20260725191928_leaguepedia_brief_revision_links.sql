-- Preserve the selected imported draft evidence when staff create a new brief
-- revision. The source brief and its immutable snapshot remain untouched.
create or replace function public.create_preparation_brief_revision(p_brief_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_brief public.preparation_briefs%rowtype;
  revision_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required';
  end if;

  select * into source_brief
  from public.preparation_briefs
  where id = p_brief_id;

  if not found or source_brief.status = 'draft' then
    raise exception 'Only a published or archived brief can be revised';
  end if;

  if not public.user_has_tenant_role(
    source_brief.tenant_id,
    array['owner'::public.tenant_role, 'admin'::public.tenant_role]
  ) then
    raise exception 'Owner or admin access is required';
  end if;

  insert into public.preparation_briefs (
    tenant_id, opponent_team_id, scrim_id, title, scheduled_for, patch_label,
    revision, parent_brief_id, executive_summary, priorities, created_by
  ) values (
    source_brief.tenant_id, source_brief.opponent_team_id, source_brief.scrim_id,
    source_brief.title, source_brief.scheduled_for, source_brief.patch_label,
    source_brief.revision + 1, source_brief.id, source_brief.executive_summary,
    source_brief.priorities, (select auth.uid())
  ) returning id into revision_id;

  insert into public.preparation_brief_evidence (tenant_id, brief_id, evidence_id)
  select tenant_id, revision_id, evidence_id
  from public.preparation_brief_evidence
  where brief_id = source_brief.id;

  insert into public.preparation_brief_external_drafts (
    tenant_id, brief_id, external_draft_game_id, display_order
  )
  select tenant_id, revision_id, external_draft_game_id, display_order
  from public.preparation_brief_external_drafts
  where brief_id = source_brief.id;

  return revision_id;
end;
$$;

revoke all on function public.create_preparation_brief_revision(uuid)
  from public, anon;
grant execute on function public.create_preparation_brief_revision(uuid)
  to authenticated;
