create table if not exists notifications (
  id bigserial primary key,
  user_id text,
  vendor_id text,
  type text,
  message text,
  created_at timestamp default now(),
  read boolean default false
);
