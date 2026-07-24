alter table if exists generated_pages
  add column if not exists impressions int default 0,
  add column if not exists internal_link_count int default 0,
  add column if not exists age_days int default 0;
