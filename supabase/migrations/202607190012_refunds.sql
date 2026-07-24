create table if not exists refunds (
  id bigserial primary key,
  booking_id bigint not null,
  amount int not null,
  status text check (status in ('pending','processed','failed')),
  created_at timestamp default now()
);
