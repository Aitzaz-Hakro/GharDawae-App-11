/**
 * AI Service Configuration for Ghar Dawae / ParchiiAI.
 *
 * Configures the vision providers:
 * - OpenAI Vision (gpt-4o-mini / gpt-4o)
 * - Google Gemini Vision (gemini-2.5-flash / gemini-1.5-flash)
 * - Serverless AI Proxy
 *
 * Automatically detects which API key is configured.
 *
 * SECURITY NOTICE:
 * Client-embedded API keys prefixed with `EXPO_PUBLIC_` are bundled directly into
 * the compiled JavaScript bundle and are extractable by inspecting the APK / web assets.
 * For production deployment, set `EXPO_PUBLIC_AI_PROXY_URL` to route requests through
 * a secure serverless backend proxy without exposing raw credentials to clients.
 */

declare const process: {
  env: Record<string, string | undefined>;
};

export type AIProvider = "openai" | "gemini" | "proxy";

export const AI_CONFIG = {
  /** Google Gemini models */
  GEMINI_PRIMARY_MODEL: "gemini-2.5-flash",
  GEMINI_FALLBACK_MODEL: "gemini-1.5-flash",
  GEMINI_API_BASE_URL: "https://generativelanguage.googleapis.com/v1beta/models",

  /** OpenAI models */
  OPENAI_PRIMARY_MODEL: "gpt-4o-mini",
  OPENAI_FALLBACK_MODEL: "gpt-4o",
  OPENAI_API_BASE_URL: "https://api.openai.com/v1/chat/completions",

  /** Default request timeout in milliseconds (35 seconds) */
  REQUEST_TIMEOUT_MS: 35000,
  /** Maximum image payload size in bytes (10MB) */
  MAX_IMAGE_SIZE_BYTES: 10 * 1024 * 1024,
  /** Standard disclaimer mandated for all clinical AI outputs */
  DISCLAIMER_TEXT: {
    en: "Important: ParchiiAI is a prescription-reading aid, not a diagnostic or prescribing service. Ambiguous handwriting and dosages must always be verified with a licensed pharmacist or physician.",
    ur: "اہم نوٹ: پرچی اے آئی صرف نسخہ پڑھنے میں مددگار ہے، یہ طبی تشخیص یا علاج تجویز نہیں کرتی۔ کسی بھی دوا کی خوراک اور تفصیلات کی تصدیق مستند فارماسسٹ یا معالج سے لازمی کریں۔",
    sd: "ضروري نوٽ: پرچي اي آئي صرف نسخي کي سمجهڻ لاءِ مددگار آهي، هي طبي تشخيص نٿو ڪري. ڪنهن به دوا جي تصديق پنهنجي ڊاڪٽر يا فارماسسٽ کان ضرور ڪرايو.",
  },
} as const;

/**
 * Retrieve the configured OpenAI API key from environment variables.
 */
export function getOpenAIApiKey(): string | null {
  const key =
    process.env.EXPO_PUBLIC_OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    null;
  if (!key || key.trim() === "" || key.includes("YOUR_API_KEY_HERE")) {
    return null;
  }
  return key.trim();
}

/**
 * Retrieve the configured Gemini API key from environment variables.
 */
export function getGeminiApiKey(): string | null {
  const key =
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    null;
  if (!key || key.trim() === "" || key.includes("YOUR_API_KEY_HERE")) {
    return null;
  }
  return key.trim();
}

/**
 * Determine which AI provider is currently active based on configured keys.
 * Prioritizes OpenAI if configured, then Gemini, then Proxy.
 */
export function getAIProvider(): AIProvider | null {
  if (process.env.EXPO_PUBLIC_AI_PROXY_URL) return "proxy";
  if (getOpenAIApiKey()) return "openai";
  if (getGeminiApiKey()) return "gemini";
  return null;
}

/**
 * Check if any AI vision provider or proxy is configured and ready.
 */
export function isAIConfigured(): boolean {
  return getAIProvider() !== null;
}

/**
 * Returns the effective API key for the active provider.
 */
export function getActiveApiKey(): string | null {
  const provider = getAIProvider();
  if (provider === "openai") return getOpenAIApiKey();
  if (provider === "gemini") return getGeminiApiKey();
  return null;
}

/**
 * Returns the default primary model for the active provider.
 */
export function getDefaultModel(provider: AIProvider = getAIProvider() || "openai"): string {
  if (provider === "openai") return AI_CONFIG.OPENAI_PRIMARY_MODEL;
  if (provider === "gemini") return AI_CONFIG.GEMINI_PRIMARY_MODEL;
  return AI_CONFIG.OPENAI_PRIMARY_MODEL;
}

/**
 * Returns the effective API endpoint URL for the vision call.
 */
export function getAIEndpointUrl(
  provider: AIProvider = getAIProvider() || "openai",
  model: string = getDefaultModel(provider),
): string {
  const proxyUrl = process.env.EXPO_PUBLIC_AI_PROXY_URL;
  if (proxyUrl && proxyUrl.trim() !== "") {
    return proxyUrl.trim();
  }
  if (provider === "openai") {
    return AI_CONFIG.OPENAI_API_BASE_URL;
  }
  return `${AI_CONFIG.GEMINI_API_BASE_URL}/${model}:generateContent`;
}
