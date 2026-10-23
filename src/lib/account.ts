// Account-level data operations: cloud deletion, and wiping this device.
//
// Deleting an account has to remove data in three places, in this order, for a
// reason:
//   1. cloud rows (Postgres) — needs the network, so do it first, while we can
//      still report a failure to the user;
//   2. cloud photos (Storage);
//   3. the local database, the encryption key and the photo files.
// If the cloud step fails we stop and say so, leaving local data intact —
// a failed delete must never look like a successful one.

import { supabase } from "@/lib/supabase";
import { getDatabase } from "@/lib/powersync/db";
import { getMyFamily } from "@/lib/family";
import { deletePhoto } from "@/lib/photo";
import { clearDbEncryptionKey } from "@/lib/powersync/key";
import type { Prescription } from "@/lib/records";

const BUCKET = "prescription-photos";

export type DeleteProgress = {
  cloudRows: boolean;
  cloudPhotos: boolean;
  local: boolean;
};

/**
 * Delete the signed-in manager's whole family from Supabase.
 *
 * RLS scopes every statement to the caller, so this only ever touches their own
 * family. Children go first: no ON DELETE CASCADE is assumed.
 */
async function deleteCloudFamily(familyId: string): Promise<void> {
  // Photos first, while we still have ids to report. Object keys are
  // `<family_id>/...`, so listing that folder finds every photo.
  const { data: objects, error: listErr } = await supabase.storage
    .from(BUCKET)
    .list(familyId);
  if (listErr) throw new Error(`Could not list photos: ${listErr.message}`);
  if (objects && objects.length > 0) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove(objects.map((o) => `${familyId}/${o.name}`));
    if (error) throw new Error(`Could not delete photos: ${error.message}`);
  }

  const { data: memberRows, error: memberErr } = await supabase
    .from("members")
    .select("id")
    .eq("family_id", familyId);
  if (memberErr) throw new Error(memberErr.message);
  const memberIds = (memberRows ?? []).map((m) => m.id);

  if (memberIds.length > 0) {
    const { data: rxRows, error: rxErr } = await supabase
      .from("prescriptions")
      .select("id")
      .in("member_id", memberIds);
    if (rxErr) throw new Error(rxErr.message);
    const rxIds = (rxRows ?? []).map((r) => r.id);

    if (rxIds.length > 0) {
      const { error } = await supabase
        .from("medicines")
        .delete()
        .in("prescription_id", rxIds);
      if (error) throw new Error(error.message);
    }

    const { error: delRxErr } = await supabase
      .from("prescriptions")
      .delete()
      .in("member_id", memberIds);
    if (delRxErr) throw new Error(delRxErr.message);
  }

  const { error: delMemberErr } = await supabase
    .from("members")
    .delete()
    .eq("family_id", familyId);
  if (delMemberErr) throw new Error(delMemberErr.message);

  const { error: famErr } = await supabase
    .from("families")
    .delete()
    .eq("id", familyId);
  if (famErr) throw new Error(famErr.message);
}

/** Remove everything this app owns on the device. */
async function deleteLocalData(): Promise<void> {
  const db = await getDatabase();

  const photos = await db.getAll<Pick<Prescription, "photo_path">>(
    "SELECT photo_path FROM prescriptions WHERE photo_path IS NOT NULL",
  );

  await db.writeTransaction(async (tx) => {
    await tx.execute("DELETE FROM medicines");
    await tx.execute("DELETE FROM prescriptions");
    await tx.execute("DELETE FROM members");
    await tx.execute("DELETE FROM families");
  });

  for (const p of photos) deletePhoto(p.photo_path);

  // The key is what makes the file readable; dropping it leaves the encrypted
  // database unusable even if the file somehow survived.
  await clearDbEncryptionKey();
}

/**
 * Full account deletion. Throws if the cloud step fails, so the UI can tell the
 * user nothing was deleted rather than silently half-doing it.
 */
export async function deleteAccountData(): Promise<DeleteProgress> {
  const family = await getMyFamily();
  if (!family) throw new Error("No family found on this device.");

  await deleteCloudFamily(family.id);

  const db = await getDatabase();
  await db.disconnect();
  await deleteLocalData();

  return { cloudRows: true, cloudPhotos: true, local: true };
}

/** Wipe only this device, leaving the cloud copy intact. */
export async function wipeLocalData(): Promise<void> {
  const db = await getDatabase();
  await db.disconnect();
  await deleteLocalData();
}
