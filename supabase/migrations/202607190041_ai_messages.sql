create table if not exists public.ai_messages (
  id bigserial primary key,
  session_id bigint not null references public.ai_sessions(id) on delete cascade,
  sender text not null check (sender in ('user', 'vendor', 'ai')),
  message text not null,
  created_at timestamp not null default now()
);

create index if not exists idx_ai_messages_session_id on public.ai_messages(session_id);
create index if not exists idx_ai_messages_created_at on public.ai_messages(created_at);
