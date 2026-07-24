create table if not exists user_behaviour (
  id bigserial primary key,
  user_id text not null,
  searches int default 0,
  leads_requested int default 0,
  leads_responded int default 0,
  bookings_started int default 0,
  bookings_completed int default 0,
  bookings_cancelled int default 0,
  messages_sent int default 0,
  messages_received int default 0,
  avg_response_time int default 0,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create unique index if not exists idx_user_behaviour_user_unique
  on user_behaviour(user_id);

create index if not exists idx_user_behaviour_updated
  on user_behaviour(updated_at desc);
