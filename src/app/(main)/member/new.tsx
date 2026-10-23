import { useMemo, useState } from "react";
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

import { useColors, type ThemePalette } from "@/constants/useColors";
import { addMember, resolveFamily } from "@/lib/family";
import { useAuth } from "@/lib/auth-context";
import { AVATAR_TINTS, RELATIONS } from "@/constants/avatars";
import { Avatar } from "@/components/Avatar";
import { FontSizes, FontWeights, Radii } from "@/constants/theme";

export default function NewMemberScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState<string | null>(null);
  const [avatarId, setAvatarId] = useState(AVATAR_TINTS[0].id);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSave() {
    if (!name.trim()) {
      Alert.alert("Name required", "Enter the member's name.");
      return;
    }
    const managerId = session?.user.id;
    if (!managerId) {
      Alert.alert("Not signed in", "Please log in again.");
      return;
    }
    setBusy(true);
    try {
      const fam = await resolveFamily(managerId);
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
        <View style={styles.preview}>
          <Avatar name={name || relation || "Aa"} value={avatarId} size={76} />
          <Text style={styles.previewHint}>
            Your member&apos;s first letter, in the colour you pick below.
          </Text>
        </View>

        <Text style={styles.label}>Colour</Text>
        <View style={styles.avatarRow}>
          {AVATAR_TINTS.map((a) => (
            <Pressable
              key={a.id}
              style={styles.avatarChip}
              onPress={() => setAvatarId(a.id)}
              accessibilityRole="button"
              accessibilityLabel={`Avatar colour ${a.id}`}
              accessibilityState={{ selected: avatarId === a.id }}
            >
              <Avatar
                name={name || relation || "Aa"}
                value={a.id}
                size={48}
                selected={avatarId === a.id}
                ringColor={c.primary}
              />
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Ammi"
          placeholderTextColor={c.textSecondary}
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
          placeholderTextColor={c.textSecondary}
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
            <ActivityIndicator color={c.onPrimary} />
          ) : (
            <Text style={styles.buttonText}>Save member</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemePalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  content: { padding: 20, gap: 8, paddingBottom: 40 },
  preview: { alignItems: "center", paddingVertical: 12, gap: 10 },
  previewHint: {
    fontSize: FontSizes.caption,
    color: c.textSecondary,
    textAlign: "center",
  },
  label: {
    fontSize: FontSizes.label,
    fontWeight: FontWeights.heading,
    marginTop: 12,
    color: c.text,
  },
  input: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    minHeight: 48,
    fontSize: FontSizes.body,
    color: c.text,
  },
  avatarRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  avatarChip: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: "center",
    borderRadius: Radii.pill,
    backgroundColor: c.surface,
  },
  chipActive: { backgroundColor: c.primary },
  chipText: {
    color: c.text,
    fontSize: FontSizes.label,
    textTransform: "capitalize",
  },
  chipTextActive: { color: c.onPrimary, fontWeight: "600" },
  button: {
    backgroundColor: c.primary,
    borderRadius: Radii.md,
    paddingVertical: 14,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: c.onPrimary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.heading,
  },
});
