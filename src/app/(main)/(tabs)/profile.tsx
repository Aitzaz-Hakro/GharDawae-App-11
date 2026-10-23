import { useCallback, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import Constants from "expo-constants";

import { useColors } from "@/constants/useColors";
import { useAuth } from "@/lib/auth-context";
import { signOut } from "@/lib/auth";
import { resolveFamily } from "@/lib/family";
import { familyOverview, type FamilyOverview } from "@/lib/dashboard";
import { useSyncStatus } from "@/lib/use-sync-status";
import { Icon } from "@/components/Icon";
import { FadeIn } from "@/components/ui/FadeIn";
import { PressableScale } from "@/components/ui/PressableScale";
import { Screen, ScreenScroll } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FontSizes, Fonts, Radii } from "@/constants/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const c = useColors();
  const sync = useSyncStatus();
  const managerId = session?.user.id;

  const [overview, setOverview] = useState<FamilyOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      if (!managerId) return;
      resolveFamily(managerId)
        .then((family) => familyOverview(family.id))
        .then((data) => {
          if (alive) {
            setOverview(data);
            setError(null);
          }
        })
        .catch((e) => {
          if (alive) setError((e as Error).message);
        });
      return () => {
        alive = false;
      };
    }, [managerId]),
  );

  const email = session?.user.email ?? "—";
  const initial = email.trim().charAt(0).toUpperCase() || "G";
  const version = Constants.expoConfig?.version ?? "1.0.0";

  const backup = useMemo(() => {
    if (sync.state === "error") return "Having trouble — still trying";
    if (sync.hasPendingUploads) {
      return `${sync.pendingUploads} change${sync.pendingUploads === 1 ? "" : "s"} waiting`;
    }
    if (sync.state === "syncing") return "Backing up now…";
    if (sync.state === "offline") return "Saved on this phone";
    return sync.lastSyncedAt ? "Up to date" : "Connected";
  }, [sync]);

  function confirmSignOut() {
    Alert.alert(
      "Log out?",
      "Your family's records stay on this phone and in your account. You can log back in any time.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log out", style: "destructive", onPress: () => signOut() },
      ],
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Profile" />

      <ScreenScroll contentContainerStyle={styles.content}>
        <FadeIn>
          <View style={[styles.identityCard, { backgroundColor: c.peach, borderColor: c.border }]}>
            <View style={[styles.monogram, { backgroundColor: c.primary }]}>
              <Text style={[styles.monogramText, { color: c.onPrimary }]}>
                {initial}
              </Text>
            </View>
            <View style={styles.identityCopy}>
              <Text style={[styles.email, { color: c.onPeach }]} numberOfLines={1}>
                {email}
              </Text>
              <Text style={[styles.role, { color: c.peachInk }]}>
                Family manager
              </Text>
            </View>
            <Icon name="shield-check" size={26} color={c.peachInk} />
          </View>
        </FadeIn>

        {error ? (
          <Text style={[styles.error, { color: c.danger }]}>{error}</Text>
        ) : null}

        <FadeIn delay={60}>
          <View style={[styles.statsCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <StatValue label="Members" value={overview?.memberCount ?? 0} />
            <View style={[styles.statRule, { backgroundColor: c.border }]} />
            <StatValue
              label="Prescriptions"
              value={overview?.prescriptionCount ?? 0}
            />
            <View style={[styles.statRule, { backgroundColor: c.border }]} />
            <StatValue label="Medicines" value={overview?.medicineCount ?? 0} />
          </View>
        </FadeIn>

        <FadeIn delay={120}>
          <SectionHeader title="Backup" />
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.rowHead}>
              <Icon name="cloud-check" size={22} color={c.primary} />
              <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, { color: c.text }]}>{backup}</Text>
                <Text style={[styles.rowMeta, { color: c.textSecondary }]}>
                  {sync.lastSyncedAt
                    ? `Last backed up ${sync.lastSyncedAt.toLocaleString()}`
                    : "Local-first records, cloud backup in the background"}
                </Text>
              </View>
            </View>
            {sync.state === "error" && sync.message ? (
              <Text style={[styles.rowError, { color: c.danger }]}>
                {sync.message}
              </Text>
            ) : null}
          </View>
        </FadeIn>

        <FadeIn delay={180}>
          <SectionHeader title="Account" />
          <View style={[styles.linkCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <LinkRow
              icon="shield-check"
              label="Privacy & your data"
              onPress={() => router.push("/(main)/settings/privacy")}
            />
            <View style={[styles.rule, { backgroundColor: c.border }]} />
            <LinkRow
              icon="gear"
              label="Settings"
              onPress={() => router.push("/(main)/settings")}
            />
            <View style={[styles.rule, { backgroundColor: c.border }]} />
            <LinkRow
              icon="sign-out"
              label="Log out"
              onPress={confirmSignOut}
              danger
            />
          </View>
        </FadeIn>

        <Text style={[styles.version, { color: c.textSecondary }]}>
          Ghar Dawae · version {version}
        </Text>
      </ScreenScroll>
    </Screen>
  );
}

function StatValue({ label, value }: { label: string; value: number }) {
  const c = useColors();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statNumber, { color: c.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function LinkRow({
  icon,
  label,
  onPress,
  danger = false,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const c = useColors();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.linkRow}
    >
      <Icon name={icon} size={22} color={danger ? c.danger : c.primary} />
      <Text
        style={[
          styles.linkText,
          { color: danger ? c.danger : c.text },
        ]}
      >
        {label}
      </Text>
      <Icon name="caret-right" size={18} color={c.textSecondary} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 },
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 18,
    marginTop: 8,
  },
  monogram: {
    width: 58,
    height: 58,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  monogramText: {
    fontFamily: Fonts.headingBold,
    fontSize: FontSizes.title,
  },
  identityCopy: { flex: 1, gap: 2 },
  email: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.body,
  },
  role: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
  },
  error: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
    marginTop: 12,
  },
  statsCard: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: Radii.xl,
    borderWidth: 1,
    paddingVertical: 16,
    marginTop: 12,
  },
  stat: { flex: 1, alignItems: "center", gap: 2, paddingHorizontal: 6 },
  statNumber: {
    fontFamily: Fonts.headingBold,
    fontSize: FontSizes.title,
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.caption,
    textAlign: "center",
  },
  statRule: { width: StyleSheet.hairlineWidth },
  card: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  rowHead: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  rowCopy: { flex: 1, gap: 2 },
  rowTitle: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.body,
  },
  rowMeta: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
    lineHeight: 20,
  },
  rowError: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
    lineHeight: 20,
  },
  linkCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  rule: { height: StyleSheet.hairlineWidth },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    minHeight: 56,
  },
  linkText: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.body,
  },
  version: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.caption,
    textAlign: "center",
    marginTop: 24,
  },
});
