import { useCallback, useState } from "react";
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

import { signOut } from "@/lib/auth";
import {
  getOrCreateFamily,
  listMembers,
  type Family,
  type Member,
} from "@/lib/family";
import { presetEmoji } from "@/constants/avatars";

export default function HomeScreen() {
  const router = useRouter();
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const fam = await getOrCreateFamily();
      setFamily(fam);
      setMembers(await listMembers(fam.id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload whenever the screen regains focus (e.g. after adding a member).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.hi}>Family</Text>
          <Text style={styles.familyName}>{family?.name ?? "My Family"}</Text>
        </View>
        <Pressable onPress={() => signOut()} hitSlop={8}>
          <Text style={styles.logout}>Log out</Text>
        </Pressable>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={members}
        keyExtractor={(m) => m.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={load} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            No family members yet.{"\n"}Tap + to add your first one.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.memberCard}
            onPress={() => router.push(`/(main)/member/${item.id}`)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>
                {item.avatar_type === "preset"
                  ? presetEmoji(item.avatar_value)
                  : "🧑"}
              </Text>
            </View>
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
      >
        <Text style={styles.fabText}>＋</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  hi: { fontSize: 13, color: "#60646C" },
  familyName: { fontSize: 24, fontWeight: "700" },
  logout: { color: "#208AEF", fontWeight: "600" },
  error: { color: "#C0392B", paddingHorizontal: 20, paddingBottom: 8 },
  grid: { paddingHorizontal: 12, paddingBottom: 100 },
  row: { justifyContent: "flex-start" },
  empty: {
    textAlign: "center",
    color: "#60646C",
    marginTop: 64,
    fontSize: 15,
    lineHeight: 22,
  },
  memberCard: { width: "33.33%", alignItems: "center", paddingVertical: 14 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F0F0F3",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEmoji: { fontSize: 36 },
  memberName: { marginTop: 8, fontWeight: "600", maxWidth: "90%" },
  memberRelation: { fontSize: 12, color: "#60646C", maxWidth: "90%" },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 32,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#208AEF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: "#fff", fontSize: 32, lineHeight: 36 },
});
