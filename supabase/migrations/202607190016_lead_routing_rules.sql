create table if not exists lead_routing_rules (
  id bigserial primary key,
  category text not null,
  location text not null,
  max_vendors int not null default 3,
  routing_strategy text not null check (routing_strategy in ('round_robin','top_ranked','balanced','fastest_response')),
  created_at timestamp not null default now()
);

create unique index if not exists idx_lead_routing_rules_category_location
  on lead_routing_rules(category, location);
