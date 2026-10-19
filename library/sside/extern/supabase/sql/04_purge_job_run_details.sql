-- Pas 4 (opțional) — Curățare cron.job_run_details (pg_cron nu șterge automat).
-- Păstrează ultimele 14 zile; rulează zilnic la 03:00 UTC (cron 5 câmpuri).

do $$
declare jid integer;
begin
  select jobid into jid from cron.job where jobname = 'sside-purge-cron-run-details' limit 1;
  if jid is not null then
    perform cron.unschedule(jid);
  end if;
end $$;

select cron.schedule(
  'sside-purge-cron-run-details',
  '0 3 * * *',
  $$
  delete from cron.job_run_details
  where end_time is not null
    and end_time < now() - interval '14 days';
  $$
);

select jobid, jobname, schedule, active from cron.job
where jobname = 'sside-purge-cron-run-details';
