drop table if exists messages cascade;

create table if not exists messages (
  id bigserial primary key,
  conversation_id bigint references conversations(id),
  sender_type text check (sender_type in ('user','vendor')),
  sender_id text not null,
  message text not null,
  created_at timestamp default now()
);
