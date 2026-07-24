create table if not exists public.ai_sessions (
  id bigserial primary key,
  user_id text null,
  vendor_id text null,
  role text not null check (role in ('user', 'vendor')),
  context jsonb not null default '{}'::jsonb,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create index if not exists idx_ai_sessions_user_id on public.ai_sessions(user_id);
create index if not exists idx_ai_sessions_vendor_id on public.ai_sessions(vendor_id);
create index if not exists idx_ai_sessions_role on public.ai_sessions(role);

create or replace function public.set_ai_sessions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_ai_sessions_updated_at on public.ai_sessions;
create trigger trg_ai_sessions_updated_at
before update on public.ai_sessions
for each row
execute function public.set_ai_sessions_updated_at();
