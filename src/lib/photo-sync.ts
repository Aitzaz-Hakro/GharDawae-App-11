// Prescription photo backup to Supabase Storage.
//
// Photos start life on the device only (see src/lib/photo.ts) — that is the
// offline-first promise. This module copies them up to the private
// `prescription-photos` bucket when the network allows, and records the object
// key in prescriptions.photo_url. On a reinstall, or on another device, the
// local file is gone but the row's photo_url still points at the backup.
//
// Object key: <family_id>/<record_id>.<ext>
// The leading family id is what the storage RLS policies key off
// (see db/storage.sql) — do not change the layout without updating them.

import { File } from "expo-file-system";

import { supabase } from "@/lib/supabase";
import { getDatabase } from "@/lib/powersync/db";
import { getMyFamily } from "@/lib/family";
import { photoUri } from "@/lib/photo";
import type { Prescription } from "@/lib/records";

const BUCKET = "prescription-photos";

function mimeFor(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic") return "image/heic";
  return "image/jpeg";
}

/**
 * Upload one photo and store its object key on the row.
 * Returns the object key, or null when there is nothing to upload.
 *
 * Throws on network failure — callers treat that as "try again later", not as
 * data loss, because the local file is still there.
 */
export async function uploadPhoto(
  recordId: string,
  photoPath: string,
  familyId: string,
): Promise<string | null> {
  const uri = photoUri(photoPath);
  if (!uri) return null;

  const file = new File(uri);
  if (!file.exists) return null;

  const key = `${familyId}/${recordId}.${photoPath.split(".").pop() ?? "jpg"}`;
  const bytes = await file.bytes();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(key, bytes, { contentType: mimeFor(key), upsert: true });
  if (error) throw new Error(error.message);

  const db = await getDatabase();
  await db.execute("UPDATE prescriptions SET photo_url = ? WHERE id = ?", [
    key,
    recordId,
  ]);
  return key;
}

/**
 * Back up every photo that isn't backed up yet. Runs after each sync and after
 * a record is saved, so uploads trickle up in the background.
 *
 * Best-effort: a failed row is skipped and retried on the next pass. Returns a
 * small summary so callers can surface failures without crashing.
 */
export async function syncPendingPhotos(): Promise<{
  uploaded: number;
  failed: number;
}> {
  const family = await getMyFamily();
  if (!family) return { uploaded: 0, failed: 0 };

  const db = await getDatabase();
  const pending = await db.getAll<Prescription>(
    `SELECT * FROM prescriptions
      WHERE photo_path IS NOT NULL AND photo_url IS NULL`,
  );

  let uploaded = 0;
  let failed = 0;
  for (const rx of pending) {
    if (!rx.photo_path) continue;
    try {
      await uploadPhoto(rx.id, rx.photo_path, family.id);
      uploaded += 1;
    } catch {
      failed += 1;
    }
  }
  return { uploaded, failed };
}

/**
 * A short-lived signed URL for a backed-up photo. The bucket is private, so
 * this is how another device (or a reinstalled app) shows the image.
 */
export async function signedPhotoUrl(
  key: string | null,
  expiresInSeconds = 3600,
): Promise<string | null> {
  if (!key) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(key, expiresInSeconds);
  if (error) return null;
  return data?.signedUrl ?? null;
}
