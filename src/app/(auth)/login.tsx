import { useCallback, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";

import { signIn } from "@/lib/auth";
import { useColors, type ThemePalette } from "@/constants/useColors";
import { Icon } from "@/components/Icon";
import { KeyboardAwareScroll } from "@/components/ui/KeyboardAwareScroll";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";

export default function LoginScreen() {
  const router = useRouter();
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<"email" | "password" | null>(null);

  const onSubmit = useCallback(async () => {
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      // The auth gate in the root layout redirects to (main).
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [email, password]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.replace("/(auth)/welcome")}
          hitSlop={8}
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: c.surface, borderColor: c.border },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Back to welcome"
        >
          <Icon name="arrow-left" size={22} color={c.text} />
        </Pressable>
        <Text style={styles.topTitle}>Welcome back</Text>
        <View style={styles.topSpacer} />
      </View>

      <KeyboardAwareScroll contentContainerStyle={styles.content}>
        <View style={styles.brandBlock}>
          <View style={[styles.brandMark, { backgroundColor: c.primary }]}>
            <Icon name="heart" size={24} color={c.onPrimary} />
          </View>
          <Text style={styles.brand} accessibilityRole="header">
            Ghar Dawae
          </Text>
          <Text style={styles.subtitle}>
            Log in to your family&apos;s medicine cabinet
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[
              styles.input,
              focused === "email" && { borderColor: c.primary },
            ]}
            placeholder="you@example.com"
            placeholderTextColor={c.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            selectionColor={c.primary}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => passwordRef.current?.focus()}
            onFocus={() => setFocused("email")}
            onBlur={() => setFocused(null)}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (error) setError(null);
            }}
            editable={!busy}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            ref={passwordRef}
            style={[
              styles.input,
              focused === "password" && { borderColor: c.primary },
            ]}
            placeholder="Your password"
            placeholderTextColor={c.textSecondary}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            selectionColor={c.primary}
            returnKeyType="done"
            onSubmitEditing={onSubmit}
            onFocus={() => setFocused("password")}
            onBlur={() => setFocused(null)}
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              if (error) setError(null);
            }}
            editable={!busy}
          />

          {error ? (
            <Text
              style={styles.error}
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
            >
              {error}
            </Text>
          ) : null}

          <PrimaryButton
            label="Log in"
            onPress={onSubmit}
            loading={busy}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New here? </Text>
          <Link href="/(auth)/signup" style={styles.link}>
            Create an account
          </Link>
        </View>
      </KeyboardAwareScroll>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      minHeight: 56,
      gap: 12,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: Radii.pill,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    topTitle: {
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.body,
      color: c.text,
    },
    topSpacer: { width: 44 },
    pressed: { opacity: 0.78 },
    content: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 28,
      gap: 16,
    },
    brandBlock: { alignItems: "center", gap: 6 },
    brandMark: {
      width: 56,
      height: 56,
      borderRadius: Radii.pill,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    brand: {
      fontFamily: Fonts.headingBold,
      fontSize: FontSizes.brand,
      color: c.text,
      letterSpacing: -0.7,
      textAlign: "center",
    },
    subtitle: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.textSecondary,
      textAlign: "center",
      lineHeight: 23,
    },
    card: {
      borderRadius: Radii.xl,
      borderWidth: 1,
      padding: 18,
      gap: 6,
    },
    label: {
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.label,
      color: c.text,
      marginTop: 6,
      marginBottom: 4,
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
      marginBottom: 6,
    },
    error: {
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSizes.label,
      color: c.danger,
      lineHeight: 20,
      marginTop: 2,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
      minHeight: Cabinet.touchTarget,
    },
    footerText: {
      color: c.textSecondary,
      fontFamily: Fonts.body,
      fontSize: FontSizes.label,
    },
    link: {
      color: c.primary,
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.label,
      paddingVertical: 12,
      paddingHorizontal: 4,
    },
  });
