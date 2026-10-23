// Full-screen camera capture, usable from two places:
//   - as a route (`record/camera`) for the camera-first entry path, and
//   - as a modal inside RecordForm, so "retake" swaps the photo in place
//     without leaving the form (and without losing typed fields).
//
// Only one camera preview may be active at a time, so the preview is mounted
// only while `visible` and only after permissions resolve.

import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { Icon } from "@/components/Icon";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";

export type CameraCaptureProps = {
  visible: boolean;
  onClose: () => void;
  /** Called with a cache-directory URI. Callers must copy it somewhere durable. */
  onCaptured: (uri: string) => void;
  title?: string;
};

export function CameraCapture({
  visible,
  onClose,
  onCaptured,
  title = "Take photo",
}: CameraCaptureProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const close = useCallback(() => {
    setReady(false);
    onClose();
  }, [onClose]);

  async function onCapture() {
    if (!cameraRef.current || !ready || busy) return;
    setBusy(true);
    try {
      const shot = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (shot?.uri) {
        setReady(false);
        onCaptured(shot.uri);
      } else {
        Alert.alert("No photo", "The camera returned no image. Try again.");
      }
    } catch (e) {
      Alert.alert("Capture failed", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onPickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (result.canceled) return;
    const uri = result.assets[0]?.uri;
    if (uri) onCaptured(uri);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={close}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {!permission ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={c.primary} />
          </View>
        ) : !permission.granted ? (
          <SafeAreaView style={styles.permissionWrap}>
            <Text style={styles.permissionText}>
              Ghar Dawae needs camera access to photograph prescriptions.
            </Text>
            <Pressable style={styles.button} onPress={requestPermission}>
              <Text style={styles.buttonText}>Allow camera</Text>
            </Pressable>
            <Pressable style={styles.textButton} onPress={onPickFromGallery}>
              <Text style={styles.textButtonText}>
                Choose from gallery instead
              </Text>
            </Pressable>
            <Pressable style={styles.textButton} onPress={close}>
              <Text style={styles.textButtonMuted}>Cancel</Text>
            </Pressable>
          </SafeAreaView>
        ) : (
          <>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
              onCameraReady={() => setReady(true)}
            />
            <SafeAreaView style={styles.overlay} edges={["top", "bottom"]}>
              <View style={styles.topBar}>
                <Pressable style={styles.topButton} onPress={close} hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Close camera"
                >
                  <Icon name="x" size={22} color="#FFFFFF" />
                </Pressable>
                <Text style={styles.topTitle}>{title}</Text>
                <View style={styles.topButton} />
              </View>

              <View style={styles.hintWrap}>
                <Text style={styles.hint}>
                  Frame the whole slip, then tap the button.
                </Text>
              </View>

              <View style={styles.controls}>
                <Pressable style={styles.sideButton} onPress={onPickFromGallery}>
                  <Text style={styles.sideText}>Gallery</Text>
                </Pressable>

                <Pressable
                  style={[styles.shutter, (!ready || busy) && styles.shutterDisabled]}
                  onPress={onCapture}
                  disabled={!ready || busy}
                >
                  {busy ? (
                    <ActivityIndicator color={c.primary} />
                  ) : (
                    <View style={styles.shutterInner} />
                  )}
                </Pressable>

                <Pressable style={styles.sideButton} onPress={close}>
                  <Text style={styles.sideText}>Cancel</Text>
                </Pressable>
              </View>
            </SafeAreaView>
          </>
        )}
      </View>
    </Modal>
  );
}

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    // The camera chrome stays dark in both themes on purpose: the preview is
    // the content, and a white frame around it would glare.
    container: { flex: 1, backgroundColor: "#000" },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#000",
    },
    permissionWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      backgroundColor: c.background,
    },
    permissionText: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.textSecondary,
      textAlign: "center",
      lineHeight: 24,
    },
    button: {
      backgroundColor: c.primary,
      borderRadius: Radii.xl,
      paddingHorizontal: 28,
      minHeight: Cabinet.actionHeight,
      justifyContent: "center",
      marginTop: 20,
    },
    buttonText: {
      color: c.onPrimary,
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.body,
    },
    textButton: { marginTop: 8, padding: 10, minHeight: 44 },
    textButtonText: {
      color: c.primary,
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.body,
    },
    textButtonMuted: {
      color: c.textSecondary,
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.body,
    },
    overlay: { flex: 1, justifyContent: "space-between" },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    topButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      alignItems: "center",
    },
    topButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
    topTitle: { color: "#FFFFFF", fontFamily: Fonts.headingSemi, fontSize: FontSizes.body },
    hintWrap: { alignItems: "center" },
    hint: {
      color: "#FFFFFF",
      fontFamily: Fonts.body,
      backgroundColor: "rgba(0,0,0,0.55)",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: Radii.pill,
      overflow: "hidden",
      fontSize: FontSizes.label,
    },
    controls: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 24,
      paddingBottom: 20,
    },
    sideButton: {
      backgroundColor: "rgba(255,255,255,0.18)",
      borderRadius: Radii.pill,
      paddingHorizontal: 16,
      minHeight: 44,
      justifyContent: "center",
    },
    sideText: { color: "#FFFFFF", fontFamily: Fonts.bodyMedium, fontSize: FontSizes.label },
    shutter: {
      width: 78,
      height: 78,
      borderRadius: 39,
      backgroundColor: "#FFFFFF",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 4,
      borderColor: "rgba(255,255,255,0.5)",
    },
    shutterDisabled: { opacity: 0.6 },
    shutterInner: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: "#FFFFFF",
    },
  });
