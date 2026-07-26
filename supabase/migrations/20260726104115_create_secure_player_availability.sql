-- Availability storage for the workspace calendar.
-- The earlier local availability migration was never applied to the hosted project.

create table if not exists public.player_availability (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_available boolean not null default true,
  recurrence_rule text,
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_availability_valid_time_range check (end_time > start_time)
);

create index if not exists player_availability_tenant_time_idx
  on public.player_availability (tenant_id, start_time, end_time);

create index if not exists player_availability_player_time_idx
  on public.player_availability (player_id, start_time, end_time);

alter table public.player_availability enable row level security;

grant select, insert, update, delete
  on table public.player_availability
  to authenticated;

revoke all
  on table public.player_availability
  from anon;

drop policy if exists "Users can view availability for their tenant"
  on public.player_availability;
drop policy if exists "Users can create availability for their tenant players"
  on public.player_availability;
drop policy if exists "Users can update availability for their tenant"
  on public.player_availability;
drop policy if exists "Users can delete availability for their tenant"
  on public.player_availability;
drop policy if exists "Tenant members can view player availability"
  on public.player_availability;
drop policy if exists "Staff and linked players can create availability"
  on public.player_availability;
drop policy if exists "Staff and entry owners can update availability"
  on public.player_availability;
drop policy if exists "Staff and entry owners can delete availability"
  on public.player_availability;

create policy "Tenant members can view player availability"
on public.player_availability
for select
to authenticated
using (
  public.user_belongs_to_tenant(tenant_id)
);

create policy "Staff and linked players can create availability"
on public.player_availability
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and public.user_belongs_to_tenant(tenant_id)
  and exists (
    select 1
    from public.players p
    where p.id = player_id
      and p.tenant_id = player_availability.tenant_id
  )
  and (
    public.user_has_tenant_role(
      tenant_id,
      array['owner', 'admin']::public.tenant_role[]
    )
    or (
      public.user_has_tenant_role(tenant_id, 'member'::public.tenant_role)
      and exists (
        select 1
        from public.players p
        where p.id = player_id
          and p.tenant_id = player_availability.tenant_id
          and p.linked_user_id = (select auth.uid())
      )
    )
  )
);

create policy "Staff and entry owners can update availability"
on public.player_availability
for update
to authenticated
using (
  public.user_belongs_to_tenant(tenant_id)
  and (
    public.user_has_tenant_role(
      tenant_id,
      array['owner', 'admin']::public.tenant_role[]
    )
    or (
      created_by = (select auth.uid())
      and public.user_has_tenant_role(tenant_id, 'member'::public.tenant_role)
      and exists (
        select 1
        from public.players p
        where p.id = player_id
          and p.tenant_id = player_availability.tenant_id
          and p.linked_user_id = (select auth.uid())
      )
    )
  )
)
with check (
  created_by = (select auth.uid())
  and public.user_belongs_to_tenant(tenant_id)
  and exists (
    select 1
    from public.players p
    where p.id = player_id
      and p.tenant_id = player_availability.tenant_id
  )
  and (
    public.user_has_tenant_role(
      tenant_id,
      array['owner', 'admin']::public.tenant_role[]
    )
    or (
      public.user_has_tenant_role(tenant_id, 'member'::public.tenant_role)
      and exists (
        select 1
        from public.players p
        where p.id = player_id
          and p.tenant_id = player_availability.tenant_id
          and p.linked_user_id = (select auth.uid())
      )
    )
  )
);

create policy "Staff and entry owners can delete availability"
on public.player_availability
for delete
to authenticated
using (
  public.user_belongs_to_tenant(tenant_id)
  and (
    public.user_has_tenant_role(
      tenant_id,
      array['owner', 'admin']::public.tenant_role[]
    )
    or (
      created_by = (select auth.uid())
      and public.user_has_tenant_role(tenant_id, 'member'::public.tenant_role)
      and exists (
        select 1
        from public.players p
        where p.id = player_id
          and p.tenant_id = player_availability.tenant_id
          and p.linked_user_id = (select auth.uid())
      )
    )
  )
);

drop trigger if exists update_player_availability_updated_at
  on public.player_availability;

create trigger update_player_availability_updated_at
before update on public.player_availability
for each row
execute function public.update_updated_at();

drop view if exists public.team_availability_slots;

notify pgrst, 'reload schema';
