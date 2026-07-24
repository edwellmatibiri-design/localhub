create table if not exists public.booking_scopes (
  id bigserial primary key,
  user_id text null,
  category text not null,
  answers jsonb not null default '{}'::jsonb,
  photos jsonb not null default '[]'::jsonb,
  user_notes text null,
  job_summary text not null,
  job_size text not null,
  job_complexity text not null,
  estimated_duration numeric not null,
  estimated_team_size int not null,
  instant_quote_min numeric not null,
  instant_quote_max numeric not null,
  lead_ids jsonb not null default '[]'::jsonb,
  created_at timestamp not null default now()
);

create index if not exists idx_booking_scopes_category on public.booking_scopes(category);
create index if not exists idx_booking_scopes_user on public.booking_scopes(user_id);
create index if not exists idx_booking_scopes_created on public.booking_scopes(created_at);
