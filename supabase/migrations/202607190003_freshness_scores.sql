create table if not exists freshness_scores (
  id bigserial primary key,
  page_url text unique not null,
  score int not null,
  updated_at timestamp default now()
);
