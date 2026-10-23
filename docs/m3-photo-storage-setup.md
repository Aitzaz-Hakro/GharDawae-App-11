# M3 — Prescription photo backup to Supabase Storage

Photos must outlive the phone. This wires the local photo files up to the
private `prescription-photos` bucket so a reinstalled app — or a second
device — can still show the slip.

## What you need to do

You already created the bucket. **One step remains: run the storage policies.**

1. Supabase dashboard → your project → **SQL Editor** → New query.
2. Paste the whole of `db/storage.sql` and **Run**.
3. Confirm: dashboard → **Storage** → `prescription-photos` → Policies tab
   shows four policies, all for the `authenticated` role.

Without those policies every upload fails. The bucket is private, so the
default is "no access" — the policies are what grant a manager access to their
own family's folder.

Run it *after* `db/rls.sql`, because the policies call the same
`owns_family()` / `owns_prescription()` helpers.

## How it works

**Object key layout:** `<family_id>/<record_id>.<ext>`

Example: `a1b2c3d4-..../e5f6a7b8-....jpg`

The leading family id is load-bearing. `storage.foldername(name)[1]` returns it
straight off the path, which is what lets a policy say "you may only touch
objects inside your own family's folder" in one line. Do not change this layout
without updating `db/storage.sql`.

**When uploads happen:** `src/lib/photo-sync.ts` → `syncPendingPhotos()`, called
from `usePowerSyncSync()` on sign-in and then every 60 s. It picks up every
prescription with a `photo_path` but no `photo_url`, uploads the file, and
writes the object key into `photo_url`.

Best-effort by design: a row that fails (offline, slow) is skipped and retried
on the next pass. The local file is never deleted by a failure.

**When downloads happen:** `usePhotoSource()` (`src/lib/use-photo-source.ts`).
Preference order:
1. local file, if it still exists — offline, instant, no network;
2. else a short-lived **signed URL** for the backup.

The bucket is private, so there is no public URL to store. A signed URL is
minted on demand, scoped to one object, and expires (1 hour by default).

## Why this isn't part of PowerSync

PowerSync syncs **table rows**. It does not move files. Every photo goes up
through the ordinary supabase-js storage client as the logged-in manager, which
is exactly why the RLS policies in `db/storage.sql` are the only thing
separating one family's photos from another's.

## Deletion

Deleting a record removes the local photo file (`deletePhoto`). The uploaded
copy is left in the bucket — harmless, since the row that referenced it is gone,
and the bucket is private. A cleanup job can sweep orphans later; not worth the
complexity for v1.

## Files

| File | Role |
|------|------|
| `db/storage.sql` | Bucket policies — **run this in Supabase** |
| `src/lib/photo-sync.ts` | Upload, pending-photo sweep, signed URLs |
| `src/lib/use-photo-source.ts` | Local-then-remote image resolution hook |
| `src/lib/photo.ts` | Local file storage (unchanged) |
| `src/lib/powersync/sync.ts` | Kicks off the periodic upload sweep |
