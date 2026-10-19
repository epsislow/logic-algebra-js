-- Pas 2 — Programează smoke la fiecare 5 minute (proiect sSide).

do $$
declare jid integer;
begin
  select jobid into jid from cron.job where jobname = 'sside-cron-every-5-min' limit 1;
  if jid is not null then
    perform cron.unschedule(jid);
  end if;
end $$;

select cron.schedule(
  'sside-cron-every-5-min',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://zbfooybgkhrngyiwdxal.supabase.co/functions/v1/sside-cron-run',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', (
        select 'Bearer ' || decrypted_secret
        from vault.decrypted_secrets
        where name = 'sside_cron_secret'
        limit 1
      )
    ),
    body := '{"mode":"tick"}'::jsonb
  ) as request_id;
  $$
);

-- Verificare job
select jobid, jobname, schedule, active from cron.job where jobname = 'sside-cron-every-5-min';
