alter table if exists users enable row level security;
alter table if exists reviews enable row level security;
alter table if exists seller_profiles enable row level security;
alter table if exists listings enable row level security;
alter table if exists audit_logs enable row level security;
alter table if exists intent_nodes enable row level security;
alter table if exists intent_edges enable row level security;

drop policy if exists users_self_read on users;
create policy users_self_read
  on users for select
  using (id = auth.uid());

drop policy if exists users_self_update on users;
create policy users_self_update
  on users for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists reviews_public_read on reviews;
create policy reviews_public_read
  on reviews for select
  using (not flagged or auth.role() = 'service_role');

drop policy if exists reviews_reviewer_insert on reviews;
create policy reviews_reviewer_insert
  on reviews for insert
  with check (reviewer_id = auth.uid());

drop policy if exists reviews_reviewer_update_own on reviews;
create policy reviews_reviewer_update_own
  on reviews for update
  using (reviewer_id = auth.uid())
  with check (reviewer_id = auth.uid());

drop policy if exists reviews_service_delete on reviews;
create policy reviews_service_delete
  on reviews for delete
  using (auth.role() = 'service_role');

-- Validation helper view for auditing policy state after migration.
create or replace view rls_policy_audit as
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  p.polname as policy_name,
  p.polcmd as policy_command
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relname in (
    'users',
    'seller_profiles',
    'listings',
    'reviews',
    'audit_logs',
    'intent_nodes',
    'intent_edges'
  )
order by c.relname, p.polname;
