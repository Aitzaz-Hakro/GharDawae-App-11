import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";

import { useColors, type ThemePalette } from "@/constants/useColors";
import {
  PRIVACY_SECTIONS,
  PRIVACY_TITLE,
  PRIVACY_VERSION,
} from "@/constants/privacy";
import { Cabinet, FontSizes, Fonts } from "@/constants/theme";

export default function PrivacyScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(c, insets.bottom), [c, insets.bottom]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: PRIVACY_TITLE,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: c.background },
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {PRIVACY_SECTIONS.map((s) => (
          <View key={s.heading} style={styles.section}>
            <Text style={styles.heading}>{s.heading}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
        <Text style={styles.version}>Version {PRIVACY_VERSION}</Text>
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: ThemePalette, bottomInset: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: {
      paddingHorizontal: Cabinet.gutter,
      paddingBottom: bottomInset + 48,
    },
    section: {
      marginBottom: 24,
      paddingBottom: 20,
      borderBottomWidth: Cabinet.rule,
      borderBottomColor: c.border,
    },
    heading: {
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.heading,
      color: c.text,
      marginBottom: 6,
    },
    body: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.textSecondary,
      lineHeight: 24,
    },
    version: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.caption,
      color: c.textSecondary,
      marginTop: 8,
    },
  });
