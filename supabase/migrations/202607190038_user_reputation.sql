create table if not exists user_reputation (
  id bigserial primary key,
  user_id text not null,
  reputation_score int default 50,
  positive_events int default 0,
  negative_events int default 0,
  completed_bookings int default 0,
  cancelled_bookings int default 0,
  on_time_payments int default 0,
  late_payments int default 0,
  dispute_count int default 0,
  abusive_flags int default 0,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create unique index if not exists idx_user_reputation_user_unique
  on user_reputation(user_id);

create index if not exists idx_user_reputation_score_updated
  on user_reputation(reputation_score, updated_at desc);

alter table if exists seller_profiles
  add column if not exists auto_accept_trusted_bookings boolean not null default false;
