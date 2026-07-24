create table if not exists templates (
  id bigserial primary key,
  vendor_id text not null,
  name text not null,
  content text not null,
  created_at timestamp default now()
);

create index if not exists idx_templates_vendor_created
  on templates(vendor_id, created_at desc);
