import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { signOut } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { deleteAccountData } from "@/lib/account";
import { useSyncStatus } from "@/lib/use-sync-status";
import { FontSizes, FontWeights, Ledger, Radii } from "@/constants/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const sync = useSyncStatus();
  const [busy, setBusy] = useState(false);

  // Plain-language backup state — "offline" is normal here, not a fault.
  const backupSummary = (() => {
    if (sync.state === "error") return "Having trouble — still trying";
    if (sync.hasPendingUploads) {
      return `${sync.pendingUploads} change${sync.pendingUploads === 1 ? "" : "s"} waiting`;
    }
    if (sync.state === "syncing") return "Backing up now…";
    if (sync.state === "offline") return "Saved on this phone";
    return sync.lastSyncedAt ? "Up to date" : "Connected";
  })();

  const onDeleteAccount = useCallback(() => {
    Alert.alert(
      "Delete everything?",
      "This permanently removes your family, every member, every prescription, every medicine and every photo — from this phone AND from your account. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete everything",
          style: "destructive",
          onPress: () => {
            // Second gate: a single mis-tap must not destroy medical records.
            Alert.alert(
              "Last check",
              "Are you absolutely sure? There is no way to recover this data.",
              [
                { text: "Keep my data", style: "cancel" },
                {
                  text: "Yes, delete it all",
                  style: "destructive",
                  onPress: async () => {
                    setBusy(true);
                    try {
                      await deleteAccountData();
                      await signOut();
                    } catch (e) {
                      Alert.alert(
                        "Nothing was deleted",
                        `We could not reach the server to remove your cloud copy, so your data is still here.\n\n${(e as Error).message}`,
                      );
                    } finally {
                      setBusy(false);
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ headerShown: true, title: "Settings" }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <Text style={styles.rowLabel}>Signed in as</Text>
          <Text style={styles.rowValue}>{session?.user.email ?? "—"}</Text>
        </View>

        <Text style={styles.sectionLabel}>Backup</Text>
        <View style={styles.card}>
          <Text style={styles.rowLabel}>Status</Text>
          <Text style={styles.rowValue}>{backupSummary}</Text>
          {sync.lastSyncedAt ? (
            <Text style={styles.rowMeta}>
              Last backed up {sync.lastSyncedAt.toLocaleString()}
            </Text>
          ) : null}
          {sync.state === "error" && sync.message ? (
            <Text style={styles.rowError}>{sync.message}</Text>
          ) : null}
        </View>
        <Pressable
          style={styles.linkRow}
          onPress={() => router.push("/(main)/settings/privacy")}
        >
          <Text style={styles.linkText}>Privacy & how your data is stored</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable style={styles.linkRow} onPress={() => signOut()}>
          <Text style={styles.linkText}>Log out</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>Danger zone</Text>
        <Text style={styles.warningBody}>
          Deleting removes your records from this phone and from the cloud. There
          is no undo and no backup kept.
        </Text>
        <Pressable
          style={[styles.dangerButton, busy && styles.buttonDisabled]}
          onPress={onDeleteAccount}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={c.onPrimary} />
          ) : (
            <Text style={styles.dangerText}>Delete my data</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemePalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  content: { padding: 20, paddingBottom: 48 },
  sectionLabel: {
    fontSize: FontSizes.caption,
    fontWeight: "700",
    color: c.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 26,
    marginBottom: 8,
  },
  card: {
    borderRadius: Radii.md,
    backgroundColor: c.surface,
    padding: 16,
    gap: 4,
  },
  rowLabel: { fontSize: FontSizes.label, color: c.textSecondary },
  rowValue: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.heading,
    color: c.text,
  },
  rowMeta: { fontSize: FontSizes.caption, color: c.textSecondary, marginTop: 4 },
  rowError: { fontSize: FontSizes.caption, color: c.danger, marginTop: 4 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    minHeight: 52,
    borderBottomWidth: Ledger.rule,
    borderBottomColor: c.border,
  },
  linkText: {
    fontSize: FontSizes.body,
    color: c.primary,
    fontWeight: FontWeights.heading,
  },
  chevron: { fontSize: 22, color: c.textSecondary },
  warningBody: {
    fontSize: FontSizes.label,
    color: c.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  dangerButton: {
    backgroundColor: c.danger,
    borderRadius: Radii.md,
    paddingVertical: 14,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  dangerText: {
    color: "#FFFFFF",
    fontSize: FontSizes.body,
    fontWeight: FontWeights.heading,
  },
});
