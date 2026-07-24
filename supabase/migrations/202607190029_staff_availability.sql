create table if not exists staff_availability (
  id bigserial primary key,
  staff_id bigint not null,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamp default now()
);

create index if not exists idx_staff_availability_staff_day
  on staff_availability(staff_id, day_of_week, start_time);
