// The ONLY place that talks to the model provider.
//
// API details are still pending from the team. When they arrive, change this
// file only: every screen calls extractPrescription / sendToAssistant, and
// those call requestStructured below. Keep the exported shape stable.
//
// Env:
//   EXPO_PUBLIC_GEMINI_API_KEY   required for live calls
//   EXPO_PUBLIC_GEMINI_MODEL     default "gemini-2.5-flash"
//   EXPO_PUBLIC_GEMINI_ENDPOINT  default Interactions API
//
// Note: EXPO_PUBLIC_* values are embedded in the JS bundle. Use a
// demo-scoped key with a quota and rotate it after the event.

import { File } from "expo-file-system";

import { AIError } from "./types";

const TIMEOUT_MS = 45_000;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();
const MODEL = (
  process.env.EXPO_PUBLIC_GEMINI_MODEL || "gemini-2.5-flash"
).trim();
const ENDPOINT = (
  process.env.EXPO_PUBLIC_GEMINI_ENDPOINT ||
  "https://generativelanguage.googleapis.com/v1beta/interactions"
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

async function buildImagePart(uri: string): Promise<Record<string, unknown>> {
  const file = new File(uri);
  if (file.size > MAX_IMAGE_BYTES) {
    throw new AIError(
      "api",
      "That photo is too large to read. Retake it and try again.",
    );
  }
  const data = await file.base64();
  const mime = file.type && file.type.startsWith("image/") ? file.type : mimeFromUri(uri);
  return { type: "image", data, mime_type: mime };
}

/** Pull the JSON text out of either the Interactions or legacy response shape. */
function extractText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const root = payload as Record<string, unknown>;
  const node =
    root.interaction && typeof root.interaction === "object"
      ? (root.interaction as Record<string, unknown>)
      : root;

  if (typeof node.output_text === "string") return node.output_text;

  if (Array.isArray(node.outputs)) {
    const first = node.outputs[0] as Record<string, unknown> | undefined;
    if (first && typeof first.text === "string") return first.text;
    const content = first?.content;
    if (Array.isArray(content)) {
      const text = content
        .map((p) =>
          p && typeof p === "object" && typeof (p as { text?: unknown }).text === "string"
            ? (p as { text: string }).text
            : "",
        )
        .join("");
      if (text) return text;
    }
  }

  const candidates = node.candidates;
  if (Array.isArray(candidates)) {
    const parts = (candidates[0] as { content?: { parts?: unknown[] } } | undefined)
      ?.content?.parts;
    if (Array.isArray(parts)) {
      return parts
        .map((p) =>
          p && typeof p === "object" && typeof (p as { text?: unknown }).text === "string"
            ? (p as { text: string }).text
            : "",
        )
        .join("");
    }
  }

  return "";
}

async function post(body: unknown, signal: AbortSignal): Promise<Response> {
  return fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY ?? "",
    },
    body: JSON.stringify(body),
    signal,
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send one structured-output request and return the parsed JSON value.
 *
 * This is the seam: if the team's endpoint uses a different body shape,
 * rewrite only this function. The rest of the app is already typed.
 */
export async function requestStructured(
  args: StructuredRequest,
): Promise<unknown> {
  if (!isAiConfigured()) {
    throw new AIError(
      "not_configured",
      "AI is not configured yet. Add EXPO_PUBLIC_GEMINI_API_KEY to .env and restart Metro.",
    );
  }

  const parts: Record<string, unknown>[] = [
    { type: "text", text: `${args.instructions}\n\n${args.text}` },
  ];
  if (args.imageUri) {
    parts.push(await buildImagePart(args.imageUri));
  }

  const body = {
    model: MODEL,
    input: parts,
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: args.schema,
    },
  };

  let lastError: AIError | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await post(body, controller.signal);

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
