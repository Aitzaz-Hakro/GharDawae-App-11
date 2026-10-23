// Resolves the image to show for a stored prescription photo.
//
// Preference order:
//   1. the local file, if it still exists (offline, instant, no network);
//   2. otherwise a signed URL for the Supabase Storage backup.
//
// Case 2 is what makes a reinstalled app — or a second device — still show the
// slip. Case 1 is the common path for the phone that took the photo.

import { useEffect, useMemo, useState } from "react";

import { photoExists, photoUri } from "@/lib/photo";
import { signedPhotoUrl } from "@/lib/photo-sync";

export function usePhotoSource(
  photoPath: string | null,
  photoUrl: string | null,
): string | null {
  // Derived during render: no state, no extra pass — a local hit is the norm.
  const localUri = useMemo(
    () => (photoPath && photoExists(photoPath) ? photoUri(photoPath) : null),
    [photoPath],
  );

  // Remote result is tagged with the key it was fetched for so a previous
  // record's signed URL can never be shown under this one.
  const [remote, setRemote] = useState<{ key: string; url: string | null } | null>(
    null,
  );

  useEffect(() => {
    if (localUri || !photoUrl) return;
    let alive = true;
    signedPhotoUrl(photoUrl)
      .then((url) => {
        if (alive) setRemote({ key: photoUrl, url });
      })
      .catch(() => {
        if (alive) setRemote({ key: photoUrl, url: null });
      });
    return () => {
      alive = false;
    };
  }, [localUri, photoUrl]);

  if (localUri) return localUri;
  return remote && remote.key === photoUrl ? remote.url : null;
}
