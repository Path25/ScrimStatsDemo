do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.player_availability'::regclass
      and conname = 'player_availability_tenant_id_fkey'
  ) then
    alter table public.player_availability
      add constraint player_availability_tenant_id_fkey
      foreign key (tenant_id)
      references public.tenants(id)
      on delete cascade;
  end if;
end
$$;

drop policy if exists "Staff and entry owners can update availability"
  on public.player_availability;

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
  public.user_belongs_to_tenant(tenant_id)
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
