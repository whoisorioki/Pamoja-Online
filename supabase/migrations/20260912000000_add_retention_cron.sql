-- Nguvu Pamoja Online Platform — 90-day retention for check_ins & journal_entries
-- Architecture Authority: SOT v1.4 (§9). Gap close-out G-05.
-- Auto-deletes rows older than 90 days daily at 03:00 UTC via pg_cron.

-- pg_cron ships with hosted Supabase; enabling is idempotent.
create extension if not exists pg_cron;

-- Jobs run as the extension owner (postgres superuser on hosted Supabase),
-- which bypasses RLS — the deletion is by age only, never by token.
select cron.schedule(
  'nguvu-purge-check-ins',
  '0 3 * * *',
  $$delete from public.check_ins where created_at < now() - interval '90 days'$$
);

select cron.schedule(
  'nguvu-purge-journal-entries',
  '0 3 * * *',
  $$delete from public.journal_entries where created_at < now() - interval '90 days'$$
);

-- Rollback (run manually if ever needed):
--   select cron.unschedule('nguvu-purge-check-ins');
--   select cron.unschedule('nguvu-purge-journal-entries');
--   drop extension if exists pg_cron;