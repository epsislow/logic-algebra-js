-- Pas 2b — Cron la 5 min când NU ai Vault (după 01_vault_or_fallback secțiunea B)

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
        select 'Bearer ' || secret from sside_private.cron_bearer where id = 1 limit 1
      )
    ),
    body := '{"mode":"smoke","cronKey":"cron:testPing"}'::jsonb
  ) as request_id;
  $$
);

select jobid, jobname, schedule, active from cron.job where jobname = 'sside-cron-every-5-min';
