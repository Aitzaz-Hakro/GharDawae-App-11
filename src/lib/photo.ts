// Photo storage for prescription slips.
//
// The camera and the image picker both hand back a URI inside the app's CACHE
// directory, and both are allowed to delete it whenever they like. So every
// captured image is copied into the app's DOCUMENT directory, which the system
// will not purge.
//
// We persist only the FILE NAME (e.g. "a1b2c3.jpg") in prescriptions.photo_path,
// not the absolute URI. Reason: on iOS the app's container path contains a UUID
// that changes on reinstall (and can change between builds), so an absolute
// path saved today is a dead link tomorrow. The directory is derived at read
// time instead — see photoUri().

import { Directory, File, Paths } from "expo-file-system";

/** Folder inside the app's documents directory that holds all slip photos. */
const PHOTO_DIR = "photos";

function photosDir(): Directory {
  const dir = new Directory(Paths.document, PHOTO_DIR);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/** A lowercase extension we recognise; anything else falls back to .jpg. */
function extFromUri(uri: string): string {
  const match = /\.([a-zA-Z0-9]{2,5})(?:\?.*)?$/.exec(uri);
  const ext = match?.[1]?.toLowerCase();
  return ext === "png" || ext === "webp" || ext === "heic" ? ext : "jpg";
}

/**
 * Copy a freshly captured/picked image into permanent app storage.
 * Returns the file NAME to store in `prescriptions.photo_path`.
 */
export async function savePhoto(sourceUri: string, id: string): Promise<string> {
  const name = `${id}.${extFromUri(sourceUri)}`;
  const source = new File(sourceUri);
  const destination = new File(photosDir(), name);
  await source.copy(destination, { overwrite: true });
  return name;
}

/**
 * Turn a stored `photo_path` value into a displayable URI.
 * Tolerates a legacy absolute `file://` value so old rows still render.
 */
export function photoUri(photoPath: string | null): string | null {
  if (!photoPath) return null;
  if (photoPath.startsWith("file://")) return photoPath;
  return new File(photosDir(), photoPath).uri;
}

/** Does the file backing this `photo_path` still exist on disk? */
export function photoExists(photoPath: string | null): boolean {
  if (!photoPath) return false;
  return new File(photoUri(photoPath)!).exists;
}

/** Best-effort removal; a missing file is not an error. */
export function deletePhoto(photoPath: string | null): void {
  const uri = photoUri(photoPath);
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Nothing to reclaim — ignore.
  }
}

/**
 * Replace a record's photo: writes the new file, then removes the old one.
 * Returns the new file name for `prescriptions.photo_path`.
 */
export async function replacePhoto(
  newSourceUri: string,
  id: string,
  oldPhotoPath: string | null,
): Promise<string> {
  const name = await savePhoto(newSourceUri, id);
  if (oldPhotoPath && oldPhotoPath !== name) deletePhoto(oldPhotoPath);
  return name;
}
