create table if not exists payouts (
  id bigserial primary key,
  vendor_id text not null,
  booking_id bigint not null,
  amount int not null,
  status text check (status in ('pending','paid','failed')),
  created_at timestamp default now()
);

alter table if exists bookings
  add column if not exists payment_intent_id text,
  add column if not exists payment_amount int,
  add column if not exists payment_currency text;
