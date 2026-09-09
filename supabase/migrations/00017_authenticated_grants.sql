-- ============================================================
-- AUTHENTICATED ROLE GRANTS
-- ============================================================
-- RLS policies decide which rows authenticated users may access,
-- but PostgreSQL object privileges must also allow the operation.
-- Without these grants, Supabase returns "permission denied" before
-- the RLS policies can be evaluated.

-- Allow authenticated users to resolve objects in the public schema.
grant usage on schema public to authenticated;

-- Allow normal application CRUD. Existing RLS policies continue to
-- restrict every operation to rows the signed-in user is allowed to use.
grant select, insert, update, delete
on all tables in schema public
to authenticated;

-- Support current/future sequence-backed columns.
grant usage, select
on all sequences in schema public
to authenticated;

-- Keep future tables/sequences created by migrations usable by the app.
alter default privileges in schema public
grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
grant usage, select on sequences to authenticated;
