create table if not exists loyalty_points (
  id bigserial primary key,
  user_id text not null,
  points int default 0,
  lifetime_points int default 0,
  tier text check (tier in ('bronze','silver','gold','platinum')) default 'bronze',
  updated_at timestamp default now()
);

create unique index if not exists idx_loyalty_points_user_unique
  on loyalty_points(user_id);

create index if not exists idx_loyalty_points_tier_updated
  on loyalty_points(tier, updated_at desc);
