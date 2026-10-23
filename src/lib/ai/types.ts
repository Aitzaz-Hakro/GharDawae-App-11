// Frozen contract for the hackathon AI features.
//
// Every caller (scan review, assistant chat, demo mode) codes against these
// types. Change them only with a message to both teammates and a Change Log
// entry in docs/hackathon/hammad-backend-tasks.md.

export type Lang = "en" | "ur";

export type DoseTime = "morning" | "afternoon" | "night";

export type ExtractedMedicine = {
  /** Medicine name as written, without the strength. */
  name: string;
  /** Salt / active ingredient, e.g. "Paracetamol". */
  active_ingredient: string | null;
  /** "500 mg" */
  strength: string | null;
  /** "1 tablet" */
  dosage: string | null;
  /** "twice a day" */
  frequency: string | null;
  /** "5 days" */
  duration: string | null;
  /** Drives the visual morning/afternoon/night schedule. */
  times: DoseTime[];
  with_food: "before" | "after" | null;
  warnings: string[];
  /** 0..1. Below 0.7 the review UI flags the row. */
  confidence: number;
};

export type PrescriptionExtraction = {
  /** Full transcription — proves the result is not a mock. */
  raw_text: string;
  doctor_name: string | null;
  /** YYYY-MM-DD. */
  visit_date: string | null;
  diagnosis: string | null;
  medicines: ExtractedMedicine[];
  /** Duplicate salt, course completion, food rules. */
  warnings: string[];
  /** 2–4 simple sentences in Arabic-script Urdu. */
  urdu_summary: string;
  sindhi_summary: string | null;
  overall_confidence: number;
};

export type FoodAnalysis = {
  verdict: "good" | "moderate" | "avoid";
  headline: string;
  reasons: string[];
  concerns: string[];
  swaps: { from: string; to: string; why: string }[];
  portion_note: string | null;
  urdu_summary: string;
  confidence: number;
};

export type AssistantReply =
  | { kind: "text"; text: string }
  | { kind: "food"; text: string; food: FoodAnalysis }
  | {
      kind: "prescription";
      text: string;
      prescription: PrescriptionExtraction;
    };

/** The minimum member data sent to the model. Never includes the name. */
export type MemberContext = {
  id: string;
  /** Display only — stripped before the prompt is built. */
  name: string;
  age: number | null;
  gender: "male" | "female" | "other" | null;
  medicines: string[];
  recent_notes: string[];
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  imageUri?: string;
  imageKind?: "food" | "prescription";
  reply?: AssistantReply;
  status: "sending" | "done" | "error";
  error?: string;
};

export type AssistantArgs = {
  /** Last 8 turns, text only. Images from older turns are not resent. */
  history: ChatMessage[];
  text: string;
  imageUri?: string;
  imageKind?: "food" | "prescription";
  context: MemberContext | null;
  lang: Lang;
};

export type AIErrorCode =
  | "network"
  | "rate_limit"
  | "bad_json"
  | "api"
  | "not_configured";

export class AIError extends Error {
  readonly code: AIErrorCode;

  constructor(code: AIErrorCode, message: string) {
    super(message);
    this.name = "AIError";
    this.code = code;
  }
}
