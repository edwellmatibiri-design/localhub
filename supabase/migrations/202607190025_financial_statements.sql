create table if not exists financial_statements (
  id bigserial primary key,
  vendor_id text not null,
  period_start date not null,
  period_end date not null,
  total_bookings int not null default 0,
  total_revenue int not null default 0,
  total_payouts int not null default 0,
  total_fees int not null default 0,
  net_earnings int not null default 0,
  tax_estimate int not null default 0,
  created_at timestamp not null default now(),
  unique(vendor_id, period_start, period_end)
);

create index if not exists idx_financial_statements_vendor_period
  on financial_statements(vendor_id, period_start desc, period_end desc);
