import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

/**
 * Camera-first capture. Snapping here hands the cache URI straight to the form,
 * so the photo is never lost by backing out of a form that hasn't saved yet.
 */
export default function CameraScreen() {
  const router = useRouter();
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  // The preview must be mounted only while this screen is actually on top.
  const [focused, setFocused] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        setFocused(false);
        setReady(false);
      };
    }, []),
  );

  function goToForm(photoUri: string) {
    router.replace({
      pathname: "/(main)/record/new",
      params: { memberId: memberId ?? "", photoUri },
    });
  }

  async function onCapture() {
    if (!cameraRef.current || !ready || busy) return;
    setBusy(true);
    try {
      const shot = await cameraRef.current.takePictureAsync({
        quality: 0.7,
      });
      if (shot?.uri) goToForm(shot.uri);
      else Alert.alert("No photo", "The camera returned no image. Try again.");
    } catch (e) {
      Alert.alert("Capture failed", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onPickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (result.canceled) return;
    const uri = result.assets[0]?.uri;
    if (uri) goToForm(uri);
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: "Camera" }} />
        <View style={styles.center}>
          <Text style={styles.permissionText}>
            Ghar Dawae needs camera access to photograph prescriptions.
          </Text>
          <Pressable style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Allow camera</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onPickFromLibrary}>
            <Text style={styles.secondaryText}>Choose from gallery instead</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: "Take photo" }} />
      {focused && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          onCameraReady={() => setReady(true)}
        />
      )}

      <SafeAreaView style={styles.overlay} edges={["bottom"]}>
        <View style={styles.hintWrap}>
          <Text style={styles.hint}>
            Frame the whole slip, then tap the button.
          </Text>
        </View>
        <View style={styles.controls}>
          <Pressable style={styles.sideButton} onPress={onPickFromLibrary}>
            <Text style={styles.sideText}>Gallery</Text>
          </Pressable>

          <Pressable
            style={[styles.shutter, (!ready || busy) && styles.shutterDisabled]}
            onPress={onCapture}
            disabled={!ready || busy}
          >
            {busy ? (
              <ActivityIndicator color="#208AEF" />
            ) : (
              <View style={styles.shutterInner} />
            )}
          </Pressable>

          <Pressable
            style={styles.sideButton}
            onPress={() =>
              router.replace({
                pathname: "/(main)/record/new",
                params: { memberId: memberId ?? "" },
              })
            }
          >
            <Text style={styles.sideText}>Skip</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  permissionText: { fontSize: 15, color: "#60646C", textAlign: "center" },
  button: {
    backgroundColor: "#208AEF",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  secondaryButton: { marginTop: 16, padding: 8 },
  secondaryText: { color: "#208AEF", fontWeight: "600" },
  overlay: { flex: 1, justifyContent: "space-between" },
  hintWrap: { alignItems: "center", paddingTop: 16 },
  hint: {
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    overflow: "hidden",
    fontSize: 14,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingBottom: 24,
  },
  sideButton: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sideText: { color: "#fff", fontWeight: "600" },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#fff",
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
    backgroundColor: "#fff",
  },
});
