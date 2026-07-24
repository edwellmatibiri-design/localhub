create table if not exists vendor_metrics (
  id bigserial primary key,
  vendor_id text not null unique,
  total_bookings int default 0,
  completed_bookings int default 0,
  cancelled_bookings int default 0,
  total_revenue int default 0,
  avg_rating float default 0,
  review_count int default 0,
  response_time_avg int default 0,
  updated_at timestamp default now()
);

create table if not exists marketplace_metrics (
  id bigserial primary key,
  date date not null unique,
  total_users int default 0,
  total_vendors int default 0,
  total_listings int default 0,
  total_bookings int default 0,
  total_revenue int default 0,
  avg_trust_score float default 0,
  avg_freshness_score float default 0,
  created_at timestamp default now()
);
