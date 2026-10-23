import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/constants/useColors";
import { Icon } from "@/components/Icon";
import { PressableScale } from "@/components/ui/PressableScale";
import type { Mood } from "@/lib/checkin";
import { FontSizes, Fonts, Radii } from "@/constants/theme";

const OPTIONS: {
  mood: Mood;
  label: string;
  caption: string;
  icon: "smiley" | "smiley-meh" | "smiley-sad";
  tone: "mint" | "peach" | "tan";
}[] = [
  {
    mood: "great",
    label: "Great",
    caption: "Everything feels okay today",
    icon: "smiley",
    tone: "mint",
  },
  {
    mood: "okay",
    label: "Okay",
    caption: "A normal, mixed kind of day",
    icon: "smiley-meh",
    tone: "peach",
  },
  {
    mood: "low",
    label: "Not great",
    caption: "Today feels heavier",
    icon: "smiley-sad",
    tone: "tan",
  },
];

/**
 * A private daily check-in. It records how the caretaker feels so the app can
 * greet them warmly — it is not a symptom tracker and never offers a diagnosis.
 */
export function WellnessCheckIn({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (mood: Mood) => void;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close daily check-in"
        />
        <View
          style={[
            styles.sheet,
            { backgroundColor: c.surface, paddingBottom: insets.bottom + 20 },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: c.border }]} />
          <View style={styles.head}>
            <View style={styles.headCopy}>
              <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
                How are you today?
              </Text>
              <Text style={[styles.body, { color: c.textSecondary }]}>
                A private note for you. It stays on this phone and is never used
                to diagnose anything.
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [
                styles.close,
                { backgroundColor: c.surfaceSelected },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Icon name="x" size={20} color={c.text} />
            </Pressable>
          </View>

          <View style={styles.options}>
            {OPTIONS.map((option) => {
              const background =
                option.tone === "mint"
                  ? c.mint
                  : option.tone === "peach"
                    ? c.peach
                    : c.tan;
              const ink =
                option.tone === "mint"
                  ? c.onMint
                  : option.tone === "peach"
                    ? c.onPeach
                    : c.text;

              return (
                <PressableScale
                  key={option.mood}
                  onPress={() => onSelect(option.mood)}
                  accessibilityRole="button"
                  accessibilityLabel={`${option.label}. ${option.caption}`}
                  style={[
                    styles.option,
                    { backgroundColor: background, borderColor: c.border },
                  ]}
                >
                  <View style={[styles.iconTile, { backgroundColor: c.surface }]}>
                    <Icon name={option.icon} size={28} color={c.primary} />
                  </View>
                  <View style={styles.optionCopy}>
                    <Text style={[styles.optionTitle, { color: ink }]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.optionCaption, { color: ink }]}>
                      {option.caption}
                    </Text>
                  </View>
                  <Icon name="caret-right" size={18} color={ink} />
                </PressableScale>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(20, 14, 8, 0.42)",
  },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 2,
    marginBottom: 14,
  },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  headCopy: { flex: 1, gap: 4 },
  title: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.title,
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
    lineHeight: 21,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.78 },
  options: { gap: 10, marginTop: 18 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: Radii.lg,
    borderWidth: 1,
    minHeight: 72,
  },
  iconTile: {
    width: 46,
    height: 46,
    borderRadius: Radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  optionCopy: { flex: 1, gap: 2 },
  optionTitle: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.body,
  },
  optionCaption: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
    lineHeight: 19,
    opacity: 0.9,
  },
});
