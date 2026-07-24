create table if not exists outreach_businesses (
  id bigserial primary key,
  business_name text not null,
  category text not null,
  location text,
  email text,
  phone text,
  whatsapp_number text,
  instagram_handle text,
  facebook_page text,
  tiktok_handle text,
  website text,
  status text not null default 'new' check (status in ('new','contacted','responded','onboarding','completed','failed')),
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create index if not exists idx_outreach_businesses_status_created
  on outreach_businesses(status, created_at desc);

create index if not exists idx_outreach_businesses_category_location
  on outreach_businesses(category, location);

create table if not exists outreach_messages (
  id bigserial primary key,
  business_id bigint not null references outreach_businesses(id) on delete cascade,
  channel text not null check (channel in ('email','whatsapp','sms','instagram','facebook','tiktok')),
  message text not null,
  direction text not null check (direction in ('outbound','inbound')),
  status text not null default 'sent' check (status in ('sent','delivered','opened','clicked','replied','failed')),
  created_at timestamp not null default now()
);

create index if not exists idx_outreach_messages_business_created
  on outreach_messages(business_id, created_at desc);

create index if not exists idx_outreach_messages_direction_status
  on outreach_messages(direction, status);

create table if not exists outreach_followups (
  id bigserial primary key,
  business_id bigint not null references outreach_businesses(id) on delete cascade,
  scheduled_at timestamp not null,
  sent boolean not null default false,
  created_at timestamp not null default now()
);

create index if not exists idx_outreach_followups_due
  on outreach_followups(sent, scheduled_at asc);

create index if not exists idx_outreach_followups_business
  on outreach_followups(business_id, scheduled_at desc);

create table if not exists outreach_stats (
  id bigserial primary key,
  total_sent int not null default 0,
  total_replied int not null default 0,
  total_failed int not null default 0,
  email_open_rate float not null default 0,
  whatsapp_reply_rate float not null default 0,
  sms_reply_rate float not null default 0,
  created_at timestamp not null default now()
);

insert into outreach_stats(total_sent, total_replied, total_failed, email_open_rate, whatsapp_reply_rate, sms_reply_rate)
select 0, 0, 0, 0, 0, 0
where not exists (select 1 from outreach_stats);

create or replace function outreach_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_outreach_businesses_updated_at on outreach_businesses;
create trigger trg_outreach_businesses_updated_at
before update on outreach_businesses
for each row
execute procedure outreach_set_updated_at();
