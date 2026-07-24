import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";

function mustEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function createBookingsTable() {
  const supabase = createClient(
    mustEnv("SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );

  console.log("[bookings:table] Creating bookings table...");

  const sql = `
create extension if not exists "pgcrypto";

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  seller_id uuid not null references public.seller_profiles(id) on delete cascade,
  buyer_id uuid references public.users(id) on delete set null,
  status text not null default 'pending',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'bookings_set_updated_at'
      and tgrelid = 'public.bookings'::regclass
  ) then
    create trigger bookings_set_updated_at
    before update on public.bookings
    for each row
    execute function public.update_updated_at();
  end if;
end
$$;
`;

  const { error } = await supabase.rpc("execute_sql", { sql });

  if (error) {
    throw new Error(`Failed to create bookings table: ${error.message}`);
  }

  console.log("[bookings:table] Bookings table is ready.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createBookingsTable()
    .then(() => {
      console.log("Bookings table script completed.");
      process.exit(0);
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Bookings table script failed: ${message}`);
      process.exit(1);
    });
}