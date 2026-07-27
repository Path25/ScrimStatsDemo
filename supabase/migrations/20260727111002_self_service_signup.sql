-- Launch self-service onboarding. Authentication remains owned by Supabase Auth;
-- this RPC creates exactly one Free workspace after the user's email is verified.

create or replace function public.create_self_service_workspace(
  p_name text,
  p_timezone text default 'UTC'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_name text := btrim(p_name);
  v_timezone text := nullif(btrim(p_timezone), '');
  v_slug_base text;
  v_slug text;
  v_tenant_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;

  if not exists (
    select 1
    from auth.users account
    where account.id = v_user_id
      and account.email_confirmed_at is not null
  ) then
    raise exception 'Confirm your email before creating a workspace';
  end if;

  if exists (
    select 1
    from public.tenant_users membership
    where membership.user_id = v_user_id
  ) then
    raise exception 'Your account already belongs to a workspace';
  end if;

  if v_name is null or char_length(v_name) < 2 or char_length(v_name) > 100 then
    raise exception 'Team name must contain between 2 and 100 characters';
  end if;

  if v_timezone is null or not exists (
    select 1 from pg_catalog.pg_timezone_names zone where zone.name = v_timezone
  ) then
    raise exception 'Choose a valid timezone';
  end if;

  v_slug_base := trim(both '-' from regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g'));
  if v_slug_base = '' then v_slug_base := 'team'; end if;
  v_slug := left(v_slug_base, 42) || '-' || left(replace(gen_random_uuid()::text, '-', ''), 10);

  insert into public.tenants (
    name,
    slug,
    subscription_tier,
    subscription_status,
    settings
  ) values (
    v_name,
    v_slug,
    'free'::public.subscription_tier,
    'active',
    jsonb_build_object(
      'timezone', v_timezone,
      'onboarding_completed', false,
      'signup_source', 'self_service'
    )
  ) returning id into v_tenant_id;

  insert into public.tenant_users (tenant_id, user_id, role, joined_at)
  values (v_tenant_id, v_user_id, 'owner'::public.tenant_role, now());

  return jsonb_build_object(
    'tenant_id', v_tenant_id,
    'slug', v_slug,
    'subscription_tier', 'free'
  );
end;
$$;

revoke all on function public.create_self_service_workspace(text, text) from public, anon, authenticated;
grant execute on function public.create_self_service_workspace(text, text) to authenticated;

comment on function public.create_self_service_workspace(text, text) is
  'Creates one Free workspace for a verified authenticated user with no existing memberships.';

-- Keep the older unrestricted helper retired. All launch signups use the
-- constrained function above.
revoke execute on function public.create_tenant_with_owner(text, text, public.subscription_tier)
from public, anon, authenticated;

notify pgrst, 'reload schema';
