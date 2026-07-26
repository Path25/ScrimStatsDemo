create index if not exists stripe_webhook_events_tenant_id_idx
  on public.stripe_webhook_events (tenant_id);

create policy "service role manages Stripe webhook ledger"
on public.stripe_webhook_events
for all
to service_role
using (true)
with check (true);
