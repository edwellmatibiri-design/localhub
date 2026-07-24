create table if not exists invoices (
  id bigserial primary key,
  vendor_id text not null,
  user_id text not null,
  booking_id bigint null,
  invoice_number text unique not null,
  items jsonb not null,
  subtotal int not null,
  tax int not null default 0,
  total int not null,
  status text not null check (status in ('draft','sent','paid','overdue')),
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create index if not exists idx_invoices_vendor_status_created
  on invoices(vendor_id, status, created_at desc);

create index if not exists idx_invoices_user_created
  on invoices(user_id, created_at desc);

create index if not exists idx_invoices_booking
  on invoices(booking_id)
  where booking_id is not null;
