drop table if exists reviews;

create table if not exists reviews (
  id bigserial primary key,
  vendor_id text not null,
  user_id text not null,
  booking_id bigint not null,
  rating int check (rating between 1 and 5),
  review text not null,
  created_at timestamp default now(),
  verified boolean default true
);
