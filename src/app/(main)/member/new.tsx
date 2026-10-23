import { useMemo, useState } from "react";
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
import { Stack, useRouter } from "expo-router";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { addMember, resolveFamily } from "@/lib/family";
import { useAuth } from "@/lib/auth-context";
import { AVATAR_PRESETS, RELATIONS } from "@/constants/avatars";
import { Avatar } from "@/components/Avatar";
import { KeyboardAwareScroll } from "@/components/ui/KeyboardAwareScroll";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";

export default function NewMemberScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(c, insets.bottom), [c, insets.bottom]);
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
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Add member",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: c.background },
        }}
      />
      <KeyboardAwareScroll contentContainerStyle={styles.content}>
        <View style={styles.preview}>
          <Avatar name={name || relation || "Aa"} value={avatarId} size={80} />
          <Text style={styles.previewHint}>
            Pick a picture to recognise this member across your family&apos;s records.
          </Text>
        </View>

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
              <Text
                style={[styles.chipText, gender === g && styles.chipTextActive]}
              >
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
          accessibilityLabel="Save member"
        >
          {busy ? (
            <ActivityIndicator color={c.onPrimary} />
          ) : (
            <Text style={styles.buttonText}>Save member</Text>
          )}
        </Pressable>
      </KeyboardAwareScroll>
    </View>
  );
}

const makeStyles = (c: ThemePalette, bottomInset: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: {
      paddingHorizontal: Cabinet.gutter,
      paddingBottom: bottomInset + 40,
    },
    preview: { alignItems: "center", paddingVertical: 16, gap: 10 },
    previewHint: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.label,
      color: c.textSecondary,
      textAlign: "center",
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
  });
