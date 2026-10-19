-- Pas 3 — După 5–10 minute: verifică apelurile HTTP (pg_net păstrează răspunsuri ~6h).

-- Job cron
select jobid, jobname, schedule, active, command from cron.job
where jobname = 'sside-cron-every-5-min';

-- Ultimele răspunsuri HTTP (status 200 = OK)
select
  id,
  status_code,
  left(content, 200) as content_preview,
  created
from net._http_response
order by created desc
limit 10;

-- Istoric rulări pg_cron (dacă extensia expune cron.job_run_details)
select *
from cron.job_run_details
where jobid = (select jobid from cron.job where jobname = 'sside-cron-every-5-min' limit 1)
order by start_time desc
limit 10;
