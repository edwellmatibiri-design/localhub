create table if not exists public.booking_questions (
  id bigserial primary key,
  category text not null,
  question text not null,
  type text not null check (type in ('text', 'number', 'choice', 'photo')),
  choices jsonb null,
  required boolean not null default true,
  order_index int not null default 0,
  created_at timestamp not null default now()
);

create index if not exists idx_booking_questions_category on public.booking_questions(category);
create index if not exists idx_booking_questions_order on public.booking_questions(category, order_index);

insert into public.booking_questions(category, question, type, choices, required, order_index)
select 'tree_felling', 'What is the approximate tree height (in meters)?', 'number', null, true, 1
where not exists (
  select 1 from public.booking_questions
  where category = 'tree_felling' and question = 'What is the approximate tree height (in meters)?'
);

insert into public.booking_questions(category, question, type, choices, required, order_index)
select 'tree_felling', 'How many trees need work?', 'number', null, true, 2
where not exists (
  select 1 from public.booking_questions
  where category = 'tree_felling' and question = 'How many trees need work?'
);

insert into public.booking_questions(category, question, type, choices, required, order_index)
select 'tree_felling', 'Is access difficult?', 'choice', '["yes", "no"]'::jsonb, true, 3
where not exists (
  select 1 from public.booking_questions
  where category = 'tree_felling' and question = 'Is access difficult?'
);

insert into public.booking_questions(category, question, type, choices, required, order_index)
select 'tree_felling', 'Please describe the access constraints.', 'text', null, true, 4
where not exists (
  select 1 from public.booking_questions
  where category = 'tree_felling' and question = 'Please describe the access constraints.'
);

insert into public.booking_questions(category, question, type, choices, required, order_index)
select 'tree_felling', 'Do you need debris disposal?', 'choice', '["yes", "no"]'::jsonb, true, 5
where not exists (
  select 1 from public.booking_questions
  where category = 'tree_felling' and question = 'Do you need debris disposal?'
);

insert into public.booking_questions(category, question, type, choices, required, order_index)
select 'tree_felling', 'If tree height is above 10m, is equipment access possible?', 'choice', '["yes", "no", "not sure"]'::jsonb, true, 6
where not exists (
  select 1 from public.booking_questions
  where category = 'tree_felling' and question = 'If tree height is above 10m, is equipment access possible?'
);

insert into public.booking_questions(category, question, type, choices, required, order_index)
select 'tree_felling', 'Upload site photos', 'photo', null, false, 7
where not exists (
  select 1 from public.booking_questions
  where category = 'tree_felling' and question = 'Upload site photos'
);

insert into public.booking_questions(category, question, type, choices, required, order_index)
select 'cleaning', 'What is the home size in square meters?', 'number', null, true, 1
where not exists (
  select 1 from public.booking_questions
  where category = 'cleaning' and question = 'What is the home size in square meters?'
);

insert into public.booking_questions(category, question, type, choices, required, order_index)
select 'cleaning', 'How many rooms need cleaning?', 'number', null, true, 2
where not exists (
  select 1 from public.booking_questions
  where category = 'cleaning' and question = 'How many rooms need cleaning?'
);

insert into public.booking_questions(category, question, type, choices, required, order_index)
select 'cleaning', 'Are there pets in the home?', 'choice', '["yes", "no"]'::jsonb, true, 3
where not exists (
  select 1 from public.booking_questions
  where category = 'cleaning' and question = 'Are there pets in the home?'
);

insert into public.booking_questions(category, question, type, choices, required, order_index)
select 'cleaning', 'How often do you need cleaning?', 'choice', '["once_off", "weekly", "bi_weekly", "monthly"]'::jsonb, true, 4
where not exists (
  select 1 from public.booking_questions
  where category = 'cleaning' and question = 'How often do you need cleaning?'
);

insert into public.booking_questions(category, question, type, choices, required, order_index)
select 'cleaning', 'Upload photos of high-priority areas', 'photo', null, false, 5
where not exists (
  select 1 from public.booking_questions
  where category = 'cleaning' and question = 'Upload photos of high-priority areas'
);

insert into public.booking_questions(category, question, type, choices, required, order_index)
select 'plumbing', 'What plumbing issue are you experiencing?', 'choice', '["leak", "blocked_drain", "burst_pipe", "install", "other"]'::jsonb, true, 1
where not exists (
  select 1 from public.booking_questions
  where category = 'plumbing' and question = 'What plumbing issue are you experiencing?'
);

insert into public.booking_questions(category, question, type, choices, required, order_index)
select 'plumbing', 'How severe is the issue?', 'choice', '["low", "medium", "high"]'::jsonb, true, 2
where not exists (
  select 1 from public.booking_questions
  where category = 'plumbing' and question = 'How severe is the issue?'
);

insert into public.booking_questions(category, question, type, choices, required, order_index)
select 'plumbing', 'Where is the issue located?', 'text', null, true, 3
where not exists (
  select 1 from public.booking_questions
  where category = 'plumbing' and question = 'Where is the issue located?'
);

insert into public.booking_questions(category, question, type, choices, required, order_index)
select 'plumbing', 'How urgent is this job?', 'choice', '["today", "this_week", "flexible"]'::jsonb, true, 4
where not exists (
  select 1 from public.booking_questions
  where category = 'plumbing' and question = 'How urgent is this job?'
);

insert into public.booking_questions(category, question, type, choices, required, order_index)
select 'plumbing', 'Upload photos of the issue', 'photo', null, false, 5
where not exists (
  select 1 from public.booking_questions
  where category = 'plumbing' and question = 'Upload photos of the issue'
);
