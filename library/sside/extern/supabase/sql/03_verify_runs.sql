-- Pas 3 — După 5–10 minute: verifică apelurile HTTP (pg_net păstrează răspunsuri ~6h).

-- Job cron
select jobid, jobname, schedule, active, command from cron.job
where jobname = 'sside-cron-every-5-min';

-- Ultimele răspunsuri HTTP (status 200 = OK) — preview scurt (grid Supabase taie celula)
select
  id,
  status_code,
  left(content, 200) as content_preview,
  created
from net._http_response
order by created desc
limit 10;

-- Răspuns tick complet (câmpuri JSON)
select
  created,
  status_code,
  (content::jsonb)->>'tickAt' as tick_at,
  (content::jsonb)->>'edgeJobs' as edge_jobs,
  (content::jsonb)->'executions' as executions,
  length(content) as content_bytes
from net._http_response
where status_code = 200
  and content like '%"cronHost":"edge"%'
order by created desc
limit 5;

-- Istoric rulări pg_cron (dacă extensia expune cron.job_run_details)
select *
from cron.job_run_details
where jobid = (select jobid from cron.job where jobname = 'sside-cron-every-5-min' limit 1)
order by start_time desc
limit 10;
