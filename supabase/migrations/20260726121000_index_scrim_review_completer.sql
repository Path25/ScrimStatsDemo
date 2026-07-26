create index if not exists scrims_review_completed_by_idx
  on public.scrims (review_completed_by)
  where review_completed_by is not null;
