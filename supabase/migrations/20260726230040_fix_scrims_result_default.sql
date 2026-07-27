-- A scheduled block has no outcome until review. The legacy 'pending' result
-- default conflicts with the current win/loss/draw constraint.
alter table public.scrims
  alter column result drop default;
