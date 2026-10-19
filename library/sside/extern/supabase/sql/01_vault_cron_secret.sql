-- Pas 1 — Secret cron. Dacă Vault lipsește din Extensions UI, folosește 01_vault_or_fallback.sql

-- O SINGURĂ DATĂ: același string ca secretul Edge CRON_SECRET (NU service_role).
--
-- Varianta A — SQL (înlocuiește DOAR între ghilimele de la primul argument):
--   select vault.create_secret('PASTE_CRON_SECRET_AICI', 'sside_cron_secret', 'Bearer cron Edge');
--
-- Varianta B — Dashboard → Database → Vault → New secret
--   Name: sside_cron_secret
--   Secret: (valoarea CRON_SECRET de la Edge Functions)
--
-- Dacă secretul există deja și vrei să-l schimbi, șterge-l din Vault UI sau creează alt nume
-- și actualizează 02_pg_cron_schedule.sql (where name = '...').

-- Decomentează și rulează o singură dată după ce înlocuiești:
-- select vault.create_secret('PASTE_CRON_SECRET_AICI', 'sside_cron_secret', 'sside cron Bearer');

-- Verificare (ar trebui 1 rând, fără a afișa secretul în clar în logs publice):
select name, description, created_at
from vault.secrets
where name = 'sside_cron_secret';
