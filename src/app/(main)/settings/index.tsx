import { useCallback, useState } from "react";
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

import { signOut } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { deleteAccountData } from "@/lib/account";
import { useSyncStatus } from "@/lib/use-sync-status";

export default function SettingsScreen() {
  const router = useRouter();
  const { session } = useAuth();
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
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.dangerText}>Delete my data</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingBottom: 48 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#60646C",
    textTransform: "uppercase",
    marginTop: 24,
    marginBottom: 8,
  },
  card: {
    borderRadius: 12,
    backgroundColor: "#F0F0F3",
    padding: 16,
    gap: 4,
  },
  rowLabel: { fontSize: 13, color: "#60646C" },
  rowValue: { fontSize: 16, fontWeight: "600" },
  rowMeta: { fontSize: 12, color: "#60646C", marginTop: 4 },
  rowError: { fontSize: 12, color: "#C0392B", marginTop: 4 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E3E5E9",
  },
  linkText: { fontSize: 16, color: "#208AEF", fontWeight: "600" },
  chevron: { fontSize: 22, color: "#9096A0" },
  warningBody: { fontSize: 14, color: "#60646C", lineHeight: 20, marginBottom: 16 },
  dangerButton: {
    backgroundColor: "#C0392B",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  dangerText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
