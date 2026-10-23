// Sync lifecycle hook — connects PowerSync to the cloud when the manager is
// signed in, disconnects on sign-out. Mount once, near the app root.

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getDatabase } from "./db";
import { SupabaseConnector } from "./connector";
import { syncPendingPhotos } from "@/lib/photo-sync";

export type SyncState = {
  connected: boolean;
  error: string | null;
};

/**
 * Connects the local PowerSync DB to Supabase whenever there is a session.
 * Safe to run offline: PowerSync retries in the background.
 */
export function usePowerSyncSync(): SyncState {
  const { session } = useAuth();
  const [state, setState] = useState<SyncState>({ connected: false, error: null });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const db = await getDatabase();
      if (cancelled) return;

      if (!session) {
        await db.disconnect();
        setState({ connected: false, error: null });
        return;
      }

      try {
        await db.connect(new SupabaseConnector());
        if (!cancelled) setState({ connected: true, error: null });
      } catch (e) {
        if (!cancelled) {
          setState({ connected: false, error: (e as Error).message });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session]);

  // Photos are not part of the PowerSync stream (it syncs rows, not files), so
  // they get their own background pass whenever we're signed in. Each run is
  // best-effort and only picks up rows that aren't backed up yet.
  useEffect(() => {
    if (!session) return;
    let alive = true;

    const run = () => {
      if (!alive) return;
      syncPendingPhotos().catch(() => {
        // Offline or transient — the next tick retries.
      });
    };

    run();
    const timer = setInterval(run, 60_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [session]);

  return state;
}
