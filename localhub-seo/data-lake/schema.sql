create table if not exists seo_page_metrics (
  id bigserial primary key,
  url text not null,
  category text,
  suburb text,
  city text,
  keyword text,
  rank_position integer,
  ctr numeric(6,4),
  bounce_rate numeric(6,4),
  dwell_time_seconds integer,
  scroll_depth numeric(6,4),
  conversion_rate numeric(6,4),
  return_visitor_rate numeric(6,4),
  page_speed_ms integer,
  schema_present boolean default false,
  crawl_frequency integer,
  index_status text,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_seo_page_metrics_url_observed
  on seo_page_metrics (url, observed_at desc);

create table if not exists seo_serp_snapshots (
  id bigserial primary key,
  keyword text not null,
  locale text not null,
  snapshot jsonb not null,
  observed_at timestamptz not null default now()
);

create index if not exists idx_seo_serp_keyword_observed
  on seo_serp_snapshots (keyword, observed_at desc);

create table if not exists seo_experiments (
  id bigserial primary key,
  experiment_key text not null unique,
  page_url text not null,
  variant_a jsonb not null,
  variant_b jsonb not null,
  winner text,
  status text not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
