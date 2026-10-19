-- Pas 0 — SQL Editor (o dată). Sau: Database → Extensions → enable pg_cron, pg_net, vault.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Vault (pentru create_secret) — de obicei deja activ pe Supabase
create extension if not exists supabase_vault with schema vault;
