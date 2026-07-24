create table if not exists generated_pages (
  id bigserial primary key,
  intent_id uuid not null references intent_nodes(id),
  title text not null,
  meta_description text not null,
  h1 text not null,
  h2 jsonb not null,
  h3 jsonb not null,
  faqs jsonb not null,
  schema jsonb not null,
  internal_links jsonb not null,
  updated_at timestamp default now(),
  unique (intent_id)
);
