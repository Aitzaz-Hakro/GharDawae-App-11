import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { useColors, type ThemePalette } from "@/constants/useColors";
import {
  countPrescriptions,
  deleteMemberDeep,
  updateMember,
  type Member,
} from "@/lib/family";
import { getDatabase } from "@/lib/powersync/db";
import { deletePhoto } from "@/lib/photo";
import {
  AVATAR_TINTS,
  RELATIONS,
  avatarTintForStoredValue,
} from "@/constants/avatars";
import { Avatar } from "@/components/Avatar";
import { FontSizes, FontWeights, Radii } from "@/constants/theme";

export default function EditMemberScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [relation, setRelation] = useState<string | null>(null);
  const [avatarId, setAvatarId] = useState(AVATAR_TINTS[0].id);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!id) return;
      try {
        const db = await getDatabase();
        const row = await db.getOptional<Member>(
          "SELECT * FROM members WHERE id = ?",
          [id],
        );
        if (!alive) return;
        if (row) {
          setMember(row);
          setName(row.name);
          setRelation(row.relation);
          setAvatarId(
            row.avatar_type === "preset"
              ? avatarTintForStoredValue(row.avatar_value).id
              : AVATAR_TINTS[0].id,
          );
          setAge(row.age != null ? String(row.age) : "");
          setGender(row.gender);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  async function onSave() {
    if (!member) return;
    if (!name.trim()) {
      Alert.alert("Name required", "Enter the member's name.");
      return;
    }
    setBusy(true);
    try {
      await updateMember(member.id, {
        name: name.trim(),
        relation: relation,
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

  function onDelete() {
    if (!member) return;
    (async () => {
      const count = await countPrescriptions(member.id);
      const detail =
        count > 0
          ? `This also deletes ${count} prescription${count === 1 ? "" : "s"}, all their medicines and their photos. This cannot be undone.`
          : "This cannot be undone.";

      Alert.alert(`Delete ${member.name}?`, detail, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const photos = await deleteMemberDeep(member.id);
              for (const p of photos) deletePhoto(p);
              router.back();
            } catch (e) {
              Alert.alert("Could not delete", (e as Error).message);
            }
          },
        },
      ]);
    })();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!member) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <Stack.Screen options={{ headerShown: true, title: "Edit member" }} />
        <View style={styles.center}>
          <Text style={styles.error}>That member no longer exists.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ headerShown: true, title: "Edit member" }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
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
                  name={name || member?.name}
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
                <Text style={[styles.chipText, relation === r && styles.chipTextActive]}>
                  {r}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
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
                <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>
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
              <Text style={styles.buttonText}>Save changes</Text>
            )}
          </Pressable>

          <Pressable style={styles.deleteButton} onPress={onDelete} disabled={busy}>
            <Text style={styles.deleteText}>Delete member</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemePalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  flex: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: c.background,
  },
  error: { color: c.danger },
  content: { padding: 20, gap: 8, paddingBottom: 48 },
  label: {
    fontSize: FontSizes.label,
    fontWeight: FontWeights.heading,
    marginTop: 14,
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
  deleteButton: {
    marginTop: 20,
    paddingVertical: 14,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    color: c.danger,
    fontWeight: FontWeights.heading,
    fontSize: FontSizes.body,
  },
});
