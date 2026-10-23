// Live sync status for the UI.
//
// PowerSync already knows whether it is connected, syncing, or holding pending
// writes — the app just wasn't showing it. A read-only app that silently fails
// to back up is worse than one that says "not backed up yet", so this surfaces
// the status as a small banner instead of burying it.
//
// `pendingChanges` is deliberately "writes waiting to upload", not "connected".
// Offline is a normal state for this app, not an error — the banner only
// appears when there is something the user would want to know.

import { useEffect, useState } from "react";

import { getDatabase } from "@/lib/powersync/db";
import { useAuth } from "@/lib/auth-context";

export type SyncState = "idle" | "syncing" | "offline" | "error";

export type SyncStatusInfo = {
  state: SyncState;
  /** True while local writes are waiting to reach the cloud. */
  hasPendingUploads: boolean;
  pendingUploads: number;
  lastSyncedAt: Date | null;
  message: string | null;
};

const IDLE: SyncStatusInfo = {
  state: "idle",
  hasPendingUploads: false,
  pendingUploads: 0,
  lastSyncedAt: null,
  message: null,
};

export function useSyncStatus(): SyncStatusInfo {
  const { session } = useAuth();
  const [info, setInfo] = useState<SyncStatusInfo>(IDLE);

  useEffect(() => {
    // Not signed in: nothing syncs, and the auth gate is redirecting.
    if (!session) return;

    let alive = true;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      const db = await getDatabase();
      if (!alive) return;

      const apply = (status: {
        connected: boolean;
        connecting: boolean;
        uploading: boolean;
        downloading: boolean;
        hasSynced?: boolean;
        lastSyncedAt?: Date;
        uploadError?: Error;
        downloadError?: Error;
      }) => {
        if (!alive) return;
        const err = status.uploadError ?? status.downloadError;
        const busy = status.uploading || status.downloading || status.connecting;

        setInfo((prev) => ({
          state: err ? "error" : busy ? "syncing" : status.connected ? "idle" : "offline",
          // Keep the previous count; refreshing it is a separate async call.
          hasPendingUploads: prev.hasPendingUploads,
          pendingUploads: prev.pendingUploads,
          lastSyncedAt: status.lastSyncedAt ?? prev.lastSyncedAt,
          message: err ? err.message : null,
        }));

        // Separate call — it hits the DB, so keep it off the status callback.
        db.getUploadQueueStats()
          .then((stats) => {
            if (!alive) return;
            setInfo((prev) => ({
              ...prev,
              hasPendingUploads: stats.count > 0,
              pendingUploads: stats.count,
            }));
          })
          .catch(() => {
            // Stats are advisory; a failure here must not blank the banner.
          });
      };

      apply(db.currentStatus);
      unsubscribe = db.registerListener({ statusChanged: apply });
    })();

    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, [session]);

  return info;
}
