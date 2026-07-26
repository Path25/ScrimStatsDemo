-- ScrimStats competitive platform foundation.
-- Additive migration: preserves existing tenants, scrims, players, and collector records.

create schema if not exists security;

create or replace function security.user_has_any_tenant_role(
  tenant_uuid uuid,
  required_roles public.tenant_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tenant_users membership
    where membership.user_id = (select auth.uid())
      and membership.tenant_id = tenant_uuid
      and membership.role = any(required_roles)
  );
$$;

revoke all on function security.user_has_any_tenant_role(uuid, public.tenant_role[])
  from public, anon, authenticated, service_role;

create or replace function public.user_has_tenant_role(
  tenant_uuid uuid,
  required_roles public.tenant_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select security.user_has_any_tenant_role(tenant_uuid, required_roles);
$$;

revoke all on function public.user_has_tenant_role(uuid, public.tenant_role[]) from public, anon;
grant execute on function public.user_has_tenant_role(uuid, public.tenant_role[]) to authenticated;

create table if not exists public.tenant_feature_access (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  module_key text not null check (module_key in (
    'operations', 'analytics', 'scouting', 'draft_preparation', 'collector', 'discord'
  )),
  release_state text not null check (release_state in ('planned', 'beta', 'live')),
  is_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  primary key (tenant_id, module_key)
);

insert into public.tenant_feature_access (tenant_id, module_key, release_state, is_enabled)
select tenant.id, module.module_key, module.release_state, module.is_enabled
from public.tenants tenant
cross join (
  values
    ('operations', 'live', true),
    ('analytics', 'beta', true),
    ('scouting', 'beta', true),
    ('draft_preparation', 'planned', true),
    ('collector', 'live', true),
    ('discord', 'planned', true)
) as module(module_key, release_state, is_enabled)
on conflict (tenant_id, module_key) do nothing;

alter table public.tenant_feature_access enable row level security;
revoke all on table public.tenant_feature_access from public, anon;
grant select on table public.tenant_feature_access to authenticated;
grant select, insert, update, delete on table public.tenant_feature_access to service_role;

create policy "members read module availability"
on public.tenant_feature_access for select to authenticated
using (public.user_belongs_to_tenant(tenant_id));

create unique index if not exists opponent_teams_id_tenant_unique
  on public.opponent_teams(id, tenant_id);
create unique index if not exists scrims_id_tenant_unique
  on public.scrims(id, tenant_id);

alter table public.scrims
  add column if not exists opponent_team_id uuid;

alter table public.scrims
  drop constraint if exists scrims_opponent_team_tenant_fkey;

alter table public.scrims
  add constraint scrims_opponent_team_tenant_fkey
  foreign key (opponent_team_id, tenant_id)
  references public.opponent_teams(id, tenant_id)
  on delete set null (opponent_team_id);

create index if not exists scrims_opponent_team_id_idx on public.scrims(opponent_team_id);

create table if not exists public.scouting_evidence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  opponent_team_id uuid not null,
  scrim_id uuid,
  scrim_game_id uuid,
  source_kind text not null check (source_kind in ('manual', 'scrim', 'collector')),
  evidence_type text not null check (evidence_type in (
    'draft', 'champion_pool', 'playstyle', 'strength', 'risk', 'macro', 'review_note', 'other'
  )),
  title text not null check (char_length(trim(title)) between 1 and 120),
  observation text not null check (char_length(trim(observation)) between 1 and 4000),
  observed_at timestamptz not null default now(),
  game_time_seconds integer check (game_time_seconds is null or game_time_seconds >= 0),
  confidence smallint not null default 3 check (confidence between 1 and 5),
  sample_context text check (sample_context is null or char_length(sample_context) <= 300),
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scouting_evidence_opponent_tenant_fkey
    foreign key (opponent_team_id, tenant_id)
    references public.opponent_teams(id, tenant_id)
    on delete cascade,
  constraint scouting_evidence_scrim_fkey
    foreign key (scrim_id, tenant_id) references public.scrims(id, tenant_id) on delete set null (scrim_id),
  constraint scouting_evidence_game_fkey
    foreign key (scrim_game_id) references public.scrim_games(id) on delete set null,
  constraint scouting_evidence_source_consistency check (
    (source_kind = 'manual')
    or (source_kind = 'scrim' and scrim_id is not null)
    or (source_kind = 'collector' and scrim_id is not null and scrim_game_id is not null)
  )
);

create table if not exists public.scouting_tendencies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  opponent_team_id uuid not null,
  category text not null check (category in (
    'draft', 'champion_pool', 'playstyle', 'strength', 'risk', 'macro', 'other'
  )),
  title text not null check (char_length(trim(title)) between 1 and 120),
  summary text not null check (char_length(trim(summary)) between 1 and 2000),
  confidence smallint not null default 3 check (confidence between 1 and 5),
  status text not null default 'active' check (status in ('active', 'retired')),
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scouting_tendencies_opponent_tenant_fkey
    foreign key (opponent_team_id, tenant_id)
    references public.opponent_teams(id, tenant_id)
    on delete cascade
);

create table if not exists public.scouting_tendency_evidence (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  tendency_id uuid not null references public.scouting_tendencies(id) on delete cascade,
  evidence_id uuid not null references public.scouting_evidence(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tendency_id, evidence_id)
);

create table if not exists public.preparation_briefs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  opponent_team_id uuid not null,
  scrim_id uuid,
  title text not null check (char_length(trim(title)) between 1 and 140),
  scheduled_for timestamptz,
  patch_label text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  revision integer not null default 1 check (revision >= 1),
  parent_brief_id uuid references public.preparation_briefs(id) on delete set null,
  executive_summary text not null default '',
  priorities jsonb not null default '[]'::jsonb,
  snapshot jsonb,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint preparation_briefs_opponent_tenant_fkey
    foreign key (opponent_team_id, tenant_id)
    references public.opponent_teams(id, tenant_id)
    on delete cascade,
  constraint preparation_briefs_scrim_fkey
    foreign key (scrim_id) references public.scrims(id) on delete set null,
  constraint preparation_briefs_publish_consistency check (
    (status = 'published' and published_at is not null and snapshot is not null)
    or status <> 'published'
  )
);

create table if not exists public.preparation_brief_evidence (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  brief_id uuid not null references public.preparation_briefs(id) on delete cascade,
  evidence_id uuid not null references public.scouting_evidence(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (brief_id, evidence_id)
);

create table if not exists public.draft_scenarios (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  brief_id uuid not null references public.preparation_briefs(id) on delete cascade,
  parent_scenario_id uuid references public.draft_scenarios(id) on delete set null,
  name text not null check (char_length(trim(name)) between 1 and 100),
  side text not null check (side in ('blue', 'red', 'either')),
  rationale text not null default '',
  contingency_notes text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.draft_scenario_actions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  scenario_id uuid not null references public.draft_scenarios(id) on delete cascade,
  sequence_number smallint not null check (sequence_number between 1 and 40),
  phase text not null check (phase in ('ban_1', 'pick_1', 'ban_2', 'pick_2')),
  team_side text not null check (team_side in ('ours', 'opponent')),
  action_type text not null check (action_type in ('pick', 'ban', 'priority', 'response')),
  champion_name text not null check (char_length(trim(champion_name)) between 1 and 80),
  assigned_role text check (assigned_role in ('top', 'jungle', 'mid', 'adc', 'support')),
  rationale text not null default '',
  created_at timestamptz not null default now(),
  unique (scenario_id, sequence_number)
);

create table if not exists public.discord_installations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  guild_id text not null,
  guild_name text,
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked', 'error')),
  installed_by uuid not null,
  installed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.discord_channel_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  installation_id uuid not null references public.discord_installations(id) on delete cascade,
  channel_id text not null,
  channel_name text,
  event_type text not null check (event_type in (
    'schedule_created', 'schedule_changed', 'schedule_cancelled',
    'practice_reminder', 'availability_reminder', 'collector_reminder'
  )),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (installation_id, channel_id, event_type)
);

create table if not exists public.integration_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  event_type text not null,
  aggregate_type text not null,
  aggregate_id uuid,
  payload jsonb not null default '{}'::jsonb,
  dedupe_key text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'delivered', 'failed', 'cancelled')),
  available_at timestamptz not null default now(),
  attempt_count integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  unique (tenant_id, dedupe_key)
);

create table if not exists public.integration_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  event_id uuid not null references public.integration_events(id) on delete cascade,
  provider text not null check (provider in ('discord')),
  outcome text not null check (outcome in ('delivered', 'retry', 'failed')),
  provider_reference text,
  error_message text,
  attempted_at timestamptz not null default now()
);

create index if not exists scouting_evidence_tenant_opponent_idx
  on public.scouting_evidence(tenant_id, opponent_team_id, observed_at desc);
create index if not exists scouting_tendencies_tenant_opponent_idx
  on public.scouting_tendencies(tenant_id, opponent_team_id, status);
create index if not exists preparation_briefs_tenant_opponent_idx
  on public.preparation_briefs(tenant_id, opponent_team_id, status);
create index if not exists preparation_briefs_scrim_idx
  on public.preparation_briefs(scrim_id) where scrim_id is not null;
create index if not exists preparation_briefs_parent_idx
  on public.preparation_briefs(parent_brief_id) where parent_brief_id is not null;
create index if not exists scouting_evidence_scrim_idx
  on public.scouting_evidence(scrim_id) where scrim_id is not null;
create index if not exists scouting_evidence_game_idx
  on public.scouting_evidence(scrim_game_id) where scrim_game_id is not null;
create index if not exists scouting_tendency_evidence_evidence_idx
  on public.scouting_tendency_evidence(evidence_id);
create index if not exists preparation_brief_evidence_evidence_idx
  on public.preparation_brief_evidence(evidence_id);
create index if not exists draft_scenarios_tenant_brief_idx
  on public.draft_scenarios(tenant_id, brief_id);
create index if not exists draft_scenarios_parent_idx
  on public.draft_scenarios(parent_scenario_id) where parent_scenario_id is not null;
create index if not exists draft_scenario_actions_tenant_scenario_idx
  on public.draft_scenario_actions(tenant_id, scenario_id);
create index if not exists discord_channel_subscriptions_tenant_idx
  on public.discord_channel_subscriptions(tenant_id);
create index if not exists integration_events_tenant_status_idx
  on public.integration_events(tenant_id, status, available_at);
create index if not exists integration_delivery_attempts_event_idx
  on public.integration_delivery_attempts(event_id);
create index if not exists integration_events_ready_idx
  on public.integration_events(status, available_at) where status in ('pending', 'failed');

create unique index if not exists scouting_evidence_id_tenant_unique
  on public.scouting_evidence(id, tenant_id);
create unique index if not exists scouting_tendencies_id_tenant_unique
  on public.scouting_tendencies(id, tenant_id);
create unique index if not exists preparation_briefs_id_tenant_unique
  on public.preparation_briefs(id, tenant_id);
create unique index if not exists draft_scenarios_id_tenant_unique
  on public.draft_scenarios(id, tenant_id);

alter table public.scouting_tendency_evidence
  drop constraint if exists scouting_tendency_evidence_tendency_tenant_fkey,
  drop constraint if exists scouting_tendency_evidence_evidence_tenant_fkey,
  add constraint scouting_tendency_evidence_tendency_tenant_fkey
    foreign key (tendency_id, tenant_id)
    references public.scouting_tendencies(id, tenant_id) on delete cascade,
  add constraint scouting_tendency_evidence_evidence_tenant_fkey
    foreign key (evidence_id, tenant_id)
    references public.scouting_evidence(id, tenant_id) on delete cascade;

alter table public.preparation_brief_evidence
  drop constraint if exists preparation_brief_evidence_brief_tenant_fkey,
  drop constraint if exists preparation_brief_evidence_evidence_tenant_fkey,
  add constraint preparation_brief_evidence_brief_tenant_fkey
    foreign key (brief_id, tenant_id)
    references public.preparation_briefs(id, tenant_id) on delete cascade,
  add constraint preparation_brief_evidence_evidence_tenant_fkey
    foreign key (evidence_id, tenant_id)
    references public.scouting_evidence(id, tenant_id) on delete restrict;

alter table public.preparation_briefs
  drop constraint if exists preparation_briefs_scrim_fkey,
  drop constraint if exists preparation_briefs_scrim_tenant_fkey,
  drop constraint if exists preparation_briefs_parent_tenant_fkey,
  add constraint preparation_briefs_scrim_tenant_fkey
    foreign key (scrim_id, tenant_id)
    references public.scrims(id, tenant_id) on delete set null (scrim_id),
  add constraint preparation_briefs_parent_tenant_fkey
    foreign key (parent_brief_id, tenant_id)
    references public.preparation_briefs(id, tenant_id) on delete set null (parent_brief_id);

alter table public.draft_scenarios
  drop constraint if exists draft_scenarios_brief_tenant_fkey,
  drop constraint if exists draft_scenarios_parent_tenant_fkey,
  add constraint draft_scenarios_brief_tenant_fkey
    foreign key (brief_id, tenant_id)
    references public.preparation_briefs(id, tenant_id) on delete cascade,
  add constraint draft_scenarios_parent_tenant_fkey
    foreign key (parent_scenario_id, tenant_id)
    references public.draft_scenarios(id, tenant_id) on delete set null (parent_scenario_id);

alter table public.draft_scenario_actions
  drop constraint if exists draft_scenario_actions_scenario_tenant_fkey,
  add constraint draft_scenario_actions_scenario_tenant_fkey
    foreign key (scenario_id, tenant_id)
    references public.draft_scenarios(id, tenant_id) on delete cascade;

create or replace function public.validate_scouting_evidence_source()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.scrim_game_id is not null and not exists (
    select 1
    from public.scrim_games game
    where game.id = new.scrim_game_id
      and game.scrim_id = new.scrim_id
  ) then
    raise exception 'The selected game does not belong to the selected scrim';
  end if;
  if new.source_kind = 'collector' and not exists (
    select 1
    from public.scrim_games game
    where game.id = new.scrim_game_id
      and game.desktop_session_id is not null
  ) then
    raise exception 'Collector evidence must reference a collector-captured game';
  end if;
  return new;
end;
$$;

revoke execute on function public.validate_scouting_evidence_source() from public, anon, authenticated;
drop trigger if exists validate_scouting_evidence_source on public.scouting_evidence;
create trigger validate_scouting_evidence_source
before insert or update on public.scouting_evidence
for each row execute function public.validate_scouting_evidence_source();

alter table public.scouting_evidence enable row level security;
alter table public.scouting_tendencies enable row level security;
alter table public.scouting_tendency_evidence enable row level security;
alter table public.preparation_briefs enable row level security;
alter table public.preparation_brief_evidence enable row level security;
alter table public.draft_scenarios enable row level security;
alter table public.draft_scenario_actions enable row level security;
alter table public.discord_installations enable row level security;
alter table public.discord_channel_subscriptions enable row level security;
alter table public.integration_events enable row level security;
alter table public.integration_delivery_attempts enable row level security;

revoke all on table
  public.scouting_evidence,
  public.scouting_tendencies,
  public.scouting_tendency_evidence,
  public.preparation_briefs,
  public.preparation_brief_evidence,
  public.draft_scenarios,
  public.draft_scenario_actions,
  public.discord_installations,
  public.discord_channel_subscriptions,
  public.integration_events,
  public.integration_delivery_attempts
from public, anon;

grant select, insert, update, delete on table
  public.scouting_evidence,
  public.scouting_tendencies,
  public.scouting_tendency_evidence,
  public.preparation_briefs,
  public.preparation_brief_evidence,
  public.draft_scenarios,
  public.draft_scenario_actions
to authenticated;

grant select on table
  public.discord_installations,
  public.discord_channel_subscriptions,
  public.integration_events,
  public.integration_delivery_attempts
to authenticated;

grant select, insert, update, delete on table
  public.discord_installations,
  public.discord_channel_subscriptions,
  public.integration_events,
  public.integration_delivery_attempts
to service_role;

-- Replace permissive legacy scouting mutation policies.
drop policy if exists "Users can create opponent teams for their tenant" on public.opponent_teams;
drop policy if exists "Users can update opponent teams in their tenant" on public.opponent_teams;
drop policy if exists "Users can delete opponent teams in their tenant" on public.opponent_teams;
drop policy if exists "Users can create opponent players for their tenant teams" on public.opponent_players;
drop policy if exists "Users can update opponent players from their tenant teams" on public.opponent_players;
drop policy if exists "Users can delete opponent players from their tenant teams" on public.opponent_players;
drop policy if exists "Users can manage opponent champion pools for their tenant" on public.opponent_champion_pools;
drop policy if exists "Users can manage opponent drafts for their tenant" on public.opponent_drafts;
drop policy if exists "Users can manage opponent performance trends for their tenant" on public.opponent_performance_trends;
drop policy if exists "Users can manage opponent playstyle tags for their tenant" on public.opponent_playstyle_tags;
drop policy if exists "Users can manage strategic annotations for their tenant" on public.strategic_annotations;
drop policy if exists "Users can manage scouting timeline events for their tenant" on public.scouting_timeline_events;
drop policy if exists "Users can manage matchup matrix data for their tenant" on public.matchup_matrix_data;

create policy "staff create opponent teams"
on public.opponent_teams for insert to authenticated
with check (public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]));
create policy "staff update opponent teams"
on public.opponent_teams for update to authenticated
using (public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]))
with check (public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]));
create policy "staff delete opponent teams"
on public.opponent_teams for delete to authenticated
using (public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]));

create policy "staff create opponent players"
on public.opponent_players for insert to authenticated
with check (exists (
  select 1 from public.opponent_teams team
  where team.id = opponent_players.opponent_team_id
    and public.user_has_tenant_role(team.tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
));
create policy "staff update opponent players"
on public.opponent_players for update to authenticated
using (exists (
  select 1 from public.opponent_teams team
  where team.id = opponent_players.opponent_team_id
    and public.user_has_tenant_role(team.tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
))
with check (exists (
  select 1 from public.opponent_teams team
  where team.id = opponent_players.opponent_team_id
    and public.user_has_tenant_role(team.tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
));
create policy "staff delete opponent players"
on public.opponent_players for delete to authenticated
using (exists (
  select 1 from public.opponent_teams team
  where team.id = opponent_players.opponent_team_id
    and public.user_has_tenant_role(team.tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
));

create policy "staff read scouting evidence"
on public.scouting_evidence for select to authenticated
using (public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]));
create policy "staff create scouting evidence"
on public.scouting_evidence for insert to authenticated
with check (
  created_by = (select auth.uid())
  and public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
);
create policy "staff update scouting evidence"
on public.scouting_evidence for update to authenticated
using (public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]))
with check (public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]));
create policy "staff delete scouting evidence"
on public.scouting_evidence for delete to authenticated
using (public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]));

create policy "staff read scouting tendencies"
on public.scouting_tendencies for select to authenticated
using (public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]));
create policy "staff create scouting tendencies"
on public.scouting_tendencies for insert to authenticated
with check (
  created_by = (select auth.uid())
  and public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
);
create policy "staff update scouting tendencies"
on public.scouting_tendencies for update to authenticated
using (public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]))
with check (public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]));
create policy "staff delete scouting tendencies"
on public.scouting_tendencies for delete to authenticated
using (public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]));

create policy "staff read tendency evidence"
on public.scouting_tendency_evidence for select to authenticated
using (public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]));
create policy "staff create tendency evidence"
on public.scouting_tendency_evidence for insert to authenticated
with check (public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]));
create policy "staff delete tendency evidence"
on public.scouting_tendency_evidence for delete to authenticated
using (public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]));

create policy "members read published or staff read draft briefs"
on public.preparation_briefs for select to authenticated
using (
  public.user_belongs_to_tenant(tenant_id)
  and (
    status in ('published', 'archived')
    or public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
  )
);
create policy "staff create preparation briefs"
on public.preparation_briefs for insert to authenticated
with check (
  status = 'draft'
  and created_by = (select auth.uid())
  and public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
);
create policy "staff update draft preparation briefs"
on public.preparation_briefs for update to authenticated
using (
  status = 'draft'
  and public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
)
with check (
  public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
);
create policy "staff delete draft preparation briefs"
on public.preparation_briefs for delete to authenticated
using (
  status = 'draft'
  and public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
);

create policy "members read published brief evidence"
on public.preparation_brief_evidence for select to authenticated
using (exists (
  select 1 from public.preparation_briefs brief
  where brief.id = preparation_brief_evidence.brief_id
    and brief.tenant_id = preparation_brief_evidence.tenant_id
    and (
      brief.status in ('published', 'archived')
      or public.user_has_tenant_role(brief.tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
    )
));
create policy "staff create draft brief evidence"
on public.preparation_brief_evidence for insert to authenticated
with check (exists (
  select 1 from public.preparation_briefs brief
  where brief.id = preparation_brief_evidence.brief_id
    and brief.tenant_id = preparation_brief_evidence.tenant_id
    and brief.status = 'draft'
    and public.user_has_tenant_role(brief.tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
));
create policy "staff delete draft brief evidence"
on public.preparation_brief_evidence for delete to authenticated
using (exists (
  select 1 from public.preparation_briefs brief
  where brief.id = preparation_brief_evidence.brief_id
    and brief.tenant_id = preparation_brief_evidence.tenant_id
    and brief.status = 'draft'
    and public.user_has_tenant_role(brief.tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
));

create policy "members read published or staff read draft scenarios"
on public.draft_scenarios for select to authenticated
using (exists (
  select 1 from public.preparation_briefs brief
  where brief.id = draft_scenarios.brief_id
    and brief.tenant_id = draft_scenarios.tenant_id
    and (
      (brief.status in ('published', 'archived') and draft_scenarios.status in ('published', 'archived'))
      or public.user_has_tenant_role(brief.tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
    )
));
create policy "staff create draft scenarios"
on public.draft_scenarios for insert to authenticated
with check (
  created_by = (select auth.uid())
  and public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
);
create policy "staff update draft scenarios"
on public.draft_scenarios for update to authenticated
using (
  status = 'draft'
  and public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
)
with check (public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]));
create policy "staff delete draft scenarios"
on public.draft_scenarios for delete to authenticated
using (
  status = 'draft'
  and public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
);

create policy "members read published scenario actions"
on public.draft_scenario_actions for select to authenticated
using (exists (
  select 1
  from public.draft_scenarios scenario
  join public.preparation_briefs brief on brief.id = scenario.brief_id
  where scenario.id = draft_scenario_actions.scenario_id
    and scenario.tenant_id = draft_scenario_actions.tenant_id
    and (
      (scenario.status in ('published', 'archived') and brief.status in ('published', 'archived'))
      or public.user_has_tenant_role(scenario.tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
    )
));
create policy "staff create draft scenario actions"
on public.draft_scenario_actions for insert to authenticated
with check (exists (
  select 1 from public.draft_scenarios scenario
  where scenario.id = draft_scenario_actions.scenario_id
    and scenario.tenant_id = draft_scenario_actions.tenant_id
    and scenario.status = 'draft'
    and public.user_has_tenant_role(scenario.tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
));
create policy "staff update draft scenario actions"
on public.draft_scenario_actions for update to authenticated
using (exists (
  select 1 from public.draft_scenarios scenario
  where scenario.id = draft_scenario_actions.scenario_id
    and scenario.tenant_id = draft_scenario_actions.tenant_id
    and scenario.status = 'draft'
    and public.user_has_tenant_role(scenario.tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
))
with check (exists (
  select 1 from public.draft_scenarios scenario
  where scenario.id = draft_scenario_actions.scenario_id
    and scenario.tenant_id = draft_scenario_actions.tenant_id
    and scenario.status = 'draft'
    and public.user_has_tenant_role(scenario.tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
));
create policy "staff delete draft scenario actions"
on public.draft_scenario_actions for delete to authenticated
using (exists (
  select 1 from public.draft_scenarios scenario
  where scenario.id = draft_scenario_actions.scenario_id
    and scenario.tenant_id = draft_scenario_actions.tenant_id
    and scenario.status = 'draft'
    and public.user_has_tenant_role(scenario.tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
));

create policy "staff read discord installations"
on public.discord_installations for select to authenticated
using (public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]));
create policy "staff read discord channel subscriptions"
on public.discord_channel_subscriptions for select to authenticated
using (public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]));
create policy "staff read integration events"
on public.integration_events for select to authenticated
using (public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]));
create policy "staff read integration attempts"
on public.integration_delivery_attempts for select to authenticated
using (public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]));

create or replace function public.get_team_performance_summary(
  p_tenant_id uuid,
  p_date_from date default (current_date - 30),
  p_date_to date default current_date
)
returns jsonb
language sql
security invoker
set search_path = ''
stable
as $$
  with selected_scrims as (
    select
      scrim.id,
      scrim.opponent_name,
      scrim.format,
      scrim.data_source,
      scrim.match_date,
      scrim.status,
      scrim.result
    from public.scrims scrim
    where scrim.tenant_id = p_tenant_id
      and public.user_belongs_to_tenant(p_tenant_id)
      and scrim.match_date between p_date_from and p_date_to
  ),
  completed_games as (
    select
      game.id,
      game.scrim_id,
      game.result,
      game.side,
      game.desktop_session_id,
      game.status
    from public.scrim_games game
    join selected_scrims scrim on scrim.id = game.scrim_id
    where game.status = 'completed'
  ),
  games as (
    select *
    from completed_games
    where result in ('win', 'loss')
  ),
  participation as (
    select count(distinct participant.player_id) as player_count,
           count(*) as recorded_slots
    from public.scrim_participants participant
    join games game on game.id = participant.scrim_game_id
    where participant.is_our_team = true
  )
  select jsonb_build_object(
    'date_from', p_date_from,
    'date_to', p_date_to,
    'blocks', (select count(*) from selected_scrims),
    'recorded_games', (select count(*) from games),
    'excluded_games', (select count(*) from completed_games where result is null or result not in ('win', 'loss')),
    'wins', (select count(*) from games where result = 'win'),
    'losses', (select count(*) from games where result = 'loss'),
    'collector_games', (select count(*) from games where desktop_session_id is not null),
    'manual_games', (select count(*) from games where desktop_session_id is null),
    'blue', jsonb_build_object(
      'games', (select count(*) from games where lower(side) = 'blue'),
      'wins', (select count(*) from games where lower(side) = 'blue' and result = 'win')
    ),
    'red', jsonb_build_object(
      'games', (select count(*) from games where lower(side) = 'red'),
      'wins', (select count(*) from games where lower(side) = 'red' and result = 'win')
    ),
    'formats', coalesce((
      select jsonb_agg(jsonb_build_object('format', grouped.format, 'blocks', grouped.blocks) order by grouped.blocks desc)
      from (
        select coalesce(format, 'Unspecified') as format, count(*) as blocks
        from selected_scrims group by coalesce(format, 'Unspecified')
      ) grouped
    ), '[]'::jsonb),
    'opponents', coalesce((
      select jsonb_agg(jsonb_build_object('opponent', grouped.opponent_name, 'blocks', grouped.blocks) order by grouped.blocks desc)
      from (
        select opponent_name, count(*) as blocks
        from selected_scrims group by opponent_name order by count(*) desc limit 8
      ) grouped
    ), '[]'::jsonb),
    'participation', jsonb_build_object(
      'players', coalesce((select player_count from participation), 0),
      'recorded_slots', coalesce((select recorded_slots from participation), 0)
    )
  );
$$;

revoke execute on function public.get_team_performance_summary(uuid, date, date) from public, anon;
grant execute on function public.get_team_performance_summary(uuid, date, date) to authenticated;

create or replace function public.queue_scrim_integration_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_name text;
begin
  if tg_op = 'INSERT' then
    event_name := 'schedule_created';
  elsif new.status = 'cancelled' and old.status is distinct from new.status then
    event_name := 'schedule_cancelled';
  elsif new.match_date is distinct from old.match_date
     or new.scheduled_time is distinct from old.scheduled_time
     or new.opponent_name is distinct from old.opponent_name
     or new.format is distinct from old.format then
    event_name := 'schedule_changed';
  else
    return new;
  end if;

  -- Only queue work once Discord is enabled and an approved channel is
  -- subscribed to this event. Tenants without an installation should not
  -- accumulate undeliverable notification records.
  if not exists (
    select 1
    from public.tenant_feature_access feature
    join public.discord_installations installation
      on installation.tenant_id = feature.tenant_id
     and installation.status = 'active'
    join public.discord_channel_subscriptions subscription
      on subscription.installation_id = installation.id
     and subscription.enabled = true
     and subscription.event_type = event_name
    where feature.tenant_id = new.tenant_id
      and feature.module_key = 'discord'
      and feature.is_enabled = true
  ) then
    return new;
  end if;

  insert into public.integration_events (
    tenant_id, event_type, aggregate_type, aggregate_id, payload, dedupe_key
  )
  values (
    new.tenant_id,
    event_name,
    'scrim',
    new.id,
    jsonb_build_object(
      'scrim_id', new.id,
      'opponent_name', new.opponent_name,
      'match_date', new.match_date,
      'scheduled_time', new.scheduled_time,
      'format', new.format
    ),
    concat(event_name, ':', new.id, ':', extract(epoch from new.updated_at)::bigint)
  )
  on conflict (tenant_id, dedupe_key) do nothing;

  return new;
end;
$$;

revoke execute on function public.queue_scrim_integration_event() from public, anon, authenticated;

drop trigger if exists queue_scrim_integration_event on public.scrims;
create trigger queue_scrim_integration_event
after insert or update on public.scrims
for each row execute function public.queue_scrim_integration_event();

comment on table public.scouting_evidence is
  'Tenant-private staff observations linked to manual notes, scrims, or collector-captured games.';
comment on table public.preparation_briefs is
  'Living fixture preparation drafts and immutable published snapshots.';
comment on function public.get_team_performance_summary(uuid, date, date) is
  'Returns tenant-authorized team trends using saved results and provenance only.';
