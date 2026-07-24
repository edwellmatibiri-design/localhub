create table if not exists quality_flags (
  id bigserial primary key,
  vendor_id text null,
  user_id text null,
  listing_id bigint null,
  review_id bigint null,
  type text not null check (type in (
    'spam_listing',
    'duplicate_listing',
    'abusive_message',
    'fake_review',
    'suspicious_activity',
    'high_cancellation_rate',
    'low_response_rate',
    'boost_fraud'
  )),
  severity int not null check (severity between 1 and 5),
  notes text,
  created_at timestamp default now(),
  resolved boolean default false
);

create index if not exists idx_quality_flags_vendor_resolved_created
  on quality_flags(vendor_id, resolved, created_at desc);

create index if not exists idx_quality_flags_type_severity_created
  on quality_flags(type, severity, created_at desc);

alter table if exists listings
  drop constraint if exists listings_status_check;

alter table if exists listings
  add constraint listings_status_check
  check (status in ('pending_review', 'approved', 'rejected', 'blocked'));
