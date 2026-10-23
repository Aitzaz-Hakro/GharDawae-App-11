import { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useColors } from "@/constants/useColors";
import { Icon } from "@/components/Icon";
import { FontSizes, Fonts, Radii } from "@/constants/theme";

/**
 * Form shell for every screen with text inputs.
 *
 * The keyboard bugs this fixes:
 *  - iOS: `padding` keeps the focused field above the keyboard.
 *  - Android: the window uses `adjustResize`, so the shell shrinks and the
 *    Done bar lands directly above the keyboard.
 *  - A tap on Done, a drag of the list, or the platform back gesture all
 *    dismiss the keyboard. There is always an obvious way out.
 */
export function KeyboardAwareScroll({
  children,
  contentContainerStyle,
  style,
  doneLabel = "Done",
}: {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  doneLabel?: string;
}) {
  const c = useColors();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        onScrollBeginDrag={Keyboard.dismiss}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={false}
      >
        {children}
      </ScrollView>

      {visible ? (
        <View
          style={[
            styles.bar,
            { backgroundColor: c.surface, borderTopColor: c.border },
          ]}
        >
          <Pressable
            onPress={Keyboard.dismiss}
            style={({ pressed }) => [
              styles.done,
              { backgroundColor: c.primary },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Dismiss keyboard"
          >
            <Icon name="check" size={16} color={c.onPrimary} />
            <Text style={[styles.doneText, { color: c.onPrimary }]}>
              {doneLabel}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  done: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 18,
    borderRadius: Radii.pill,
  },
  pressed: { opacity: 0.8 },
  doneText: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.label,
  },
});
