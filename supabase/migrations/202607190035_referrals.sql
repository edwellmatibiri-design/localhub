create table if not exists referrals (
  id bigserial primary key,
  referrer_id text not null,
  referred_id text not null,
  status text check (status in ('pending','completed')),
  created_at timestamp default now()
);

create unique index if not exists idx_referrals_referrer_referred_unique
  on referrals(referrer_id, referred_id);

create index if not exists idx_referrals_status_created
  on referrals(status, created_at desc);
