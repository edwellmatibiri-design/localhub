create table if not exists vendor_trust_scores (
  id bigserial primary key,
  vendor_id uuid not null references seller_profiles(id),
  trust_score int not null,
  signals jsonb not null,
  updated_at timestamp default now(),
  unique (vendor_id)
);
