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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { signOut } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { deleteAccountData } from "@/lib/account";
import { useSyncStatus } from "@/lib/use-sync-status";
import { Icon, type IconName } from "@/components/Icon";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/i18n";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { t } = useLanguage();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(c, insets.bottom), [c, insets.bottom]);
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
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t("settings.title"),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: c.background },
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <Text style={styles.rowLabel}>Signed in as</Text>
          <Text style={styles.rowValue}>{session?.user.email ?? "—"}</Text>
        </View>

        <Text style={styles.sectionLabel}>{t("common.language")}</Text>
        <View style={styles.card}>
          <View style={styles.languageRow}>
            <Text style={styles.rowLabel}>{t("common.language")}</Text>
            <LanguageToggle compact />
          </View>
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

        <View style={styles.group}>
          <LinkRow
            icon="shield-check"
            label="Privacy & how your data is stored"
            onPress={() => router.push("/(main)/settings/privacy")}
          />
          <View style={styles.rule} />
          <LinkRow
            icon="sign-out"
            label="Log out"
            onPress={() => signOut()}
          />
        </View>

        <Text style={styles.sectionLabel}>Danger zone</Text>
        <Text style={styles.warningBody}>
          Deleting removes your records from this phone and from the cloud. There
          is no undo and no backup kept.
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.dangerButton,
            pressed && styles.pressed,
            busy && styles.buttonDisabled,
          ]}
          onPress={onDeleteAccount}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Delete all my data"
        >
          {busy ? (
            <ActivityIndicator color={c.danger} />
          ) : (
            <>
              <Icon name="trash" size={20} color={c.danger} />
              <Text style={styles.dangerText}>Delete my data</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

function LinkRow({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c, 0), [c]);

  return (
    <Pressable
      style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon name={icon} size={22} color={c.primary} />
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (c: ThemePalette, bottomInset: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: {
      paddingHorizontal: Cabinet.gutter,
      paddingBottom: bottomInset + 48,
    },
    sectionLabel: {
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.label,
      color: c.textSecondary,
      marginTop: 26,
      marginBottom: 8,
    },
    card: {
      borderRadius: Cabinet.blockRadius,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      padding: 16,
      gap: 4,
    },
    rowLabel: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.label,
      color: c.textSecondary,
    },
    rowValue: {
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSizes.body,
      color: c.text,
    },
    rowMeta: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.label,
      color: c.textSecondary,
      marginTop: 4,
    },
    rowError: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.label,
      color: c.danger,
      marginTop: 4,
    },
    languageRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      minHeight: 44,
    },
    group: {
      marginTop: 16,
      borderRadius: Cabinet.blockRadius,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      paddingHorizontal: 16,
    },
    rule: { height: Cabinet.rule, backgroundColor: c.border },
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 16,
      minHeight: 56,
    },
    linkText: {
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSizes.body,
      color: c.primary,
      flex: 1,
    },
    pressed: { opacity: 0.8 },
    warningBody: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.label,
      color: c.textSecondary,
      lineHeight: 21,
      marginBottom: 16,
    },
    dangerButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: Radii.xl,
      borderWidth: 1,
      borderColor: c.danger,
      minHeight: Cabinet.actionHeight,
    },
    buttonDisabled: { opacity: 0.6 },
    dangerText: {
      color: c.danger,
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.body,
    },
  });
