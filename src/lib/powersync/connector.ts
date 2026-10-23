// PowerSync <-> Supabase backend connector (Step 2 — cloud sync).
//
// PowerSync calls these two methods:
//   - fetchCredentials(): give it the PowerSync instance URL + a valid JWT so it
//     can open a sync connection as the logged-in manager.
//   - uploadData(): push queued LOCAL writes up to Supabase (which RLS protects).
//
// Sync DOWN (cloud -> local) is handled by PowerSync's sync rules on the server,
// which we scope to the manager's own family (see docs/m2-powersync-sync-rules).
//
// Reference: PowerSync Supabase guide.

import type {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncBackendConnector,
  PowerSyncCredentials,
} from "@powersync/react-native";
import { UpdateType } from "@powersync/react-native";

import { supabase } from "@/lib/supabase";

const POWERSYNC_URL = process.env.EXPO_PUBLIC_POWERSYNC_URL ?? "";

// Postgres error codes that are NOT worth retrying (bad data / constraint /
// privilege). A permanent 4xx here would block the upload queue, so we choose
// to drop the batch rather than stall forever.
const FATAL_RESPONSE_CODES = [
  /^22...$/, // data exception
  /^23...$/, // integrity constraint violation
  /^42501$/, // insufficient privilege
];

export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials(): Promise<PowerSyncCredentials | null> {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw new Error(`Could not fetch Supabase session: ${error.message}`);
    }
    if (!session) {
      return null; // not signed in — PowerSync stays disconnected
    }

    return {
      endpoint: POWERSYNC_URL,
      token: session.access_token,
      expiresAt: session.expires_at
        ? new Date(session.expires_at * 1000)
        : undefined,
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) return;

    let lastOp: CrudEntry | null = null;
    try {
      for (const op of transaction.crud) {
        lastOp = op;
        const table = supabase.from(op.table);

        switch (op.op) {
          case UpdateType.PUT: {
            const record = { ...op.opData, id: op.id };
            const { error } = await table.upsert(record);
            if (error) throw error;
            break;
          }
          case UpdateType.PATCH: {
            const { error } = await table.update(op.opData ?? {}).eq("id", op.id);
            if (error) throw error;
            break;
          }
          case UpdateType.DELETE: {
            const { error } = await table.delete().eq("id", op.id);
            if (error) throw error;
            break;
          }
        }
      }
      // Marks the batch synced. MANDATORY — without it the queue stalls.
      await transaction.complete();
    } catch (ex: unknown) {
      const err = ex as { code?: string; message?: string };
      if (err.code && FATAL_RESPONSE_CODES.some((r) => r.test(err.code!))) {
        // Unrecoverable: drop the batch so the queue doesn't block forever.
        console.error("PowerSync: dropping fatal upload batch", lastOp, err);
        await transaction.complete();
      } else {
        // Transient: rethrow — PowerSync retries after the configured wait.
        throw ex;
      }
    }
  }
}
