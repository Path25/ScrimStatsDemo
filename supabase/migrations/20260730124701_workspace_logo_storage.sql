-- Private, tenant-scoped workspace identity assets. The object name is fixed per tenant
-- so replacement does not accumulate historical logo files.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'workspace-logos',
  'workspace-logos',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do nothing;

drop policy if exists workspace_logos_member_read on storage.objects;
drop policy if exists workspace_logos_staff_insert on storage.objects;
drop policy if exists workspace_logos_staff_update on storage.objects;
drop policy if exists workspace_logos_staff_delete on storage.objects;

create policy workspace_logos_member_read
on storage.objects for select to authenticated
using (
  bucket_id = 'workspace-logos'
  and exists (
    select 1
    from public.tenant_users membership
    where membership.user_id = (select auth.uid())
      and name = membership.tenant_id::text || '/logo'
  )
);

create policy workspace_logos_staff_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'workspace-logos'
  and exists (
    select 1
    from public.tenant_users membership
    where membership.user_id = (select auth.uid())
      and membership.role in ('owner'::public.tenant_role, 'admin'::public.tenant_role)
      and name = membership.tenant_id::text || '/logo'
  )
);

create policy workspace_logos_staff_update
on storage.objects for update to authenticated
using (
  bucket_id = 'workspace-logos'
  and exists (
    select 1
    from public.tenant_users membership
    where membership.user_id = (select auth.uid())
      and membership.role in ('owner'::public.tenant_role, 'admin'::public.tenant_role)
      and name = membership.tenant_id::text || '/logo'
  )
)
with check (
  bucket_id = 'workspace-logos'
  and exists (
    select 1
    from public.tenant_users membership
    where membership.user_id = (select auth.uid())
      and membership.role in ('owner'::public.tenant_role, 'admin'::public.tenant_role)
      and name = membership.tenant_id::text || '/logo'
  )
);

create policy workspace_logos_staff_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'workspace-logos'
  and exists (
    select 1
    from public.tenant_users membership
    where membership.user_id = (select auth.uid())
      and membership.role in ('owner'::public.tenant_role, 'admin'::public.tenant_role)
      and name = membership.tenant_id::text || '/logo'
  )
);
