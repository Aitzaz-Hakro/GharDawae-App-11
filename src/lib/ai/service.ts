/**
 * Core AI Vision Service for Ghar Dawae / ParchiiAI.
 *
 * Implements the end-to-end pipeline supporting:
 * - OpenAI Vision (gpt-4o-mini / gpt-4o)
 * - Google Gemini Vision (gemini-2.5-flash / gemini-1.5-flash)
 *
 * Automatically detects whether an OpenAI or Gemini API key is configured.
 * Pipeline:
 * Image validation -> Base64 encoding -> Vision API call -> JSON parsing
 * -> Schema & Medical Invariant Validation -> Multilingual formatting.
 */

import { File, Paths } from "expo-file-system";
import {
  AI_CONFIG,
  AIProvider,
  getActiveApiKey,
  getAIEndpointUrl,
  getAIProvider,
  getDefaultModel,
} from "./config";
import { buildPrescriptionAnalysisPrompt } from "./prescription-prompt";
import {
  AIAnalysisError,
  ExtractionLanguage,
  PrescriptionExtractionResult,
} from "./prescription-types";
import {
  createEmptyOrFailedResult,
  validatePrescriptionExtraction,
} from "./validator";

declare const process: {
  env: Record<string, string | undefined>;
};
declare const require: (module: string) => any;

export interface AnalyzePrescriptionOptions {
  imageUri: string;
  language?: ExtractionLanguage;
  apiKey?: string;
  timeoutMs?: number;
  model?: string;
  provider?: AIProvider;
}

/**
 * Determine MIME type based on URI extension.
 */
function getMimeType(uri: string): string {
  const match = /\.([a-zA-Z0-9]{2,5})(?:\?.*)?$/.exec(uri);
  const ext = match?.[1]?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic") return "image/heic";
  return "image/jpeg";
}

/**
 * Reads a local file URI or a remote (signed) URL and returns its base64
 * representation plus MIME type.
 *
 * Saved records may only have a Supabase signed URL after a reinstall, so a
 * remote image is downloaded to the cache first instead of being passed to
 * `new File(https://...)`, which only works for local paths.
 */
export async function readImageAsBase64(
  uri: string,
): Promise<{ base64: string; mimeType: string }> {
  try {
    if (/^https?:\/\//i.test(uri)) {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Image download failed (${response.status}).`);
      }
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength > AI_CONFIG.MAX_IMAGE_SIZE_BYTES) {
        throw new Error("Image is larger than the 10 MB limit.");
      }
      const contentType = (response.headers.get("content-type") || "")
        .split(";")[0]
        .trim();
      const mimeType = contentType.startsWith("image/")
        ? contentType
        : "image/jpeg";
      const extension = mimeType.split("/")[1] || "jpg";
      const temp = new File(
        Paths.cache,
        `parchiiai-${Date.now()}.${extension}`,
      );
      try {
        temp.write(bytes);
        return { base64: await temp.base64(), mimeType };
      } finally {
        if (temp.exists) temp.delete();
      }
    }

    const file = new File(uri);
    if (!file.exists) {
      throw new Error(`File does not exist at uri: ${uri}`);
    }
    if (file.size > AI_CONFIG.MAX_IMAGE_SIZE_BYTES) {
      throw new Error("Image is larger than the 10 MB limit.");
    }
    const mimeType =
      file.type && file.type.startsWith("image/")
        ? file.type
        : getMimeType(uri);

    // Modern expo-file-system File class provides base64()
    if (typeof file.base64 === "function") {
      return { base64: await file.base64(), mimeType };
    }
    // Fallback if expo-file-system legacy is loaded
    const LegacyFS = require("expo-file-system/legacy");
    if (LegacyFS?.readAsStringAsync) {
      const base64 = await LegacyFS.readAsStringAsync(uri, {
        encoding: LegacyFS.EncodingType.Base64,
      });
      return { base64, mimeType };
    }
    throw new Error("No compatible base64 reader found in expo-file-system");
  } catch (error) {
    throw new Error(`Failed to read image as base64: ${(error as Error).message}`);
  }
}

/**
 * Main pipeline: Analyze a prescription image and return structured clinical data.
 */
export async function analyzePrescriptionImage({
  imageUri,
  language = "ur",
  apiKey: explicitKey,
  timeoutMs = AI_CONFIG.REQUEST_TIMEOUT_MS,
  model,
  provider: explicitProvider,
}: AnalyzePrescriptionOptions): Promise<PrescriptionExtractionResult> {
  if (!imageUri || imageUri.trim() === "") {
    throw createAIError("INVALID_IMAGE", "No image URI provided for analysis.");
  }

  const provider: AIProvider | null = explicitProvider || getAIProvider();
  const apiKey = explicitKey || getActiveApiKey();
  const proxyUrl = process.env.EXPO_PUBLIC_AI_PROXY_URL;

  if (!apiKey && !proxyUrl) {
    throw createAIError(
      "MISSING_API_KEY",
      "No AI vision key configured. Add EXPO_PUBLIC_OPENAI_API_KEY or EXPO_PUBLIC_GEMINI_API_KEY to your .env file.",
    );
  }

  const activeProvider: AIProvider = provider || (apiKey?.startsWith("sk-") ? "openai" : "gemini");
  const activeModel = model || getDefaultModel(activeProvider);

  // 1. Read image base64 (local file or remote signed URL)
  let base64Data: string;
  let mimeType: string;
  try {
    const image = await readImageAsBase64(imageUri);
    base64Data = image.base64;
    mimeType = image.mimeType;
  } catch (e) {
    throw createAIError(
      "INVALID_IMAGE",
      `Unable to load prescription image: ${(e as Error).message}`,
    );
  }

  const promptText = buildPrescriptionAnalysisPrompt(language);

  // 2. Build provider-specific request payload & headers
  let endpoint = getAIEndpointUrl(activeProvider, activeModel);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  let requestBody: unknown;

  if (activeProvider === "openai") {
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    requestBody = {
      model: activeModel,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: promptText,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`,
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_object",
      },
      temperature: 0.1,
    };
  } else {
    // Google Gemini format
    if (apiKey) {
      headers["x-goog-api-key"] = apiKey;
    }
    requestBody = {
      contents: [
        {
          parts: [
            {
              text: promptText,
            },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    };
  }

  // 3. Dispatch HTTP request with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if ((err as Error)?.name === "AbortError") {
      throw createAIError("TIMEOUT", "Request to vision model timed out.");
    }
    throw createAIError(
      "NETWORK_ERROR",
      `Network failure connecting to AI service: ${(err as Error).message}`,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  // 4. Handle non-200 responses
  if (!response.ok) {
    const errorStatus = response.status;
    let errorDetail = "";
    try {
      const errorJson = await response.json();
      errorDetail =
        errorJson?.error?.message ||
        errorJson?.message ||
        JSON.stringify(errorJson);
    } catch {
      errorDetail = await response.text();
    }

    if (errorStatus === 429) {
      throw createAIError(
        "RATE_LIMIT",
        `AI service rate limit exceeded. Please wait a moment and retry. (${errorDetail})`,
      );
    }

    // A rejected key is a configuration problem, not a model problem. Make the
    // message actionable instead of showing a generic "unexpected error".
    if (errorStatus === 401 || errorStatus === 403) {
      throw createAIError(
        "INVALID_API_KEY",
        `The AI provider rejected the API key (HTTP ${errorStatus}). Check EXPO_PUBLIC_OPENAI_API_KEY / EXPO_PUBLIC_GEMINI_API_KEY and restart the app.`,
      );
    }

    // Provider fallback handling
    if (errorStatus === 404 || errorStatus === 503) {
      if (activeProvider === "openai" && activeModel === AI_CONFIG.OPENAI_PRIMARY_MODEL) {
        return analyzePrescriptionImage({
          imageUri,
          language,
          apiKey: apiKey || undefined,
          timeoutMs,
          model: AI_CONFIG.OPENAI_FALLBACK_MODEL,
          provider: "openai",
        });
      }
      if (activeProvider === "gemini" && activeModel === AI_CONFIG.GEMINI_PRIMARY_MODEL) {
        return analyzePrescriptionImage({
          imageUri,
          language,
          apiKey: apiKey || undefined,
          timeoutMs,
          model: AI_CONFIG.GEMINI_FALLBACK_MODEL,
          provider: "gemini",
        });
      }
    }

    throw createAIError(
      "UNKNOWN_ERROR",
      `Vision API error (${activeProvider} HTTP ${errorStatus}): ${errorDetail}`,
    );
  }

  // 5. Parse response content
  let responseData: any;
  try {
    responseData = await response.json();
  } catch {
    throw createAIError(
      "MALFORMED_RESPONSE",
      "Failed to parse JSON response from AI provider.",
    );
  }

  // Extract raw JSON string based on provider response format
  let rawText: string | undefined;
  if (activeProvider === "openai") {
    rawText = responseData?.choices?.[0]?.message?.content;
  } else {
    // Gemini
    const candidate = responseData?.candidates?.[0];
    rawText = candidate?.content?.parts?.[0]?.text;
  }

  if (!rawText || rawText.trim() === "") {
    return createEmptyOrFailedResult(
      "failed",
      language,
      ["The model did not return any readable prescription analysis."],
    );
  }

  // 6. Parse inner JSON and validate against clinical schema
  let parsedJson: unknown;
  try {
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    parsedJson = JSON.parse(cleaned);
  } catch {
    throw createAIError(
      "MALFORMED_RESPONSE",
      "Model output did not conform to valid JSON format.",
    );
  }

  return validatePrescriptionExtraction(parsedJson, language);
}

/**
 * Creates structured AIAnalysisError with multilingual user-facing messages.
 */
export function createAIError(
  code: AIAnalysisError["code"],
  message: string,
  details?: unknown,
): AIAnalysisError {
  const userFacingMap: Record<
    AIAnalysisError["code"],
    { en: string; ur: string; sd: string }
  > = {
    MISSING_API_KEY: {
      en: "AI vision service is not configured. Please add your OpenAI or Gemini API key in the .env file.",
      ur: "اے آئی سروس فعال نہیں ہے۔ براہ کرم .env میں اپنی OpenAI یا Gemini API کی درج کریں۔",
      sd: "اي آئي سروس چالو ناهي. مهرباني ڪري .env ۾ پنهنجي OpenAI يا Gemini API ڪي داخل ڪريو.",
    },
    INVALID_API_KEY: {
      en: "The AI key was rejected. Check EXPO_PUBLIC_OPENAI_API_KEY / EXPO_PUBLIC_GEMINI_API_KEY and restart the app.",
      ur: "اے آئی کی کلید مسترد ہو گئی۔ .env میں اپنی OpenAI یا Gemini کلید چیک کریں اور ایپ دوبارہ شروع کریں۔",
      sd: "اي آئي ڪيئي رد ٿي وئي. .env ۾ پنهنجي OpenAI يا Gemini ڪيئي چيڪ ڪريو ۽ ايپ ٻيهر شروع ڪريو.",
    },
    NETWORK_ERROR: {
      en: "Cannot connect to AI service. Please check your internet connection.",
      ur: "اے آئی سروس سے رابطہ نہیں ہو سکا۔ برائے مہربانی اپنا انٹرنیٹ کنکشن چیک کریں۔",
      sd: "اي آئي سروس سان رابطو نه ٿي سگهيو. مهرباني ڪري انٽرنيٽ چيڪ ڪريو.",
    },
    TIMEOUT: {
      en: "Prescription analysis timed out. Please try again with good lighting.",
      ur: "نسخہ تجزیہ کرنے کا وقت ختم ہو گیا۔ برائے مہربانی صاف تصویر کے ساتھ دوبارہ کوشش کریں۔",
      sd: "نسخي تجزئي جو وقت پورو ٿي ويو. صاف تصوير سان ٻيهر ڪوشش ڪريو.",
    },
    RATE_LIMIT: {
      en: "AI request quota exceeded. Please wait a minute and retry.",
      ur: "اے آئی کی درخواستوں کی حد ختم ہو گئی۔ براہ کرم ایک منٹ بعد دوبارہ کوشش کریں۔",
      sd: "اي آئي ڪوٽا پوري ٿي وئي آهي. مهرباني ڪري ڪجهه دير بعد ڪوشش ڪريو.",
    },
    INVALID_IMAGE: {
      en: "Invalid or corrupted prescription image.",
      ur: "نسخے کی تصویر خراب یا ناقابلِ فہم ہے۔",
      sd: "نسخي جي تصوير پڙهڻ جوڳي ناهي.",
    },
    MALFORMED_RESPONSE: {
      en: "Unable to parse prescription details safely. Human review required.",
      ur: "نسخے کی تفصیلات محفوظ طریقے سے نہیں پڑھی جا سکیں۔ براہ کرم دستی اندراج کریں۔",
      sd: "نسخي جا تفصيل محفوظ نموني نه مليا. پاڻ تصديق ڪريو.",
    },
    EMPTY_RESULT: {
      en: "No prescription text could be detected in this image.",
      ur: "اس تصویر میں کوئی طبی نسخہ یا دوا نہیں مل سکی۔",
      sd: "هن تصوير ۾ ڪوبه طبي نسخو نه مليو.",
    },
    BLURRY_OR_UNREADABLE: {
      en: "The image is too blurry or dark. Please retake in bright lighting.",
      ur: "تصویر بہت دھندلی یا اندھیرے میں ہے۔ براہ کرم تیز روشنی میں دوبارہ تصویر لیں۔",
      sd: "تصوير تمام گهڻي ڌنڌلي آهي. روشنيءَ ۾ ٻيهر تصوير ڪڍو.",
    },
    UNKNOWN_ERROR: {
      en: "An unexpected error occurred while analyzing the prescription.",
      ur: "نسخہ پڑھتے ہوئے ایک غیر متوقع خرابی پیش آئی۔",
      sd: "نسخو پڙهڻ دوران هڪ اڻڄاتل خرابي پيش آئي.",
    },
  };

  return {
    code,
    message,
    userFacingMessage: userFacingMap[code] || userFacingMap.UNKNOWN_ERROR,
    details,
  };
}
