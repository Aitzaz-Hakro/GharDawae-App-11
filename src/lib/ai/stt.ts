// Speech-to-text adapter.
//
// Two supported backends, selected by EXPO_PUBLIC_STT_ENDPOINT:
//
//   Groq (default)  https://api.groq.com/openai/v1/audio/transcriptions
//                   model: whisper-large-v3-turbo
//   xAI Grok        https://api.x.ai/v1/stt
//                   model: grok-voice-transcribe-2.0
//
// Both accept multipart/form-data and return { text }. xAI requires the file
// field to be last, so it is appended last for both providers.
//
// SECURITY: EXPO_PUBLIC_* values are embedded in the JS bundle. Use a
// demo-scoped key with a quota and rotate it after the event. Before a real
// launch, move this call behind a backend proxy (xAI's own docs say the same).

import { AIError, type Lang } from "./types";

const API_KEY =
  process.env.EXPO_PUBLIC_STT_API_KEY?.trim() ||
  process.env.EXPO_PUBLIC_GROQ_API_KEY?.trim() ||
  process.env.EXPO_PUBLIC_XAI_API_KEY?.trim();

const ENDPOINT = (
  process.env.EXPO_PUBLIC_STT_ENDPOINT ||
  "https://api.groq.com/openai/v1/audio/transcriptions"
).trim();

const IS_XAI = ENDPOINT.includes("api.x.ai");

const MODEL = (
  process.env.EXPO_PUBLIC_STT_MODEL ||
  (IS_XAI ? "grok-voice-transcribe-2.0" : "whisper-large-v3-turbo")
).trim();

const TIMEOUT_MS = 60_000;

export function isSttConfigured(): boolean {
  return typeof API_KEY === "string" && API_KEY.length > 0;
}

function mimeFor(uri: string): string {
  if (/\.3gp$/i.test(uri)) return "audio/3gpp";
  if (/\.wav$/i.test(uri)) return "audio/wav";
  if (/\.mp3$/i.test(uri)) return "audio/mpeg";
  return "audio/m4a";
}

/**
 * Transcribe one recording. Returns plain text; throws AIError on failure.
 * The caller decides whether to append it to the input or send it.
 */
export async function transcribeAudio(
  uri: string,
  lang: Lang,
): Promise<string> {
  if (!isSttConfigured()) {
    throw new AIError(
      "not_configured",
      "Speech-to-text is not configured. Add EXPO_PUBLIC_STT_API_KEY (or EXPO_PUBLIC_GROQ_API_KEY) to .env.",
    );
  }

  const language = lang === "ur" ? "ur" : "en";
  const form = new FormData();
  form.append("model", MODEL);
  form.append("language", language);

  if (IS_XAI) {
    // Inverse text normalization + domain hints.
    form.append("format", "true");
    for (const term of [
      "prescription",
      "medicine",
      "dosage",
      "tablet",
      "دوائی",
      "نسخہ",
      "صبح",
      "رات",
    ]) {
      form.append("keyterm", term);
    }
  } else {
    form.append("response_format", "json");
    form.append("temperature", "0");
    form.append(
      "prompt",
      "Medical prescription dictation. Medicine names, dosage, morning, night, after food. نسخہ، دوائی، صبح، رات، کھانے کے بعد۔",
    );
  }

  // Must be the last field for xAI; harmless for Groq.
  form.append("file", {
    uri,
    name: "recording.m4a",
    type: mimeFor(uri),
  } as unknown as Blob);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}` },
      body: form,
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new AIError(
          "rate_limit",
          "Transcription is busy right now. Try again in a few seconds.",
        );
      }
      if (response.status === 401 || response.status === 403) {
        throw new AIError(
          "api",
          "The speech-to-text key is missing or invalid.",
        );
      }
      const detail = await response.text().catch(() => "");
      throw new AIError(
        "api",
        `Speech-to-text failed (${response.status}). ${detail.slice(0, 180)}`,
      );
    }

    const payload = (await response.json()) as { text?: unknown };
    const text =
      typeof payload.text === "string" ? payload.text.trim() : "";
    if (!text) {
      throw new AIError(
        "bad_json",
        "No speech was detected. Try again and speak a little closer to the mic.",
      );
    }
    return text;
  } catch (error) {
    if (error instanceof AIError) throw error;
    if (controller.signal.aborted) {
      throw new AIError(
        "network",
        "Transcription took too long. Check your connection and try again.",
      );
    }
    throw new AIError(
      "network",
      "Could not reach the speech-to-text service.",
    );
  } finally {
    clearTimeout(timer);
  }
}
