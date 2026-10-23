import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";
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
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  if (status.state === "error") {
    return (
      <View style={[styles.bar, styles.error]}>
        <Text style={[styles.text, styles.errorText]} numberOfLines={2}>
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
        <Text style={[styles.text, styles.pendingText]} numberOfLines={1}>
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
        <Text style={[styles.text, styles.syncingText]} numberOfLines={1}>
          Backing up…
        </Text>
      </View>
    );
  }

  return null;
}

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    bar: {
      marginHorizontal: Cabinet.gutter,
      marginBottom: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: Radii.md,
    },
    syncing: { backgroundColor: c.infoSurface },
    pending: { backgroundColor: c.warningSurface },
    error: { backgroundColor: c.surfaceSelected },
    text: { fontFamily: Fonts.bodyMedium, fontSize: FontSizes.label },
    syncingText: { color: c.infoText },
    pendingText: { color: c.warningText },
    errorText: { color: c.danger },
  });
