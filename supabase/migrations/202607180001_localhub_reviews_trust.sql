alter table if exists seller_profiles
  add column if not exists trust_score double precision not null default 0,
  add column if not exists review_count integer not null default 0,
  add column if not exists last_review_at timestamptz;

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references users(id) on delete cascade,
  seller_id uuid not null references seller_profiles(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz not null default now(),
  verified_lead boolean not null default false,
  verified_message boolean not null default false,
  flagged boolean not null default false,
  admin_notes text
);

create index if not exists idx_reviews_seller_created on reviews (seller_id, created_at desc);
create index if not exists idx_reviews_listing on reviews (listing_id);
create index if not exists idx_reviews_reviewer on reviews (reviewer_id);

create or replace function compute_seller_trust_score(p_seller_id uuid)
returns void
language plpgsql
as $$
declare
  v_weighted_sum numeric := 0;
  v_review_count integer := 0;
  v_flagged_count integer := 0;
  v_score numeric := 0;
begin
  select
    coalesce(sum(case when flagged then rating * 0.5 else rating end), 0),
    count(*),
    coalesce(sum(case when flagged then 1 else 0 end), 0)
  into v_weighted_sum, v_review_count, v_flagged_count
  from reviews
  where seller_id = p_seller_id;

  if v_review_count = 0 then
    update seller_profiles
    set trust_score = 0,
        review_count = 0,
        last_review_at = null
    where id = p_seller_id;
    return;
  end if;

  v_score := greatest(0, least(5, (v_weighted_sum / v_review_count) - (v_flagged_count * 0.1)));

  update seller_profiles
  set trust_score = round(v_score::numeric, 2),
      review_count = v_review_count,
      last_review_at = (
        select max(created_at)
        from reviews
        where seller_id = p_seller_id
      )
  where id = p_seller_id;
end;
$$;

create or replace function trg_recompute_seller_trust_score()
returns trigger
language plpgsql
as $$
begin
  perform compute_seller_trust_score(coalesce(new.seller_id, old.seller_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists reviews_recompute_trust on reviews;
create trigger reviews_recompute_trust
after insert or update or delete on reviews
for each row execute function trg_recompute_seller_trust_score();
