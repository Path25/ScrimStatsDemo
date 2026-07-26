drop policy if exists "Users can view tenant memberships" on public.tenant_users;
create policy tenant_users_member_read on public.tenant_users for select to authenticated using ((user_id = (select auth.uid())) or public.user_belongs_to_tenant(tenant_id));

drop policy if exists "Team members can view each other profiles" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
create policy profiles_member_read on public.profiles for select to authenticated using (
  id = (select auth.uid())
  or exists (
    select 1 from public.tenant_users viewer
    join public.tenant_users subject on subject.tenant_id = viewer.tenant_id
    where viewer.user_id = (select auth.uid()) and subject.user_id = profiles.id
  )
);
create policy profiles_self_insert on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_self_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
