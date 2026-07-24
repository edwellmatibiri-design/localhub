alter table if exists listings
  add column if not exists status text not null default 'pending_review',
  add column if not exists quality_score integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'listings_status_check'
  ) then
    alter table listings
      add constraint listings_status_check
      check (status in ('pending_review', 'approved', 'rejected'));
  end if;
end $$;

create index if not exists idx_listings_status on listings(status);