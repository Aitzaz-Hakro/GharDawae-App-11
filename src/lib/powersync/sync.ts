// Sync lifecycle hook — connects PowerSync to the cloud when the manager is
// signed in, disconnects on sign-out. Mount once, near the app root.

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getDatabase } from "./db";
import { SupabaseConnector } from "./connector";

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

  return state;
}
