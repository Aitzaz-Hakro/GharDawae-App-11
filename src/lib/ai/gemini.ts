// The ONLY place that talks to the model provider.
//
// Provider: OpenAI Chat Completions (vision-capable models).
//
// Env:
//   EXPO_PUBLIC_OPENAI_API_KEY   required for live calls
//   EXPO_PUBLIC_OPENAI_MODEL     default "gpt-4o-mini" ("gpt-4o" also works)
//   EXPO_PUBLIC_OPENAI_ENDPOINT  optional override
//
// Note: EXPO_PUBLIC_* values are embedded in the JS bundle. Use a
// demo-scoped key with a quota and rotate it after the event.

import { File } from "expo-file-system";

import { AIError } from "./types";

const TIMEOUT_MS = 45_000;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY?.trim();
const MODEL = (process.env.EXPO_PUBLIC_OPENAI_MODEL || "gpt-4o-mini").trim();
const ENDPOINT = (
  process.env.EXPO_PUBLIC_OPENAI_ENDPOINT ||
  "https://api.openai.com/v1/chat/completions"
).trim();

export type JsonSchema = Record<string, unknown>;

export type StructuredRequest = {
  instructions: string;
  text: string;
  imageUri?: string;
  schema: JsonSchema;
};

export function isAiConfigured(): boolean {
  return typeof API_KEY === "string" && API_KEY.length > 0;
}

function mimeFromUri(uri: string): string {
  const ext = /\.([a-zA-Z0-9]+)(?:\?.*)?$/.exec(uri)?.[1]?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
      return "image/heic";
    case "heif":
      return "image/heif";
    default:
      return "image/jpeg";
  }
}

async function buildImageDataUrl(uri: string): Promise<string> {
  const file = new File(uri);
  if (file.size > MAX_IMAGE_BYTES) {
    throw new AIError(
      "api",
      "That photo is too large to read. Retake it and try again.",
    );
  }
  const data = await file.base64();
  const mime =
    file.type && file.type.startsWith("image/") ? file.type : mimeFromUri(uri);
  return `data:${mime};base64,${data}`;
}

/** Pull the text out of an OpenAI chat completion response. */
function extractText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return "";
  const message = (choices[0] as { message?: { content?: unknown } })?.message
    ?.content;

  if (typeof message === "string") return message;
  if (Array.isArray(message)) {
    return message
      .map((part) =>
        part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string"
          ? (part as { text: string }).text
          : "",
      )
      .join("");
  }
  return "";
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send one structured-output request and return the parsed JSON value.
 *
 * The app's prompts already ask for JSON, so OpenAI's `json_object` response
 * format is enough here; the normalizer still validates every field.
 */
export async function requestStructured(
  args: StructuredRequest,
): Promise<unknown> {
  if (!isAiConfigured()) {
    throw new AIError(
      "not_configured",
      "AI is not configured yet. Add EXPO_PUBLIC_OPENAI_API_KEY to .env and restart Metro.",
    );
  }

  const userContent: Record<string, unknown>[] = [
    { type: "text", text: args.text },
  ];
  if (args.imageUri) {
    userContent.push({
      type: "image_url",
      image_url: { url: await buildImageDataUrl(args.imageUri) },
    });
  }

  const body = {
    model: MODEL,
    messages: [
      {
        role: "system",
        content: `${args.instructions}\n\nReturn valid JSON only. No markdown, no commentary outside the JSON.`,
      },
      { role: "user", content: userContent },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  };

  let lastError: AIError | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY ?? ""}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        if (response.status === 429) {
          lastError = new AIError(
            "rate_limit",
            "The AI is busy right now. Try again in a few seconds.",
          );
        } else if (response.status >= 500) {
          lastError = new AIError(
            "api",
            `The AI service is unavailable (${response.status}).`,
          );
        } else if (response.status === 401) {
          throw new AIError(
            "not_configured",
            "The OpenAI API key was rejected. Check EXPO_PUBLIC_OPENAI_API_KEY and restart Metro.",
          );
        } else {
          throw new AIError(
            "api",
            `The AI request failed (${response.status}). ${detail.slice(0, 240)}`,
          );
        }
        if (attempt === 0) {
          await delay(800);
          continue;
        }
        throw lastError;
      }

      const payload: unknown = await response.json();
      const text = extractText(payload);
      if (!text) {
        throw new AIError("bad_json", "The AI returned an empty response.");
      }

      try {
        return JSON.parse(text) as unknown;
      } catch {
        throw new AIError(
          "bad_json",
          "The AI response was not valid JSON. Try a clearer photo.",
        );
      }
    } catch (error) {
      if (error instanceof AIError) throw error;
      if (controller.signal.aborted) {
        throw new AIError(
          "network",
          "The AI took too long to answer. Check your connection and try again.",
        );
      }
      throw new AIError(
        "network",
        "Could not reach the AI. Check your connection and try again.",
      );
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError ?? new AIError("api", "The AI request failed.");
}
