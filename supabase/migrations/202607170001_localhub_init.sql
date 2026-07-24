create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  phone text unique,
  full_name text not null default '',
  avatar_url text,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  last_login timestamptz
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists suburbs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  city text not null,
  created_at timestamptz not null default now()
);

create table if not exists seller_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  business_name text not null,
  contact_email text,
  contact_phone text,
  category_id uuid references categories(id),
  suburb_id uuid references suburbs(id),
  description text not null default '',
  logo_url text,
  created_at timestamptz not null default now()
);

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references seller_profiles(id) on delete cascade,
  title text not null,
  category_id uuid references categories(id),
  suburb_id uuid references suburbs(id),
  description text not null,
  price numeric(12,2) not null default 0,
  images text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_active boolean not null default true
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  seller_id uuid not null references seller_profiles(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now(),
  status text not null default 'new'
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  seller_id uuid not null references seller_profiles(id) on delete cascade,
  last_message text,
  last_message_at timestamptz
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references users(id) on delete cascade,
  receiver_id uuid not null references users(id) on delete cascade,
  listing_id uuid references listings(id),
  content text not null,
  created_at timestamptz not null default now(),
  seen boolean not null default false
);

create table if not exists seo_pages (
  id uuid primary key default gen_random_uuid(),
  page_type text not null,
  slug text not null,
  title text not null,
  body text not null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists seo_tasks (
  id uuid primary key default gen_random_uuid(),
  task_type text not null,
  cadence text not null,
  status text not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  run_at timestamptz
);

create table if not exists seo_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references seo_tasks(id) on delete set null,
  level text not null default 'info',
  message text not null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_listings_category_suburb on listings(category_id, suburb_id);
create index if not exists idx_leads_seller_status on leads(seller_id, status);
create index if not exists idx_messages_receiver_seen on messages(receiver_id, seen);
create index if not exists idx_seo_tasks_status_run_at on seo_tasks(status, run_at);
