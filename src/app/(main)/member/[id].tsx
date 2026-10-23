import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";

import { getDatabase } from "@/lib/powersync/db";
import { presetEmoji } from "@/constants/avatars";
import type { Member } from "@/lib/family";

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const db = await getDatabase();
      const row = await db.getOptional<Member>(
        "SELECT * FROM members WHERE id = ?",
        [id],
      );
      setMember(row);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

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
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ headerShown: true, title: member?.name ?? "Member" }} />
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.head}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>
            {member?.avatar_type === "preset"
              ? presetEmoji(member?.avatar_value)
              : "🧑"}
          </Text>
        </View>
        <Text style={styles.name}>{member?.name}</Text>
        <Text style={styles.sub}>
          {[member?.relation, member?.age ? `${member.age} yrs` : null, member?.gender]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </View>

      {/* Records (prescriptions + medicines) land here in M3. */}
      <View style={styles.recordsPlaceholder}>
        <Text style={styles.placeholderText}>
          Prescriptions & medicine history{"\n"}coming in the next milestone (M3)
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { color: "#C0392B", padding: 16 },
  head: { alignItems: "center", paddingVertical: 24 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F0F0F3",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEmoji: { fontSize: 48 },
  name: { fontSize: 24, fontWeight: "700", marginTop: 12 },
  sub: { fontSize: 14, color: "#60646C", marginTop: 4 },
  recordsPlaceholder: {
    margin: 20,
    padding: 24,
    borderRadius: 12,
    backgroundColor: "#F0F0F3",
    alignItems: "center",
  },
  placeholderText: { color: "#60646C", textAlign: "center", lineHeight: 22 },
});
