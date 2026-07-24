create table if not exists public.booking_engine_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamp not null default now()
);

create or replace function public.set_booking_engine_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_booking_engine_settings_updated_at on public.booking_engine_settings;
create trigger trg_booking_engine_settings_updated_at
before update on public.booking_engine_settings
for each row
execute function public.set_booking_engine_settings_updated_at();

insert into public.booking_engine_settings(key, value)
values
  ('scoping_logic', '{"size_thresholds":{"tree_large_height":10},"duration_bonus":{"disposal":1},"complexity_increment":{"access_difficulty":1}}'::jsonb),
  ('pricing_logic', '{"base":300,"size":{"small":1,"medium":1.5,"large":2.5},"complexity":{"low":1,"medium":1.3,"high":1.6},"duration_unit":150}'::jsonb)
on conflict (key) do nothing;
