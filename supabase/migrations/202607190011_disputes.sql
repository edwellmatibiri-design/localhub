create table if not exists disputes (
  id bigserial primary key,
  booking_id bigint not null,
  user_id text not null,
  vendor_id text not null,
  reason text not null,
  status text check (status in ('open','under_review','resolved','rejected')),
  resolution text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
