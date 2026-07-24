create table if not exists content_guides (
  id bigserial primary key,
  intent_id bigint null,
  category text null,
  location text null,
  title text not null,
  slug text unique not null,
  summary text not null,
  content jsonb not null,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index if not exists idx_content_guides_category_location
  on content_guides(category, location);

create index if not exists idx_content_guides_updated_at
  on content_guides(updated_at desc);
