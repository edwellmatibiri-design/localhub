create table if not exists search_suggestions (
  id bigserial primary key,
  keyword text not null,
  type text not null check (type in ('category','location','vendor','listing','intent')),
  score int not null default 0,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create unique index if not exists idx_search_suggestions_keyword_type
  on search_suggestions(keyword, type);

create index if not exists idx_search_suggestions_score_desc
  on search_suggestions(score desc, updated_at desc);

alter table if exists intent_nodes
  add column if not exists search_count int not null default 0;
