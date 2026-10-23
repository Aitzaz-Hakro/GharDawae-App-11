import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { useAuth } from "@/lib/auth-context";
import {
  resolveFamily,
  listMembers,
  type Family,
  type Member,
} from "@/lib/family";
import { Avatar } from "@/components/Avatar";
import { Magnifier } from "@/components/Magnifier";
import { SyncBanner } from "@/components/SyncBanner";
import { useSyncStatus } from "@/lib/use-sync-status";
import {
  BottomTabInset,
  FontSizes,
  FontWeights,
  Ledger,
  Radii,
} from "@/constants/theme";

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const sync = useSyncStatus();
  const managerId = session?.user.id;
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    // No session id => nothing to resolve yet (auth gate will redirect).
    if (!managerId) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const fam = await resolveFamily(managerId);
      setFamily(fam);
      setMembers(await listMembers(fam.id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [managerId]);

  // Reload whenever the screen regains focus (e.g. after adding a member).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>{family?.name ?? "My Family"}</Text>
          <Text style={styles.title} accessibilityRole="header">
            Family
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/(main)/settings")}
          hitSlop={8}
          style={styles.settingsBtn}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <Text style={styles.settingsText}>⚙︎</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.searchBar}
        onPress={() => router.push("/(main)/search")}
        accessibilityRole="search"
        accessibilityLabel="Search medicines, doctors or family members"
      >
        <Magnifier size={17} color={c.textSecondary} />
        <Text style={styles.searchPlaceholder}>
          Medicine, doctor or family member
        </Text>
      </Pressable>

      <SyncBanner status={sync} />

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={members}
        keyExtractor={(m) => m.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={load}
            tintColor={c.primary}
          />
        }
        ListHeaderComponent={
          members.length > 0 ? (
            <Text style={styles.sectionLabel}>Who needs a medicine</Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No family members yet</Text>
            <Text style={styles.empty}>
              Add the people you care for — Ammi, Baba, the kids — then photograph
              their prescriptions as you go.
            </Text>
            <Pressable
              style={styles.emptyButton}
              onPress={() => router.push("/(main)/member/new")}
            >
              <Text style={styles.emptyButtonText}>Add your first member</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.memberCard}
            onPress={() => router.push(`/(main)/member/${item.id}`)}
            accessibilityRole="button"
            accessibilityLabel={
              item.relation ? `${item.name}, ${item.relation}` : item.name
            }
          >
            <Avatar
              name={item.name}
              type={item.avatar_type}
              value={item.avatar_value}
              size={68}
            />
            <Text style={styles.memberName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.relation ? (
              <Text style={styles.memberRelation} numberOfLines={1}>
                {item.relation}
              </Text>
            ) : null}
          </Pressable>
        )}
      />

      <Pressable
        style={styles.fab}
        onPress={() => router.push("/(main)/member/new")}
        accessibilityRole="button"
        accessibilityLabel="Add a family member"
      >
        <Text style={styles.fabText}>＋</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemePalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: c.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerText: { flex: 1 },
  eyebrow: {
    fontSize: FontSizes.caption,
    color: c.textSecondary,
    fontWeight: FontWeights.label,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    fontSize: FontSizes.display,
    fontWeight: FontWeights.display,
    color: c.text,
    letterSpacing: -0.4,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsText: { fontSize: 24, color: c.text },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 4,
    borderRadius: Radii.md,
    backgroundColor: c.surface,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  searchPlaceholder: { color: c.textSecondary, fontSize: FontSizes.body },
  error: { color: c.danger, paddingHorizontal: 20, paddingBottom: 8 },
  grid: { paddingHorizontal: 12, paddingBottom: BottomTabInset + 72 },
  row: { justifyContent: "flex-start" },
  sectionLabel: {
    paddingHorizontal: 8,
    paddingTop: 20,
    paddingBottom: 4,
    fontSize: FontSizes.caption,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: c.textSecondary,
  },
  empty: {
    textAlign: "center",
    color: c.textSecondary,
    marginTop: 8,
    fontSize: FontSizes.body,
    lineHeight: 24,
  },
  emptyWrap: { alignItems: "center", marginTop: 48, paddingHorizontal: 24 },
  emptyTitle: {
    fontSize: FontSizes.heading,
    fontWeight: FontWeights.heading,
    marginBottom: 4,
    color: c.text,
  },
  emptyButton: {
    marginTop: 20,
    backgroundColor: c.primary,
    borderRadius: Radii.md,
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 48,
    justifyContent: "center",
  },
  emptyButtonText: {
    color: c.onPrimary,
    fontWeight: FontWeights.heading,
    fontSize: FontSizes.body,
  },
  memberCard: {
    width: "33.33%",
    alignItems: "center",
    paddingVertical: 14,
  },
  memberName: {
    marginTop: 10,
    fontWeight: FontWeights.heading,
    fontSize: FontSizes.body,
    maxWidth: "90%",
    color: c.text,
  },
  memberRelation: {
    fontSize: FontSizes.caption,
    color: c.textSecondary,
    maxWidth: "90%",
    marginTop: 2,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: BottomTabInset + 24,
    width: 60,
    height: 60,
    borderRadius: Radii.pill,
    backgroundColor: c.accent,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: Ledger.rule,
    borderColor: c.accentPressed,
  },
  fabText: { color: c.onAccent, fontSize: 30, lineHeight: 34 },
});
