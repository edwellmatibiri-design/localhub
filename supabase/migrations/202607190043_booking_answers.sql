create table if not exists public.booking_answers (
  id bigserial primary key,
  booking_id bigint not null,
  question_id bigint not null,
  answer text not null,
  created_at timestamp not null default now()
);

create index if not exists idx_booking_answers_booking_id on public.booking_answers(booking_id);
create index if not exists idx_booking_answers_question_id on public.booking_answers(question_id);
