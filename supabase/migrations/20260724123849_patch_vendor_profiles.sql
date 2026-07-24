alter table vendor_profiles
  add column if not exists display_name text,
  add column if not exists flagged boolean not null default false;
