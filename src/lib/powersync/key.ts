// Encryption key for the local SQLCipher database.
//
// The key lives in expo-secure-store (Android Keystore / iOS Keychain) — never
// hard-coded, never in AsyncStorage. Generated once on first run (random 256-bit)
// and reused thereafter. If the key is lost, the DB is unreadable (correct for
// at-rest encryption; a re-login / resync restores data from cloud in M2 step 2).

import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const KEY_NAME = "ghardawae.db.encryptionKey";

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Returns the DB encryption key, creating + persisting one on first call. */
export async function getDbEncryptionKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(KEY_NAME);
  if (existing) return existing;

  // 32 random bytes = 256-bit key.
  const bytes = await Crypto.getRandomBytesAsync(32);
  const key = toHex(bytes);
  await SecureStore.setItemAsync(KEY_NAME, key);
  return key;
}

/**
 * Forget the key. Used by account deletion — without the key the encrypted
 * database file is unreadable, so this is what actually makes local data gone.
 * A later launch simply generates a fresh key.
 */
export async function clearDbEncryptionKey(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_NAME);
}
