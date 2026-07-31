-- Preserve the immutable snapshot contract even for the service-role worker.
-- The existing RLS policies remain SELECT/INSERT-only; this removes inherited
-- table privileges that could otherwise bypass the intended append-only path.
revoke all on table public.stripe_mrr_daily_snapshots from service_role;
grant select, insert on table public.stripe_mrr_daily_snapshots to service_role;
