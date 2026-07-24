create table if not exists points_transactions (
  id bigserial primary key,
  user_id text not null,
  points int not null,
  type text check (type in (
    'booking_completed',
    'review_written',
    'referral_bonus',
    'promo_bonus',
    'admin_adjustment'
  )),
  created_at timestamp default now()
);

create index if not exists idx_points_transactions_user_created
  on points_transactions(user_id, created_at desc);

create index if not exists idx_points_transactions_type_created
  on points_transactions(type, created_at desc);
