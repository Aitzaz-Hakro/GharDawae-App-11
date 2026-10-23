-- Ghar Dawae — Row-Level Security policies
-- =========================================
-- Run AFTER db/schema.sql, in Supabase SQL Editor.
--
-- Rule (docs/08-security.md): a manager can access ONLY rows belonging to a
-- family they own (families.manager_user_id = auth.uid()). Child tables inherit
-- the check by walking up to their family.
--
-- WITHOUT these policies + RLS enabled, any authenticated user could read every
-- family's records. This is the single most important control in the app.

-- ------------------------------------------------------------
-- Enable RLS on every table (deny-all until a policy allows)
-- ------------------------------------------------------------
alter table public.families      enable row level security;
alter table public.members       enable row level security;
alter table public.prescriptions enable row level security;
alter table public.medicines     enable row level security;

-- ------------------------------------------------------------
-- Helper: does the current user own this family?
-- ------------------------------------------------------------
create or replace function public.owns_family(fid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.families f
    where f.id = fid and f.manager_user_id = auth.uid()
  );
$$;

-- ------------------------------------------------------------
-- families: manager sees / manages only their own families
-- ------------------------------------------------------------
create policy families_select on public.families
  for select using (manager_user_id = auth.uid());
create policy families_insert on public.families
  for insert with check (manager_user_id = auth.uid());
create policy families_update on public.families
  for update using (manager_user_id = auth.uid())
             with check (manager_user_id = auth.uid());
create policy families_delete on public.families
  for delete using (manager_user_id = auth.uid());

-- ------------------------------------------------------------
-- members: scoped by owning family
-- ------------------------------------------------------------
create policy members_select on public.members
  for select using (public.owns_family(family_id));
create policy members_insert on public.members
  for insert with check (public.owns_family(family_id));
create policy members_update on public.members
  for update using (public.owns_family(family_id))
             with check (public.owns_family(family_id));
create policy members_delete on public.members
  for delete using (public.owns_family(family_id));

-- ------------------------------------------------------------
-- prescriptions: scoped by member -> family
-- ------------------------------------------------------------
create or replace function public.owns_member(mid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.members m
    join public.families f on f.id = m.family_id
    where m.id = mid and f.manager_user_id = auth.uid()
  );
$$;

create policy prescriptions_select on public.prescriptions
  for select using (public.owns_member(member_id));
create policy prescriptions_insert on public.prescriptions
  for insert with check (public.owns_member(member_id));
create policy prescriptions_update on public.prescriptions
  for update using (public.owns_member(member_id))
             with check (public.owns_member(member_id));
create policy prescriptions_delete on public.prescriptions
  for delete using (public.owns_member(member_id));

-- ------------------------------------------------------------
-- medicines: scoped by prescription -> member -> family
-- ------------------------------------------------------------
create or replace function public.owns_prescription(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.prescriptions p
    join public.members m   on m.id = p.member_id
    join public.families f  on f.id = m.family_id
    where p.id = pid and f.manager_user_id = auth.uid()
  );
$$;

create policy medicines_select on public.medicines
  for select using (public.owns_prescription(prescription_id));
create policy medicines_insert on public.medicines
  for insert with check (public.owns_prescription(prescription_id));
create policy medicines_update on public.medicines
  for update using (public.owns_prescription(prescription_id))
             with check (public.owns_prescription(prescription_id));
create policy medicines_delete on public.medicines
  for delete using (public.owns_prescription(prescription_id));
