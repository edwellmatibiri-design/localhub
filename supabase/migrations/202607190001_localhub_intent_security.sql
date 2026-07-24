create table if not exists intent_nodes (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  intent text not null,
  micro_intent text,
  landing_path text not null,
  score numeric(6,4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (keyword, intent, micro_intent)
);

create table if not exists intent_edges (
  id uuid primary key default gen_random_uuid(),
  source_node_id uuid not null references intent_nodes(id) on delete cascade,
  target_node_id uuid not null references intent_nodes(id) on delete cascade,
  relation text not null,
  weight numeric(6,4) not null default 0.5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_node_id, target_node_id, relation)
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id text not null,
  action text not null,
  resource_type text not null,
  resource_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table if exists listings
  add column if not exists expires_at timestamptz;

create index if not exists idx_intent_nodes_path_score on intent_nodes(landing_path, score desc);
create index if not exists idx_intent_edges_source_target on intent_edges(source_node_id, target_node_id);
create index if not exists idx_audit_logs_actor_created on audit_logs(actor_id, created_at desc);
create index if not exists idx_listings_expires_at on listings(expires_at);

alter table if exists listings enable row level security;
alter table if exists seller_profiles enable row level security;
alter table if exists intent_nodes enable row level security;
alter table if exists intent_edges enable row level security;
alter table if exists audit_logs enable row level security;

drop policy if exists listings_read_active_or_owner on listings;
create policy listings_read_active_or_owner
  on listings for select
  using (
    is_active = true
    or exists (
      select 1
      from seller_profiles sp
      where sp.id = listings.seller_id
        and sp.user_id = auth.uid()
    )
  );

drop policy if exists listings_update_owner on listings;
create policy listings_update_owner
  on listings for update
  using (
    exists (
      select 1
      from seller_profiles sp
      where sp.id = listings.seller_id
        and sp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from seller_profiles sp
      where sp.id = listings.seller_id
        and sp.user_id = auth.uid()
    )
  );

drop policy if exists seller_profiles_owner_read on seller_profiles;
create policy seller_profiles_owner_read
  on seller_profiles for select
  using (user_id = auth.uid());

drop policy if exists seller_profiles_owner_update on seller_profiles;
create policy seller_profiles_owner_update
  on seller_profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists intent_nodes_service_only on intent_nodes;
create policy intent_nodes_service_only
  on intent_nodes for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists intent_edges_service_only on intent_edges;
create policy intent_edges_service_only
  on intent_edges for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists audit_logs_service_only on audit_logs;
create policy audit_logs_service_only
  on audit_logs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
