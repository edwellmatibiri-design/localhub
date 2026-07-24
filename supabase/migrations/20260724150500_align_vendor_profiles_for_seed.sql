do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vendor_profiles'
      and column_name = 'id'
      and udt_name = 'uuid'
  ) then
    alter table public.vendor_profiles
      alter column id drop default;

    alter table public.vendor_profiles
      alter column id type text using id::text;

    alter table public.vendor_profiles
      alter column id set default gen_random_uuid()::text;
  end if;
end
$$;

alter table public.vendor_profiles
  add column if not exists display_name text,
  add column if not exists business_name text,
  add column if not exists category_id uuid references public.categories(id),
  add column if not exists location text,
  add column if not exists verified boolean not null default false,
  add column if not exists flagged boolean not null default false,
  add column if not exists risk_score numeric,
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vendor_profiles'
      and column_name = 'user_id'
      and is_nullable = 'NO'
  ) then
    alter table public.vendor_profiles
      alter column user_id drop not null;
  end if;
end
$$;