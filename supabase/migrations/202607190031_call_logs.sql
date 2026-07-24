create table if not exists call_logs (
  id bigserial primary key,
  vendor_id text not null,
  staff_id bigint null,
  user_id text not null,
  lead_id bigint null,
  direction text check (direction in ('incoming','outgoing')),
  status text check (status in ('missed','answered','declined')),
  started_at timestamp not null,
  ended_at timestamp null,
  duration int default 0,
  recording_url text null,
  created_at timestamp default now()
);

create index if not exists idx_call_logs_vendor_started
  on call_logs(vendor_id, started_at desc);

create index if not exists idx_call_logs_staff_started
  on call_logs(staff_id, started_at desc)
  where staff_id is not null;

create index if not exists idx_call_logs_user_started
  on call_logs(user_id, started_at desc);

create index if not exists idx_call_logs_lead_started
  on call_logs(lead_id, started_at desc)
  where lead_id is not null;

create table if not exists crm_notes (
  id bigserial primary key,
  vendor_id text not null,
  user_id text null,
  lead_id bigint null,
  note text not null,
  created_at timestamp default now()
);

create index if not exists idx_crm_notes_vendor_created
  on crm_notes(vendor_id, created_at desc);

create index if not exists idx_crm_notes_lead_created
  on crm_notes(lead_id, created_at desc)
  where lead_id is not null;

alter table if exists seller_profiles
  add column if not exists calling_disabled boolean not null default false;
