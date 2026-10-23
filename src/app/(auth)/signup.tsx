import { useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";

import { signUp } from "@/lib/auth";
import { PRIVACY_VERSION } from "@/constants/privacy";
import { useColors, type ThemePalette } from "@/constants/useColors";
import { Icon } from "@/components/Icon";
import { KeyboardAwareScroll } from "@/components/ui/KeyboardAwareScroll";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";

export default function SignupScreen() {
  const router = useRouter();
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [focused, setFocused] = useState<"email" | "password" | "confirm" | null>(
    null,
  );

  async function onSubmit() {
    if (!email.trim() || !password) {
      setError("Enter your email and a password.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match yet.");
      return;
    }
    if (!consent) {
      setError("Please accept how your data is stored before continuing.");
      return;
    }

    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const data = await signUp(email.trim(), password);
      // With email confirmation on, there is no session yet. Say so instead of
      // leaving the screen looking as if nothing happened.
      if (!data.session) {
        setInfo(
          "Account created. Check your inbox to confirm your email, then log in below.",
        );
      }
      // The auth gate handles navigation as soon as a session exists.
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

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
        <Text style={styles.topTitle}>Create account</Text>
        <View style={styles.topSpacer} />
      </View>

      <KeyboardAwareScroll contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.title} accessibilityRole="header">
            One account. Your whole family.
          </Text>
          <Text style={styles.subtitle}>
            You&apos;ll be the family manager. The people you add are records in
            your cabinet — never separate accounts.
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
            placeholder="At least 8 characters"
            placeholderTextColor={c.textSecondary}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            selectionColor={c.primary}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => confirmRef.current?.focus()}
            onFocus={() => setFocused("password")}
            onBlur={() => setFocused(null)}
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              if (error) setError(null);
            }}
            editable={!busy}
          />

          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            ref={confirmRef}
            style={[
              styles.input,
              focused === "confirm" && { borderColor: c.primary },
            ]}
            placeholder="Type it once more"
            placeholderTextColor={c.textSecondary}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            selectionColor={c.primary}
            returnKeyType="done"
            onSubmitEditing={onSubmit}
            onFocus={() => setFocused("confirm")}
            onBlur={() => setFocused(null)}
            value={confirm}
            onChangeText={(value) => {
              setConfirm(value);
              if (error) setError(null);
            }}
            editable={!busy}
          />

          <Pressable
            style={styles.consentRow}
            onPress={() => setConsent((value) => !value)}
            disabled={busy}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consent, disabled: busy }}
            accessibilityLabel="Accept how my family's data is stored"
          >
            <View
              style={[
                styles.checkbox,
                { borderColor: c.border },
                consent && { backgroundColor: c.primary, borderColor: c.primary },
              ]}
            >
              {consent ? <Icon name="check" size={16} color={c.onPrimary} /> : null}
            </View>
            <Text style={styles.consentText}>
              I understand my family&apos;s health records are stored encrypted on
              this phone and backed up to the cloud, and I accept the{" "}
              <Text
                style={styles.consentLink}
                onPress={() => router.push("/(main)/settings/privacy")}
              >
                privacy policy
              </Text>{" "}
              (v{PRIVACY_VERSION}).
            </Text>
          </Pressable>

          {error ? (
            <Text
              style={styles.error}
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
            >
              {error}
            </Text>
          ) : null}

          {info ? (
            <Text
              style={styles.info}
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
            >
              {info}
            </Text>
          ) : null}

          <PrimaryButton label="Create account" onPress={onSubmit} loading={busy} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Have an account? </Text>
          <Link href="/(auth)/login" style={styles.link}>
            Log in
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
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 28,
      gap: 16,
    },
    intro: { gap: 6 },
    title: {
      fontFamily: Fonts.headingBold,
      fontSize: FontSizes.display,
      color: c.text,
      letterSpacing: -0.5,
      lineHeight: 34,
    },
    subtitle: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.textSecondary,
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
    consentRow: {
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-start",
      marginTop: 10,
      marginBottom: 8,
      minHeight: Cabinet.touchTarget,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: Radii.sm - 2,
      borderWidth: 2,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 2,
    },
    consentText: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: FontSizes.label,
      color: c.textSecondary,
      lineHeight: 21,
    },
    consentLink: {
      color: c.primary,
      fontFamily: Fonts.bodyMedium,
    },
    error: {
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSizes.label,
      color: c.danger,
      lineHeight: 20,
      marginBottom: 4,
    },
    info: {
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSizes.label,
      color: c.successText,
      lineHeight: 20,
      marginBottom: 4,
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
