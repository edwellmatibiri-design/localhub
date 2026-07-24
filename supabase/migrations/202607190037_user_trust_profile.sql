create table if not exists user_trust_profile (
  id bigserial primary key,
  user_id text not null,
  phone_verified boolean default false,
  email_verified boolean default false,
  device_verified boolean default false,
  multi_account_risk int default 0,
  cancellation_rate int default 0,
  dispute_count int default 0,
  abusive_flags int default 0,
  trust_score int default 50,
  bookings_locked boolean default false,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create unique index if not exists idx_user_trust_profile_user_unique
  on user_trust_profile(user_id);

create index if not exists idx_user_trust_profile_score_updated
  on user_trust_profile(trust_score, updated_at desc);

create table if not exists user_device_fingerprints (
  id bigserial primary key,
  user_id text not null,
  device_hash text not null,
  created_at timestamp default now()
);

create unique index if not exists idx_user_device_fingerprints_unique
  on user_device_fingerprints(user_id, device_hash);

create index if not exists idx_user_device_fingerprints_hash
  on user_device_fingerprints(device_hash, created_at desc);

alter table if exists bookings
  add column if not exists requires_vendor_approval boolean not null default false;
