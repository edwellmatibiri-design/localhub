create table if not exists tax_reports (
  id bigserial primary key,
  vendor_id text not null,
  year int not null,
  total_earnings int not null,
  tax_estimate int not null,
  created_at timestamp not null default now(),
  unique(vendor_id, year)
);

create index if not exists idx_tax_reports_vendor_year
  on tax_reports(vendor_id, year desc);
