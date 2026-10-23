import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { useAuth } from "@/lib/auth-context";
import {
  resolveFamily,
  listMembers,
  prescriptionCounts,
  type Member,
} from "@/lib/family";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { SyncBanner } from "@/components/SyncBanner";
import { useLanguage } from "@/i18n";
import { useSyncStatus } from "@/lib/use-sync-status";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const c = useColors();
  const { t, isUrdu, toggle } = useLanguage();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Two columns with one gap. Set explicitly: with `flex: 1` an odd final card
  // stretches across the whole row.
  const cardWidth = (width - Cabinet.gutter * 2 - Cabinet.gap) / 2;
  const styles = useMemo(
    () => makeStyles(c, insets.bottom),
    [c, insets.bottom],
  );
  const sync = useSyncStatus();
  const managerId = session?.user.id;
  const [members, setMembers] = useState<Member[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
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
      const [list, countMap] = await Promise.all([
        listMembers(fam.id),
        prescriptionCounts(fam.id),
      ]);
      setMembers(list);
      setCounts(countMap);
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
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <Icon name="house-line-fill" size={24} color={c.onPrimary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Ghar Dawae</Text>
            <Text style={styles.title} accessibilityRole="header">
              {t("home.title")}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={toggle}
            hitSlop={8}
            style={({ pressed }) => [styles.langButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Change language"
          >
            <Text style={styles.langButtonText}>{isUrdu ? "EN" : "اردو"}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(main)/settings")}
            hitSlop={8}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Icon name="gear" size={24} color={c.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Pressable
          style={({ pressed }) => [styles.searchBar, pressed && styles.pressed]}
          onPress={() => router.push("/(main)/search")}
          accessibilityRole="search"
          accessibilityLabel={t("home.search")}
        >
          <Icon name="magnifying-glass" size={24} color={c.textSecondary} />
          <Text style={styles.searchPlaceholder}>{t("home.search")}</Text>
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [styles.aiCard, pressed && styles.pressed]}
        onPress={() => router.push("/(main)/assistant")}
        accessibilityRole="button"
        accessibilityLabel={t("home.askAiTitle")}
      >
        <View style={styles.aiIcon}>
          <Icon name="sparkle" size={24} color={c.onPrimary} />
        </View>
        <View style={styles.aiText}>
          <Text style={[styles.aiTitle, isUrdu && styles.urdu]}>
            {t("home.askAiTitle")}
          </Text>
          <Text style={[styles.aiBody, isUrdu && styles.urdu]}>
            {t("home.askAiBody")}
          </Text>
        </View>
      </Pressable>

      <SyncBanner status={sync} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={members}
        keyExtractor={(m) => m.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={load} tintColor={c.primary} />
        }
        ListHeaderComponent={
          members.length > 0 ? (
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle} accessibilityRole="header">
                {t("home.familyMembers")}
              </Text>
              <Text style={styles.sectionCount}>
                {members.length}{" "}
                {members.length === 1 ? t("home.person") : t("home.people")}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>{t("home.emptyTitle")}</Text>
            <Text style={styles.empty}>{t("home.emptyBody")}</Text>
            <Pressable
              style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}
              onPress={() => router.push("/(main)/member/new")}
            >
              <Text style={styles.emptyButtonText}>{t("home.addFirst")}</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => {
          const count = counts[item.id] ?? 0;
          return (
            <Pressable
              style={({ pressed }) => [
                styles.memberCard,
                { width: cardWidth },
                pressed && styles.pressed,
              ]}
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
                size={64}
              />
              <View style={styles.memberText}>
                <Text style={styles.memberName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.memberCount}>
                  {count}{" "}
                  {count === 1
                    ? t("home.prescription")
                    : t("home.prescriptions")}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />

      <View style={styles.fabWrap} pointerEvents="box-none">
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
          onPress={() => router.push("/(main)/member/new")}
          accessibilityRole="button"
          accessibilityLabel={t("home.addMember")}
        >
          <Icon name="plus-bold" size={24} color={c.onPrimary} />
          <Text style={styles.fabText}>{t("home.addMember")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemePalette, bottomInset: number) =>
  StyleSheet.create({
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
      paddingHorizontal: Cabinet.gutter,
      paddingTop: 20,
      paddingBottom: 16,
    },
    brand: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
    brandMark: {
      width: 44,
      height: 44,
      borderRadius: Radii.lg - 2,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    headerText: { flex: 1 },
    eyebrow: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.textSecondary,
    },
    title: {
      fontFamily: Fonts.headingBold,
      fontSize: FontSizes.display,
      color: c.text,
      letterSpacing: -0.4,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: Radii.lg - 2,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    langButton: {
      minHeight: 44,
      paddingHorizontal: 12,
      borderRadius: Radii.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    langButtonText: {
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.label,
      color: c.primary,
    },
    pressed: { opacity: 0.8 },
    searchWrap: { paddingHorizontal: Cabinet.gutter, paddingBottom: 14 },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 56,
      paddingHorizontal: 16,
      borderRadius: Radii.xl,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.input,
    },
    searchPlaceholder: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.textSecondary,
    },
    aiCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginHorizontal: Cabinet.gutter,
      marginBottom: 16,
      padding: 14,
      borderRadius: Cabinet.cardRadius,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.accent,
    },
    aiIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    aiText: { flex: 1, gap: 2 },
    aiTitle: {
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.body,
      color: c.onAccent,
    },
    aiBody: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.label,
      color: c.onAccent,
      opacity: 0.85,
    },
    urdu: { textAlign: "right", writingDirection: "rtl" },
    error: {
      color: c.danger,
      paddingHorizontal: Cabinet.gutter,
      paddingBottom: 8,
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
    },
    grid: {
      paddingHorizontal: Cabinet.gutter,
      paddingBottom: Cabinet.bottomInset + bottomInset,
    },
    row: { gap: Cabinet.gap },
    sectionHead: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 12,
      paddingHorizontal: 0,
      marginBottom: 12,
    },
    sectionTitle: {
      fontFamily: Fonts.heading,
      fontSize: FontSizes.title,
      color: c.text,
    },
    sectionCount: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.textSecondary,
    },
    emptyWrap: { alignItems: "center", marginTop: 48, paddingHorizontal: 12 },
    emptyTitle: {
      fontFamily: Fonts.heading,
      fontSize: FontSizes.title,
      color: c.text,
      marginBottom: 8,
      textAlign: "center",
    },
    empty: {
      textAlign: "center",
      color: c.textSecondary,
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      lineHeight: 24,
    },
    emptyButton: {
      marginTop: 20,
      backgroundColor: c.primary,
      borderRadius: Radii.xl,
      paddingHorizontal: 24,
      minHeight: 50,
      justifyContent: "center",
    },
    emptyButtonText: {
      color: c.onPrimary,
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.heading,
    },
    memberCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      padding: 16,
      gap: 12,
      marginBottom: Cabinet.gap,
    },
    memberText: { gap: 2 },
    memberName: {
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.heading,
      color: c.text,
    },
    memberCount: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.textSecondary,
    },
    fabWrap: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: bottomInset + 24,
      paddingHorizontal: Cabinet.gutter,
      alignItems: "flex-end",
    },
    fab: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minHeight: 64,
      paddingHorizontal: 24,
      borderRadius: Radii.xl,
      backgroundColor: c.primary,
    },
    fabText: {
      color: c.onPrimary,
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.heading,
    },
  });
