create table if not exists public.vendor_crm_quotes (
  id bigserial primary key,
  booking_id bigint not null,
  vendor_id text not null,
  category text not null,
  job_size text not null,
  job_complexity text not null,
  estimated_duration numeric not null,
  min_price numeric not null,
  max_price numeric not null,
  confidence numeric not null,
  source text not null default 'instant_quote',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp not null default now()
);

create index if not exists idx_vendor_crm_quotes_booking on public.vendor_crm_quotes(booking_id);
create index if not exists idx_vendor_crm_quotes_vendor on public.vendor_crm_quotes(vendor_id);
create index if not exists idx_vendor_crm_quotes_created on public.vendor_crm_quotes(created_at desc);
