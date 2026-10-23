import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";
import { Icon } from "@/components/Icon";
import { ChatBubble } from "@/components/ChatBubble";
import { CameraCapture } from "@/components/CameraCapture";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/i18n";
import { useAuth } from "@/lib/auth-context";
import { listMembers, resolveFamily, type Member } from "@/lib/family";
import { buildMemberContext } from "@/lib/ai/context";
import { sendToAssistant } from "@/lib/ai/chat";
import {
  demoFoodReply,
  demoPrescriptionReply,
} from "@/lib/ai/demo";
import { isSttConfigured, transcribeAudio } from "@/lib/ai/stt";
import {
  AIError,
  type ChatMessage,
  type MemberContext,
} from "@/lib/ai/types";
import { uuid } from "@/lib/uuid";

type ImageKind = "food" | "prescription";
type Turn = { text: string; imageUri?: string; imageKind?: ImageKind };

// Survives navigating away and back during the demo. Not persisted.
let sessionMessages: ChatMessage[] = [];
let sessionMemberId: string | null = null;

export default function AssistantScreen() {
  const router = useRouter();
  const c = useColors();
  const { t, isUrdu, lang } = useLanguage();
  const { session } = useAuth();
  const styles = useMemo(() => makeStyles(c), [c]);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const { memberId: initialMemberId } = useLocalSearchParams<{
    memberId?: string;
  }>();

  const [messages, setMessages] = useState<ChatMessage[]>(sessionMessages);
  const messagesRef = useRef<ChatMessage[]>(sessionMessages);
  const retryRef = useRef<Turn | null>(null);

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [pendingKind, setPendingKind] = useState<ImageKind>("food");
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [transcribing, setTranscribing] = useState(false);
  const recording = recorderState.isRecording;
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    initialMemberId ?? sessionMemberId,
  );
  // Tagged with its member id so switching members can never send the previous
  // member's medicines to the model.
  const [contextState, setContextState] = useState<{
    memberId: string;
    context: MemberContext;
  } | null>(null);

  const updateMessages = useCallback(
    (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      setMessages((prev) => {
        const next = updater(prev);
        messagesRef.current = next;
        sessionMessages = next;
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    sessionMemberId = selectedMemberId;
  }, [selectedMemberId]);

  const context =
    selectedMemberId && contextState?.memberId === selectedMemberId
      ? contextState.context
      : null;

  useEffect(() => {
    const managerId = session?.user.id;
    if (!managerId) return;
    let alive = true;
    (async () => {
      try {
        const family = await resolveFamily(managerId);
        const list = await listMembers(family.id);
        if (alive) setMembers(list);
      } catch {
        // The family grid surfaces real errors; general chat still works.
      }
    })();
    return () => {
      alive = false;
    };
  }, [session?.user.id]);

  useEffect(() => {
    let alive = true;
    if (!selectedMemberId) return;
    buildMemberContext(selectedMemberId)
      .then((next) => {
        if (alive && next) {
          setContextState({ memberId: selectedMemberId, context: next });
        }
      })
      .catch(() => {
        // General guidance is still useful; the chip stays as-is.
      });
    return () => {
      alive = false;
    };
  }, [selectedMemberId]);

  useEffect(() => {
    return () => {
      if (recorder.isRecording) {
        recorder.stop().catch(() => {});
      }
    };
  }, [recorder]);

  const runTurn = useCallback(
    async (turn: Turn, pendingId: string, history: ChatMessage[]) => {
      try {
        const reply = await sendToAssistant({
          history,
          text: turn.text,
          imageUri: turn.imageUri,
          imageKind: turn.imageKind,
          context,
          lang,
        });
        updateMessages((prev) =>
          prev.map((message) =>
            message.id === pendingId
              ? {
                  ...message,
                  status: "done",
                  reply,
                  imageUri: turn.imageUri,
                  imageKind: turn.imageKind,
                }
              : message,
          ),
        );
        retryRef.current = null;
      } catch (error) {
        const text =
          error instanceof AIError
            ? error.message
            : (error as Error).message;
        updateMessages((prev) =>
          prev.map((message) =>
            message.id === pendingId
              ? { ...message, status: "error", error: text }
              : message,
          ),
        );
        retryRef.current = turn;
      } finally {
        setBusy(false);
      }
    },
    [context, lang, updateMessages],
  );

  const send = useCallback(
    (text: string, imageUri?: string, imageKind?: ImageKind) => {
      const trimmed = text.trim();
      if ((!trimmed && !imageUri) || busy) return;

      const history = messagesRef.current;
      const userMessage: ChatMessage = {
        id: uuid(),
        role: "user",
        text: trimmed,
        imageUri,
        imageKind,
        status: "done",
      };
      const pending: ChatMessage = {
        id: uuid(),
        role: "assistant",
        text: "",
        status: "sending",
      };

      updateMessages((prev) => [...prev, userMessage, pending]);
      setInput("");
      setBusy(true);
      void runTurn({ text: trimmed, imageUri, imageKind }, pending.id, history);
    },
    [busy, runTurn, updateMessages],
  );

  const retry = useCallback(
    (errorId: string) => {
      const turn = retryRef.current;
      if (!turn || busy) return;

      const history = messagesRef.current.filter((m) => m.status !== "error");
      const pending: ChatMessage = {
        id: uuid(),
        role: "assistant",
        text: "",
        status: "sending",
      };
      updateMessages((prev) => [
        ...prev.filter((message) => message.id !== errorId),
        pending,
      ]);
      setBusy(true);
      void runTurn(turn, pending.id, history);
    },
    [busy, runTurn, updateMessages],
  );

  const addDemo = useCallback(
    (kind: ImageKind) => {
      const reply =
        kind === "food" ? demoFoodReply() : demoPrescriptionReply();
      const userMessage: ChatMessage = {
        id: uuid(),
        role: "user",
        text:
          kind === "food"
            ? t("assistant.foodPhoto")
            : t("assistant.prescriptionPhoto"),
        status: "done",
      };
      const assistantMessage: ChatMessage = {
        id: uuid(),
        role: "assistant",
        text: "",
        reply,
        status: "done",
      };
      updateMessages((prev) => [...prev, userMessage, assistantMessage]);
    },
    [t, updateMessages],
  );

  const openCamera = useCallback((kind: ImageKind) => {
    setPendingKind(kind);
    setCameraOpen(true);
  }, []);

  const onCaptured = useCallback(
    (uri: string) => {
      setCameraOpen(false);
      send("", uri, pendingKind);
    },
    [pendingKind, send],
  );

  const onAttach = useCallback(() => {
    Alert.alert(t("assistant.attach"), undefined, [
      { text: t("assistant.foodPhoto"), onPress: () => openCamera("food") },
      {
        text: t("assistant.prescriptionPhoto"),
        onPress: () => openCamera("prescription"),
      },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  }, [openCamera, t]);

  /**
   * Push-to-talk: first tap starts, second tap stops and transcribes into the
   * input. The user can fix a misheard medicine name before sending — critical
   * when the model is listening to Urdu or mixed Urdu/English.
   */
  const toggleRecording = useCallback(async () => {
    if (busy || transcribing) return;

    if (!isSttConfigured()) {
      Alert.alert(t("assistant.title"), t("assistant.sttNotConfigured"));
      return;
    }

    if (recorderState.isRecording) {
      try {
        await recorder.stop();
        const uri = recorder.uri;
        if (!uri) throw new Error(t("assistant.sttFailed"));
        setTranscribing(true);
        const transcript = await transcribeAudio(uri, lang);
        setInput((prev) =>
          prev.trim() ? `${prev.trim()} ${transcript}` : transcript,
        );
      } catch (error) {
        Alert.alert(
          t("assistant.sttFailed"),
          error instanceof AIError ? error.message : (error as Error).message,
        );
      } finally {
        setTranscribing(false);
      }
      return;
    }

    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t("assistant.title"), t("assistant.micDenied"));
        return;
      }
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (error) {
      Alert.alert(t("assistant.sttFailed"), (error as Error).message);
    }
  }, [busy, lang, recorder, recorderState.isRecording, t, transcribing]);

  const onReviewPrescription = useCallback(
    (imageUri: string) => {
      if (!selectedMemberId) {
        Alert.alert(t("assistant.title"), t("assistant.selectMember"));
        return;
      }
      router.push({
        pathname: "/(main)/record/new",
        params: {
          memberId: selectedMemberId,
          photoUri: imageUri,
        },
      });
    },
    [router, selectedMemberId, t],
  );

  const activeMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId) ?? null,
    [members, selectedMemberId],
  );

  const canSend =
    input.trim().length > 0 && !busy && !recording && !transcribing;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t("assistant.title"),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: c.background },
          headerRight: () => <LanguageToggle compact />,
        }}
      />

      <View style={styles.memberBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.memberRow}
        >
          <Pressable
            style={[
              styles.memberChip,
              !selectedMemberId && styles.memberChipActive,
            ]}
            onPress={() => setSelectedMemberId(null)}
            accessibilityRole="button"
            accessibilityState={{ selected: !selectedMemberId }}
          >
            <Text
              style={[
                styles.memberChipText,
                !selectedMemberId && styles.memberChipTextActive,
              ]}
            >
              {t("assistant.general")}
            </Text>
          </Pressable>
          {members.map((member) => {
            const active = member.id === selectedMemberId;
            return (
              <Pressable
                key={member.id}
                style={[styles.memberChip, active && styles.memberChipActive]}
                onPress={() => setSelectedMemberId(member.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={member.name}
              >
                <Text
                  style={[
                    styles.memberChipText,
                    active && styles.memberChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {member.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Text style={[styles.contextLine, isUrdu && styles.urdu]}>
          {activeMember
            ? `${t("assistant.basedOn")}: ${activeMember.name}`
            : t("assistant.generalContext")}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {messages.length === 0 ? (
          <ScrollView contentContainerStyle={styles.emptyContent}>
            <View style={styles.emptyCards}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionCard,
                  pressed && styles.pressed,
                ]}
                onPress={() => openCamera("food")}
                accessibilityRole="button"
                accessibilityLabel={t("assistant.checkFood")}
              >
                <Icon name="sun-horizon" size={28} color={c.primary} />
                <Text style={[styles.actionTitle, isUrdu && styles.urdu]}>
                  {t("assistant.checkFood")}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.actionCard,
                  pressed && styles.pressed,
                ]}
                onPress={() => openCamera("prescription")}
                accessibilityRole="button"
                accessibilityLabel={t("assistant.readPrescription")}
              >
                <Icon name="pill-fill" size={28} color={c.primary} />
                <Text style={[styles.actionTitle, isUrdu && styles.urdu]}>
                  {t("assistant.readPrescription")}
                </Text>
              </Pressable>
            </View>

            <Text style={[styles.emptyHint, isUrdu && styles.urdu]}>
              {t("assistant.empty")}
            </Text>

            <View style={styles.suggestions}>
              {[
                t("assistant.suggest1"),
                t("assistant.suggest2"),
                t("assistant.suggest3"),
              ].map((question) => (
                <Pressable
                  key={question}
                  style={styles.suggestion}
                  onPress={() => send(question)}
                  accessibilityRole="button"
                  accessibilityLabel={question}
                >
                  <Text style={[styles.suggestionText, isUrdu && styles.urdu]}>
                    {question}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.sampleRow}>
              <Pressable
                style={styles.sample}
                onPress={() => addDemo("prescription")}
                accessibilityRole="button"
              >
                <Text style={styles.sampleText}>
                  {t("assistant.trySample")}: {t("assistant.prescriptionPhoto")}
                </Text>
              </Pressable>
              <Pressable
                style={styles.sample}
                onPress={() => addDemo("food")}
                accessibilityRole="button"
              >
                <Text style={styles.sampleText}>
                  {t("assistant.trySample")}: {t("assistant.foodPhoto")}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(message) => message.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <ChatBubble
                message={item}
                onRetry={() => retry(item.id)}
                onReviewPrescription={onReviewPrescription}
              />
            )}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: true })
            }
          />
        )}

        <View style={styles.composer}>
          <TextInput
            style={[styles.input, isUrdu && styles.urduInput]}
            placeholder={t("assistant.placeholder")}
            placeholderTextColor={c.textSecondary}
            value={input}
            onChangeText={setInput}
            multiline
            editable={!busy}
          />
          <View style={styles.composerActions}>
            <Pressable
              style={({ pressed }) => [
                styles.attach,
                pressed && styles.pressed,
                (recording || transcribing || busy) && styles.actionDisabled,
              ]}
              onPress={onAttach}
              disabled={recording || transcribing || busy}
              accessibilityRole="button"
              accessibilityLabel={t("assistant.attach")}
            >
              <Icon name="plus-bold" size={22} color={c.primary} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.mic,
                recording && styles.micActive,
                pressed && styles.pressed,
                (busy || transcribing) && styles.actionDisabled,
              ]}
              onPress={toggleRecording}
              disabled={busy || transcribing}
              accessibilityRole="button"
              accessibilityLabel={
                recording ? t("assistant.stopRecording") : t("assistant.record")
              }
            >
              {transcribing ? (
                <ActivityIndicator size="small" color={c.primary} />
              ) : (
                <Icon
                  name="microphone"
                  size={20}
                  color={recording ? c.onPrimary : c.primary}
                />
              )}
            </Pressable>

            {recording || transcribing ? (
              <Text style={styles.recordingHint} numberOfLines={1}>
                {recording
                  ? t("assistant.recording")
                  : t("assistant.transcribing")}
              </Text>
            ) : (
              <View style={styles.composerSpacer} />
            )}

            <Pressable
              style={[styles.send, !canSend && styles.sendDisabled]}
              onPress={() => send(input)}
              disabled={!canSend}
              accessibilityRole="button"
              accessibilityLabel={t("assistant.send")}
            >
              <Text style={styles.sendText}>{t("assistant.send")}</Text>
            </Pressable>
          </View>
        </View>
        <Text style={[styles.footer, isUrdu && styles.urdu]}>
          {t("assistant.disclaimer")}
        </Text>
      </KeyboardAvoidingView>

      <CameraCapture
        visible={cameraOpen}
        title={
          pendingKind === "food"
            ? t("assistant.foodPhoto")
            : t("assistant.prescriptionPhoto")
        }
        onClose={() => setCameraOpen(false)}
        onCaptured={onCaptured}
      />
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    memberBar: {
      paddingHorizontal: Cabinet.gutter,
      paddingBottom: 8,
      borderBottomWidth: Cabinet.rule,
      borderBottomColor: c.border,
      gap: 4,
    },
    memberRow: { flexDirection: "row", gap: 8, paddingVertical: 10 },
    memberChip: {
      minHeight: 38,
      paddingHorizontal: 14,
      justifyContent: "center",
      borderRadius: Radii.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      maxWidth: 160,
    },
    memberChipActive: { backgroundColor: c.primary, borderColor: c.primary },
    memberChipText: {
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSizes.label,
      color: c.text,
    },
    memberChipTextActive: { color: c.onPrimary },
    contextLine: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.caption,
      color: c.textSecondary,
      paddingBottom: 6,
    },
    emptyContent: {
      paddingHorizontal: Cabinet.gutter,
      paddingTop: 24,
      paddingBottom: 24,
      gap: 18,
    },
    emptyCards: { flexDirection: "row", gap: 12 },
    actionCard: {
      flex: 1,
      minHeight: 120,
      borderRadius: Cabinet.cardRadius,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      padding: 16,
      gap: 10,
      justifyContent: "center",
    },
    actionTitle: {
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.body,
      color: c.text,
      lineHeight: 22,
    },
    pressed: { opacity: 0.85 },
    emptyHint: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.textSecondary,
      lineHeight: 23,
    },
    suggestions: { gap: 8 },
    suggestion: {
      borderRadius: Radii.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      paddingHorizontal: 14,
      paddingVertical: 12,
      minHeight: 44,
      justifyContent: "center",
    },
    suggestionText: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.primary,
    },
    sampleRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    sample: {
      borderRadius: Radii.pill,
      backgroundColor: c.surfaceSelected,
      paddingHorizontal: 12,
      paddingVertical: 8,
      minHeight: 38,
      justifyContent: "center",
    },
    sampleText: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.caption,
      color: c.textSecondary,
    },
    list: {
      paddingHorizontal: Cabinet.gutter,
      paddingVertical: 16,
      gap: 12,
    },
    composer: {
      gap: 8,
      paddingHorizontal: Cabinet.gutter,
      paddingTop: 10,
      borderTopWidth: Cabinet.rule,
      borderTopColor: c.border,
    },
    composerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
    composerSpacer: { flex: 1 },
    recordingHint: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: FontSizes.caption,
      color: c.danger,
    },
    attach: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    mic: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    micActive: { backgroundColor: c.danger, borderColor: c.danger },
    actionDisabled: { opacity: 0.5 },
    input: {
      width: "100%",
      minHeight: 48,
      maxHeight: 110,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: Radii.lg,
      backgroundColor: c.input,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.text,
      textAlignVertical: "top",
    },
    urduInput: { textAlign: "right", writingDirection: "rtl" },
    send: {
      minHeight: 48,
      minWidth: 64,
      paddingHorizontal: 14,
      borderRadius: Radii.pill,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendDisabled: { opacity: 0.45 },
    sendText: {
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.label,
      color: c.onPrimary,
    },
    footer: {
      textAlign: "center",
      fontFamily: Fonts.body,
      fontSize: FontSizes.caption,
      color: c.textSecondary,
      paddingVertical: 6,
      paddingHorizontal: Cabinet.gutter,
    },
    urdu: { textAlign: "right", writingDirection: "rtl" },
  });
