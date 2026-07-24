create table if not exists documents (
  id bigserial primary key,
  vendor_id text not null,
  name text not null,
  file_url text not null,
  type text not null check (type in ('contract','job_sheet','other')),
  storage_path text,
  booking_id bigint,
  created_at timestamp not null default now()
);

create index if not exists idx_documents_vendor_type_created
  on documents(vendor_id, type, created_at desc);

create index if not exists idx_documents_booking
  on documents(booking_id)
  where booking_id is not null;

alter table if exists bookings
  add column if not exists job_sheet_document_id bigint null;
