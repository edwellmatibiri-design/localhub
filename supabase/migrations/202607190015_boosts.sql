create table if not exists boosts (
  id bigserial primary key,
  vendor_id text not null,
  type text not null check (type in ('search_boost','featured_vendor','featured_listing','category_sponsor','location_sponsor')),
  target text null,
  start_date timestamp not null default now(),
  end_date timestamp not null,
  amount int not null,
  status text not null check (status in ('active','expired','pending_payment')),
  created_at timestamp not null default now()
);

create index if not exists idx_boosts_vendor_status_end on boosts(vendor_id, status, end_date desc);
create index if not exists idx_boosts_type_status_target on boosts(type, status, target);
