-- Ghar Dawae — Supabase Storage: prescription photo bucket policies
--
-- Bucket: `prescription-photos` (PRIVATE — created by hand in the dashboard).
--
-- Object keys are `<family_id>/<record_id>.<ext>`. Putting the family id as the
-- first path segment is what makes these policies expressible: the RLS helpers
-- from db/rls.sql take a family/member/prescription id, and
-- `storage.foldername(name)[1]` hands us that same id straight off the path.
--
-- Why policies are needed even though PowerSync uses a bypassrls role: PowerSync
-- only syncs TABLE rows. It does not upload files. Every photo upload/download
-- goes through the normal supabase-js storage client as the logged-in manager,
-- so these policies are the only thing standing between families.
--
-- Run this AFTER db/rls.sql (it uses owns_prescription / owns_family).
-- Apply via: Supabase dashboard → SQL Editor → paste → Run.

-- ---------------------------------------------------------------------------
-- READ: a manager may fetch a photo that belongs to their own family, OR one
-- whose owning prescription is theirs (belt-and-braces for the re-upload case).
-- ---------------------------------------------------------------------------
create policy "family reads own prescription photos"
on storage.objects for select
to authenticated
using (
  bucket_id = 'prescription-photos'
  and (
    owns_family((storage.foldername(name))[1])
    or owns_prescription((storage.foldername(name))[2])
  )
);

-- ---------------------------------------------------------------------------
-- INSERT: uploads only into a folder for a family the manager owns.
-- ---------------------------------------------------------------------------
create policy "family uploads own prescription photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'prescription-photos'
  and owns_family((storage.foldername(name))[1])
);

-- ---------------------------------------------------------------------------
-- UPDATE: needed because storage uploads default to upsert; without this an
-- overwrite of an existing key fails the with-check.
-- ---------------------------------------------------------------------------
create policy "family replaces own prescription photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'prescription-photos'
  and owns_family((storage.foldername(name))[1])
)
with check (
  bucket_id = 'prescription-photos'
  and owns_family((storage.foldername(name))[1])
);

-- ---------------------------------------------------------------------------
-- DELETE: re-uploading a photo removes the old object, and deleting a record
-- removes its photo. Scoped to the owning folder only.
-- ---------------------------------------------------------------------------
create policy "family deletes own prescription photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'prescription-photos'
  and owns_family((storage.foldername(name))[1])
);
