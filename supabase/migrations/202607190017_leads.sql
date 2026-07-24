drop table if exists leads;

create table if not exists leads (
  id bigserial primary key,
  user_id text not null,
  vendor_id text not null,
  booking_id bigint null,
  intent_id bigint null,
  message text,
  status text not null check (status in ('sent','accepted','ignored','expired')),
  created_at timestamp not null default now()
);

create index if not exists idx_leads_vendor_status_created
  on leads(vendor_id, status, created_at desc);
