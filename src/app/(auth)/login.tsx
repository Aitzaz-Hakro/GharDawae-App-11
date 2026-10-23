import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { signIn } from "@/lib/auth";
import { useColors, type ThemePalette } from "@/constants/useColors";
import { Icon } from "@/components/Icon";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";

export default function LoginScreen() {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = useCallback(async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      // Auth gate in root layout redirects to (main) on session change.
    } catch (e) {
      Alert.alert("Login failed", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [email, password]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.inner}>
          <View style={styles.brandBlock}>
            <View style={styles.brandMark}>
              <Icon name="house-line-fill" size={28} color={c.onPrimary} />
            </View>
            <Text style={styles.brand} accessibilityRole="header">
              Ghar Dawae
            </Text>
            <Text style={styles.tagline}>گھر دوا</Text>
            <Text style={styles.subtitle}>
              Your family&apos;s medicines, always with you
            </Text>
          </View>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={c.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            editable={!busy}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Your password"
            placeholderTextColor={c.textSecondary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!busy}
          />

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.pressed,
              busy && styles.buttonDisabled,
            ]}
            onPress={onSubmit}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Log in"
          >
            {busy ? (
              <ActivityIndicator color={c.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>Log in</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>No account? </Text>
            <Link href="/(auth)/signup" style={styles.link}>
              Sign up
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    inner: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingBottom: 48,
    },
    brandBlock: { alignItems: "center", marginBottom: 32 },
    brandMark: {
      width: 60,
      height: 60,
      borderRadius: Radii.lg,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },
    brand: {
      fontFamily: Fonts.headingBold,
      fontSize: 34,
      color: c.text,
      letterSpacing: -0.8,
      textAlign: "center",
    },
    tagline: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.heading,
      color: c.primary,
      marginTop: 4,
      textAlign: "center",
    },
    subtitle: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.textSecondary,
      textAlign: "center",
      marginTop: 8,
      lineHeight: 24,
    },
    label: {
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.label,
      color: c.text,
      marginBottom: 6,
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
      marginBottom: 16,
    },
    button: {
      backgroundColor: c.primary,
      borderRadius: Radii.xl,
      minHeight: Cabinet.actionHeight,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 8,
    },
    pressed: { opacity: 0.85 },
    buttonDisabled: { opacity: 0.6 },
    buttonText: {
      color: c.onPrimary,
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.heading,
    },
    footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
    footerText: {
      color: c.textSecondary,
      fontFamily: Fonts.body,
      fontSize: FontSizes.label,
    },
    link: {
      color: c.primary,
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.label,
    },
  });
