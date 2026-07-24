drop table if exists conversations cascade;

create table if not exists conversations (
  id bigserial primary key,
  user_id text not null,
  vendor_id text not null,
  created_at timestamp default now(),
  unique(user_id, vendor_id)
);
