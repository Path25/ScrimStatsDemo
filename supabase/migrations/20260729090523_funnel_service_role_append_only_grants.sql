-- Preserve the funnel ledger as an append-only service path.
--
-- The original table creation migration intentionally denied browser roles,
-- but project default privileges also granted service_role broader table
-- privileges. Keep the trusted server path able to insert milestones and
-- calculate aggregates while removing destructive/schema-adjacent access.
revoke all privileges on table public.workspace_funnel_events from service_role;
grant select, insert on table public.workspace_funnel_events to service_role;
