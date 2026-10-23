import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  AVATAR_PRESETS,
  RELATIONS,
  avatarTintForStoredValue,
} from "@/constants/avatars";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { KeyboardAwareScroll } from "@/components/ui/KeyboardAwareScroll";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";

export default function EditMemberScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(c, insets.bottom), [c, insets.bottom]);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [relation, setRelation] = useState<string | null>(null);
  const [avatarId, setAvatarId] = useState(AVATAR_PRESETS[0].id);
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
              : AVATAR_PRESETS[0].id,
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
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: "Edit member" }} />
        <View style={styles.center}>
          <Text style={styles.error}>That member no longer exists.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Edit member",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: c.background },
        }}
      />
      <KeyboardAwareScroll contentContainerStyle={styles.content}>
          <Text style={styles.label}>Avatar</Text>
          <View style={styles.avatarRow}>
            {AVATAR_PRESETS.map((a) => (
              <Pressable
                key={a.id}
                style={styles.avatarChip}
                onPress={() => setAvatarId(a.id)}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={`${a.label} avatar`}
                accessibilityState={{ selected: avatarId === a.id, disabled: busy }}
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
            placeholder="e.g. Ammi"
            placeholderTextColor={c.textSecondary}
            value={name}
            onChangeText={setName}
            editable={!busy}
            returnKeyType="done"
            selectionColor={c.primary}
          />

          <Text style={styles.label}>Relation</Text>
          <View style={styles.chipWrap}>
            {RELATIONS.map((r) => (
              <Pressable
                key={r}
                style={[styles.chip, relation === r && styles.chipActive]}
                onPress={() => setRelation(r)}
                accessibilityRole="button"
                accessibilityState={{ selected: relation === r }}
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
            placeholder="Optional"
            placeholderTextColor={c.textSecondary}
            keyboardType="number-pad"
            value={age}
            onChangeText={setAge}
            editable={!busy}
            returnKeyType="done"
            selectionColor={c.primary}
          />

          <Text style={styles.label}>Gender</Text>
          <View style={styles.chipWrap}>
            {(["male", "female", "other"] as const).map((g) => (
              <Pressable
                key={g}
                style={[styles.chip, gender === g && styles.chipActive]}
                onPress={() => setGender(g)}
                accessibilityRole="button"
                accessibilityState={{ selected: gender === g }}
              >
                <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>
                  {g}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.pressed,
              busy && styles.buttonDisabled,
            ]}
            onPress={onSave}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Save changes"
          >
            {busy ? (
              <ActivityIndicator color={c.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>Save changes</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
            onPress={onDelete}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${member.name}`}
          >
            <Icon name="trash" size={20} color={c.danger} />
            <Text style={styles.deleteText}>Delete member</Text>
          </Pressable>
      </KeyboardAwareScroll>
    </View>
  );
}
const makeStyles = (c: ThemePalette, bottomInset: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      backgroundColor: c.background,
    },
    error: {
      color: c.danger,
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
    },
    content: {
      paddingHorizontal: Cabinet.gutter,
      paddingBottom: bottomInset + 48,
    },
    label: {
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.label,
      color: c.text,
      marginTop: 18,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: Radii.lg,
      backgroundColor: c.input,
      paddingHorizontal: 16,
      minHeight: 52,
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.text,
    },
    avatarRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    avatarChip: {
      width: 56,
      height: 56,
      alignItems: "center",
      justifyContent: "center",
    },
    chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      paddingHorizontal: 16,
      minHeight: Cabinet.touchTarget,
      justifyContent: "center",
      borderRadius: Radii.pill,
      backgroundColor: c.surfaceSelected,
    },
    chipActive: { backgroundColor: c.primary },
    chipText: {
      fontFamily: Fonts.bodyMedium,
      color: c.text,
      fontSize: FontSizes.label,
      textTransform: "capitalize",
    },
    chipTextActive: { color: c.onPrimary },
    button: {
      backgroundColor: c.primary,
      borderRadius: Radii.xl,
      minHeight: Cabinet.actionHeight,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 28,
    },
    pressed: { opacity: 0.8 },
    buttonDisabled: { opacity: 0.6 },
    buttonText: {
      color: c.onPrimary,
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.heading,
    },
    deleteButton: {
      marginTop: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      minHeight: Cabinet.actionHeight,
      borderRadius: Radii.xl,
      borderWidth: 1,
      borderColor: c.danger,
    },
    deleteText: {
      color: c.danger,
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.body,
    },
  });
