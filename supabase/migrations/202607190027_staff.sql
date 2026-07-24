create table if not exists staff (
  id bigserial primary key,
  vendor_id text not null,
  name text not null,
  email text not null,
  phone text null,
  role text not null check (role in (
    'owner',
    'manager',
    'team_lead',
    'worker',
    'viewer'
  )),
  permissions jsonb not null,
  invite_token text,
  password_hash text,
  is_active boolean not null default false,
  last_activity timestamp default now(),
  disabled_at timestamp,
  created_at timestamp default now()
);

create index if not exists idx_staff_vendor_role_created
  on staff(vendor_id, role, created_at desc);

create unique index if not exists idx_staff_vendor_email_unique
  on staff(vendor_id, lower(email));

create unique index if not exists idx_staff_invite_token_unique
  on staff(invite_token)
  where invite_token is not null;
