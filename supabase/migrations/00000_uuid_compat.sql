-- Supabase installs uuid-ossp in the extensions schema on hosted projects.
-- ZernFlow's initial schema calls uuid_generate_v4() unqualified, so expose
-- a public compatibility wrapper before the upstream migrations run.
create extension if not exists "uuid-ossp" with schema extensions;

create or replace function public.uuid_generate_v4()
returns uuid
language sql
volatile
as $$
  select extensions.uuid_generate_v4();
$$;
