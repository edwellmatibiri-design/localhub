create table if not exists crm_pipeline (
  id bigserial primary key,
  vendor_id text not null,
  lead_id bigint null,
  quote_id bigint null,
  booking_id bigint null,
  stage text not null check (stage in (
    'new_lead',
    'contacted',
    'quote_sent',
    'negotiation',
    'awaiting_payment',
    'booked',
    'completed',
    'lost'
  )),
  value_estimate int not null default 0,
  probability int not null default 0 check (probability >= 0 and probability <= 100),
  updated_at timestamp not null default now(),
  created_at timestamp not null default now()
);

create index if not exists idx_crm_pipeline_vendor_stage_updated
  on crm_pipeline(vendor_id, stage, updated_at desc);

create index if not exists idx_crm_pipeline_vendor_lead
  on crm_pipeline(vendor_id, lead_id)
  where lead_id is not null;

create index if not exists idx_crm_pipeline_vendor_quote
  on crm_pipeline(vendor_id, quote_id)
  where quote_id is not null;

create index if not exists idx_crm_pipeline_vendor_booking
  on crm_pipeline(vendor_id, booking_id)
  where booking_id is not null;

create table if not exists crm_pipeline_events (
  id bigserial primary key,
  pipeline_id bigint not null references crm_pipeline(id) on delete cascade,
  vendor_id text not null,
  from_stage text null,
  to_stage text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp not null default now()
);

create index if not exists idx_crm_pipeline_events_vendor_created
  on crm_pipeline_events(vendor_id, created_at desc);

create index if not exists idx_crm_pipeline_events_pipeline_created
  on crm_pipeline_events(pipeline_id, created_at asc);
