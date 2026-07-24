create table if not exists ads (
  id bigserial primary key,
  vendor_id text not null,
  type text not null check (type in (
    'ppc_search',
    'ppc_listing',
    'category_ad',
    'location_ad',
    'homepage_banner'
  )),
  target text null,
  bid_amount int not null,
  daily_budget int not null,
  spent_today int default 0,
  impressions int default 0,
  clicks int default 0,
  status text not null check (status in ('active','paused','exhausted')),
  start_date timestamp default now(),
  end_date timestamp not null,
  created_at timestamp default now()
);

create index if not exists idx_ads_type_status_target
  on ads(type, status, target);

create index if not exists idx_ads_vendor_created
  on ads(vendor_id, created_at desc);
