-- Ghar Dawae — Supabase (Postgres) schema + Row-Level Security
-- ============================================================
-- Run this in the Supabase dashboard → SQL Editor → New query → Run.
--
-- Mirrors docs/06-data-model.md (entities) and docs/08-security.md (RLS).
-- Model A: only the manager has a login (auth.users). Members are data rows.
--
-- SECURITY MODEL:
--   Every table is scoped to a family. A manager can read/write ONLY rows
--   belonging to a family they own. RLS enforces this at the database level —
--   without it, any logged-in user could read every family's medical data.

-- ------------------------------------------------------------
-- Extensions
-- ------------------------------------------------------------
create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ------------------------------------------------------------
-- families
--   The manager is the Supabase auth user (auth.uid()).
-- ------------------------------------------------------------
create table if not exists public.families (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  manager_user_id   uuid not null references auth.users (id) on delete cascade,
  created_at        timestamptz not null default now()
);
create index if not exists families_manager_idx
  on public.families (manager_user_id);

-- ------------------------------------------------------------
-- members  (tracked people — NOT logins in v1)
-- ------------------------------------------------------------
create table if not exists public.members (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references public.families (id) on delete cascade,
  name          text not null,
  avatar_type   text not null default 'preset'
                  check (avatar_type in ('preset', 'photo')),
  avatar_value  text,                 -- preset id or photo path/URL
  relation      text,                 -- e.g. Mother, Son
  date_of_birth date,                 -- store DOB if known
  age           integer,              -- else store age
  gender        text check (gender in ('male', 'female', 'other')),
  created_at    timestamptz not null default now()
);
create index if not exists members_family_idx
  on public.members (family_id);

-- ------------------------------------------------------------
-- prescriptions  (one visit/record for a member)
-- ------------------------------------------------------------
create table if not exists public.prescriptions (
  id              uuid primary key default gen_random_uuid(),
  member_id       uuid not null references public.members (id) on delete cascade,
  photo_path      text,               -- local file path
  photo_url       text,               -- Supabase Storage URL after upload
  doctor_name     text,
  visit_date      date not null default current_date,
  diagnosis_note  text,
  notes           text,
  created_at      timestamptz not null default now()
);
create index if not exists prescriptions_member_idx
  on public.prescriptions (member_id);

-- ------------------------------------------------------------
-- medicines  (many per prescription — structured for search + v2 AI)
-- ------------------------------------------------------------
create table if not exists public.medicines (
  id                uuid primary key default gen_random_uuid(),
  prescription_id   uuid not null
                      references public.prescriptions (id) on delete cascade,
  name              text not null,
  dosage            text,             -- e.g. "500mg"
  frequency         text,             -- e.g. "2x/day"
  duration          text,             -- e.g. "5 days"
  created_at        timestamptz not null default now()
);
create index if not exists medicines_prescription_idx
  on public.medicines (prescription_id);
