import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import { addMember, getOrCreateFamily } from "@/lib/family";
import { useAuth } from "@/lib/auth-context";
import { AVATAR_PRESETS, RELATIONS } from "@/constants/avatars";

export default function NewMemberScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [name, setName] = useState("");
  const [relation, setRelation] = useState<string | null>(null);
  const [avatarId, setAvatarId] = useState(AVATAR_PRESETS[0].id);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSave() {
    if (!name.trim()) {
      Alert.alert("Name required", "Enter the member's name.");
      return;
    }
    setBusy(true);
    try {
      const fam = await getOrCreateFamily(session?.user.id ?? "local");
      await addMember(fam.id, {
        name: name.trim(),
        relation: relation ?? undefined,
        avatar_type: "preset",
        avatar_value: avatarId,
        age: age ? parseInt(age, 10) : null,
        gender,
      });
      router.back();
    } catch (e) {
      Alert.alert("Could not save", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ headerShown: true, title: "Add member" }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Avatar</Text>
        <View style={styles.avatarRow}>
          {AVATAR_PRESETS.map((a) => (
            <Pressable
              key={a.id}
              style={[
                styles.avatarChip,
                avatarId === a.id && styles.avatarChipActive,
              ]}
              onPress={() => setAvatarId(a.id)}
            >
              <Text style={styles.avatarEmoji}>{a.emoji}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Ammi"
          value={name}
          onChangeText={setName}
          editable={!busy}
        />

        <Text style={styles.label}>Relation</Text>
        <View style={styles.chipWrap}>
          {RELATIONS.map((r) => (
            <Pressable
              key={r}
              style={[styles.chip, relation === r && styles.chipActive]}
              onPress={() => setRelation(r)}
            >
              <Text
                style={[
                  styles.chipText,
                  relation === r && styles.chipTextActive,
                ]}
              >
                {r}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          placeholder="Optional"
          keyboardType="number-pad"
          value={age}
          onChangeText={setAge}
          editable={!busy}
        />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.chipWrap}>
          {(["male", "female", "other"] as const).map((g) => (
            <Pressable
              key={g}
              style={[styles.chip, gender === g && styles.chipActive]}
              onPress={() => setGender(g)}
            >
              <Text
                style={[styles.chipText, gender === g && styles.chipTextActive]}
              >
                {g}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.button, busy && styles.buttonDisabled]}
          onPress={onSave}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save member</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, gap: 8, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: "600", marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#D0D3D9",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  avatarRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  avatarChip: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F0F0F3",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarChipActive: { borderColor: "#208AEF" },
  avatarEmoji: { fontSize: 26 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F0F3",
  },
  chipActive: { backgroundColor: "#208AEF" },
  chipText: { color: "#333", textTransform: "capitalize" },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  button: {
    backgroundColor: "#208AEF",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
