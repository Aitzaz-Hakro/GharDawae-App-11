// The single PowerSync database instance for the app (one per dbFilename).
//
// Step 1 (current): used as a plain local encrypted SQLite DB — reads/writes
// work fully offline, no cloud sync yet. Step 2 wires the connector + sync rules
// so this local data syncs to Supabase.
//
// The SQLCipher encryption key comes from expo-secure-store (see key.ts) and is
// passed via sqliteOptions.encryptionKey. SQLCipher must also be enabled via
// package.json ("op-sqlite": { "sqlcipher": true }).

import { PowerSyncDatabase } from "@powersync/react-native";
import { AppSchema } from "./schema";
import { getDbEncryptionKey } from "./key";

let dbPromise: Promise<PowerSyncDatabase> | null = null;

/**
 * Returns the app's PowerSync database, creating it once (with the encryption
 * key) on first use. Await this everywhere instead of constructing directly.
 */
export function getDatabase(): Promise<PowerSyncDatabase> {
  if (!dbPromise) {
    dbPromise = getDbEncryptionKey().then(
      (encryptionKey) =>
        new PowerSyncDatabase({
          schema: AppSchema,
          database: {
            dbFilename: "ghardawae.db",
            sqliteOptions: { encryptionKey },
          },
        }),
    );
  }
  return dbPromise;
}
