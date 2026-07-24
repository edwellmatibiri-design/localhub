create table if not exists job_assignments (
  id bigserial primary key,
  booking_id bigint not null,
  staff_id bigint not null,
  assigned_by text not null,
  job_sheet_document_id bigint,
  status text not null check (status in ('assigned','in_progress','completed')),
  started_at timestamp,
  completed_at timestamp,
  updated_at timestamp default now(),
  created_at timestamp default now()
);

create index if not exists idx_job_assignments_staff_status_created
  on job_assignments(staff_id, status, created_at desc);

create index if not exists idx_job_assignments_booking_created
  on job_assignments(booking_id, created_at desc);
