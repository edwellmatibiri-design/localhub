create table if not exists vendor_calendar_events (
  id bigserial primary key,
  vendor_id text not null,
  staff_id bigint null,
  booking_id bigint null,
  title text not null,
  description text null,
  start_at timestamp not null,
  end_at timestamp not null,
  status text check (status in ('scheduled','in_progress','completed','cancelled')),
  created_at timestamp default now()
);

create index if not exists idx_vendor_calendar_events_vendor_start
  on vendor_calendar_events(vendor_id, start_at desc);

create index if not exists idx_vendor_calendar_events_staff_start
  on vendor_calendar_events(staff_id, start_at desc)
  where staff_id is not null;
