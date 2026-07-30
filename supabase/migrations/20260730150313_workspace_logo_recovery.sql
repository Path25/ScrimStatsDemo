-- Make workspace-logo replacement recoverable. Existing fixed legacy paths remain
-- readable/deletable while new uploads use <tenant-id>/logo/<object-uuid>.

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
      and (
        name = membership.tenant_id::text || '/logo'
        or (
          (storage.foldername(name))[1] = membership.tenant_id::text
          and (storage.foldername(name))[2] = 'logo'
          and storage.filename(name) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        )
      )
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
      and (storage.foldername(name))[1] = membership.tenant_id::text
      and (storage.foldername(name))[2] = 'logo'
      and storage.filename(name) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
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
      and (
        name = membership.tenant_id::text || '/logo'
        or (
          (storage.foldername(name))[1] = membership.tenant_id::text
          and (storage.foldername(name))[2] = 'logo'
          and storage.filename(name) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        )
      )
  )
);
