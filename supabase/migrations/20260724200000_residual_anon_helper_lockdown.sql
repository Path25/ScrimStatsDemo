-- RLS policies still call these legacy helpers as authenticated users.
-- Anonymous browser clients never need to invoke them directly.

revoke all on function public.get_current_user_email()
  from public, anon;
grant execute on function public.get_current_user_email()
  to authenticated;

revoke all on function public.get_user_tenant_id()
  from public, anon;
grant execute on function public.get_user_tenant_id()
  to authenticated;

comment on function public.get_current_user_email() is
  'Authenticated RLS helper. Anonymous Data API execution is disabled.';
comment on function public.get_user_tenant_id() is
  'Authenticated RLS helper. Anonymous Data API execution is disabled.';
