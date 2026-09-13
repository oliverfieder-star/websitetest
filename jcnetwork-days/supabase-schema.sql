-- Schema für die selbst gehostete Fassung des Planungsboards.
-- Im Supabase-Projekt unter SQL Editor einmal ausführen.
--
-- Eine Tabelle reicht: die App legt Sammlungen (state, helfer, schicht,
-- logi, raum, ws, abw, custom) und Einzeldokumente (config/team,
-- ops/bedarf, ops/bereiche) im selben Schlüssel-Wert-Muster ab.

create table if not exists public.jcnd (
  col        text        not null,
  id         text        not null,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (col, id)
);

create index if not exists jcnd_col_idx on public.jcnd (col);

alter table public.jcnd enable row level security;

-- ACHTUNG: Diese Regeln erlauben jedem mit dem anon-Key Lesen und Schreiben.
-- Das ist nur vertretbar, wenn die Seite selbst hinter einem Zugriffsschutz
-- liegt (z. B. Cloudflare Access). Im Board stehen Telefonnummern von
-- Helfenden -- ohne Schutz wäre das eine Datenpanne.
drop policy if exists jcnd_lesen     on public.jcnd;
drop policy if exists jcnd_anlegen   on public.jcnd;
drop policy if exists jcnd_aendern   on public.jcnd;
drop policy if exists jcnd_loeschen  on public.jcnd;

create policy jcnd_lesen    on public.jcnd for select using (true);
create policy jcnd_anlegen  on public.jcnd for insert with check (true);
create policy jcnd_aendern  on public.jcnd for update using (true) with check (true);
create policy jcnd_loeschen on public.jcnd for delete using (true);
