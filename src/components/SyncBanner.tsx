import { StyleSheet, Text, View } from "react-native";

import type { SyncStatusInfo } from "@/lib/use-sync-status";

/**
 * A one-line sync indicator. Renders nothing in the normal case, so it never
 * takes space from the family grid — it appears only when a user would want to
 * know something (pending uploads, or a sync error).
 *
 * Being offline is NOT shown as an error: this app is offline-first, and
 * shouting "offline!" at someone who is looking up their mother's medicine
 * would be noise. Only un-backed-up writes and real failures surface.
 */
export function SyncBanner({ status }: { status: SyncStatusInfo }) {
  if (status.state === "error") {
    return (
      <View style={[styles.bar, styles.error]}>
        <Text style={styles.text} numberOfLines={2}>
          Sync problem. Your records are safe on this phone — we&apos;ll keep
          trying to back them up.
        </Text>
      </View>
    );
  }

  if (status.hasPendingUploads) {
    const n = status.pendingUploads;
    return (
      <View style={[styles.bar, styles.pending]}>
        <Text style={styles.text} numberOfLines={1}>
          {n === 1
            ? "1 change waiting to back up"
            : `${n} changes waiting to back up`}
        </Text>
      </View>
    );
  }

  if (status.state === "syncing") {
    return (
      <View style={[styles.bar, styles.syncing]}>
        <Text style={styles.text} numberOfLines={1}>
          Backing up…
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: 20, paddingVertical: 6 },
  syncing: { backgroundColor: "#EAF3FE" },
  pending: { backgroundColor: "#FFF4E0" },
  error: { backgroundColor: "#FDECEA" },
  text: { fontSize: 12, color: "#40454D" },
});
