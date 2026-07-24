create table vendor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,

  business_name text not null,
  display_name text,

  contact_email text,
  contact_phone text,

  category_id uuid references categories(id),
  suburb_id uuid references suburbs(id),

  description text not null default '',
  logo_url text,

  flagged boolean not null default false,

  created_at timestamptz not null default now()
);
