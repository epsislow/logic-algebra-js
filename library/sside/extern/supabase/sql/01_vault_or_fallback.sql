-- Pas 1 — Secret pentru pg_cron → Edge (Bearer = același CRON_SECRET ca la Edge Functions)
--
-- A) Încearcă Vault (funcționează pe multe proiecte chiar dacă nu apare în Extensions UI):
--    select vault.create_secret('PASTE_CRON_SECRET', 'sside_cron_secret', 'sside cron');

-- B) Dacă A dă eroare „schema vault” / „function vault.create_secret”:
--    rulează secțiunea FALLBACK de mai jos (o singură dată).

-- ========== Diagnostic (rulează și citește rezultatul) ==========
select extname, extversion
from pg_extension
where extname ilike '%vault%' or extname = 'pgsodium';

select schema_name
from information_schema.schemata
where schema_name in ('vault', 'pgsodium');

-- ========== A) Vault (preferat) ==========
-- select vault.create_secret('PASTE_CRON_SECRET', 'sside_cron_secret', 'sside cron');

-- select name, created_at from vault.secrets where name = 'sside_cron_secret';


-- ========== B) FALLBACK fără Vault (doar dev / proiect fără Vault) ==========
-- ATENȚIE: secretul stă în Postgres; nu expune schema prin API. Rotire = UPDATE.

create schema if not exists sside_private;

create table if not exists sside_private.cron_bearer (
  id int primary key default 1 check (id = 1),
  secret text not null,
  updated_at timestamptz not null default now()
);

revoke all on schema sside_private from public;
revoke all on all tables in schema sside_private from public;

-- Rulează O DATĂ (înlocuiește secretul):
-- insert into sside_private.cron_bearer (secret) values ('PASTE_CRON_SECRET')
-- on conflict (id) do update set secret = excluded.secret, updated_at = now();

-- select id, updated_at from sside_private.cron_bearer;
