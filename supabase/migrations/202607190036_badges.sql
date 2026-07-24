create table if not exists badges (
  id bigserial primary key,
  user_id text not null,
  badge text not null,
  created_at timestamp default now()
);

create unique index if not exists idx_badges_user_badge_unique
  on badges(user_id, badge);

create index if not exists idx_badges_user_created
  on badges(user_id, created_at desc);
