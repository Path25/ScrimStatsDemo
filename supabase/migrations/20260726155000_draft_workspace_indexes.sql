create index if not exists draft_playbooks_created_by_idx on public.draft_playbooks(created_by);
create index if not exists draft_playbooks_published_by_idx on public.draft_playbooks(published_by) where published_by is not null;
create index if not exists draft_playbooks_parent_idx on public.draft_playbooks(parent_playbook_id) where parent_playbook_id is not null;

create index if not exists draft_plan_restrictions_brief_tenant_idx on public.draft_plan_restrictions(brief_id, tenant_id);
create index if not exists draft_plan_restrictions_created_by_idx on public.draft_plan_restrictions(created_by);
create index if not exists draft_audit_events_actor_idx on public.draft_audit_events(actor_id);

create index if not exists draft_actions_scenario_tenant_idx on public.draft_scenario_actions(scenario_id, tenant_id);
create index if not exists draft_scenarios_brief_tenant_idx on public.draft_scenarios(brief_id, tenant_id) where brief_id is not null;
create index if not exists draft_scenarios_parent_tenant_idx on public.draft_scenarios(parent_scenario_id, tenant_id) where parent_scenario_id is not null;
create index if not exists draft_scenarios_playbook_tenant_idx on public.draft_scenarios(playbook_id, tenant_id) where playbook_id is not null;
