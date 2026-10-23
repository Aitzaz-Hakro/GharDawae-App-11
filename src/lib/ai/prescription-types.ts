/**
 * Types and contracts for Ghar Dawae / ParchiiAI Prescription Intelligence.
 *
 * Designed to provide safe, structured extraction from prescription slips and
 * medicine packages with uncertainty flagging, multilingual explanations (Urdu/Sindhi/English),
 * and strict pharmacist verification boundaries.
 */

export type ExtractionLanguage = "ur" | "sd" | "en";

export type ConfidenceLevel = "high" | "medium" | "low";

export type ExtractionStatus = "complete" | "partial" | "failed";

export type UncertainField =
  | "name_as_written"
  | "normalized_name"
  | "strength"
  | "dosage_as_written"
  | "frequency_as_written"
  | "duration_as_written"
  | "meal_instruction_as_written"
  | "doctor_name"
  | "visit_date"
  | "diagnosis";

export interface ExtractedMedicine {
  /** Name of the medicine exactly as read or scribbled on the prescription slip. */
  name_as_written: string | null;
  /** Standard commercial/generic brand name if unambiguously supported by the slip. */
  normalized_name: string | null;
  /** Active chemical ingredient if identifiable from the brand or slip (e.g. Paracetamol). */
  active_ingredient: string | null;
  /** Formulated strength (e.g. 500mg, 10mg/5ml). */
  strength: string | null;
  /** Dosage instruction as written (e.g. 1 tablet, 2 puffs, 5 ml). */
  dosage_as_written: string | null;
  /** Frequency instruction as written (e.g. 1+0+1, TDS, BID, daily at bedtime). */
  frequency_as_written: string | null;
  /** Duration of treatment (e.g. 5 days, 1 month, SOS). */
  duration_as_written: string | null;
  /** Meal timing instruction (e.g. after food / کھانے کے بعد / کاڌي کان پوءِ, before breakfast). */
  meal_instruction_as_written: string | null;
  /** General informational purpose (e.g. for pain/fever). NEVER a confirmed diagnosis. */
  purpose: string | null;
  /** Per-medicine extraction confidence. */
  confidence: ConfidenceLevel;
  /** Specific fields where handwriting, glare, or tear made reading ambiguous. */
  uncertain_fields: string[];
  /** Flagged true whenever handwriting is ambiguous, strength is missing, or risk is elevated. */
  needs_pharmacist_confirmation: boolean;
  /** Localized simple explanation for caretakers in Urdu. */
  explanation_ur?: string | null;
  /** Localized simple explanation for caretakers in Sindhi. */
  explanation_sd?: string | null;
  /** Localized simple explanation for caretakers in English. */
  explanation_en?: string | null;
}

export interface PrescriptionExtractionResult {
  /** Primary language of the generated explanations ("ur" = Urdu, "sd" = Sindhi, "en" = English). */
  language: ExtractionLanguage;
  /** Extraction outcome status. */
  extraction_status: ExtractionStatus;
  /** Doctor or clinic name if visible on the letterhead. */
  doctor_name: string | null;
  /** Prescription or visit date if visible (YYYY-MM-DD format if parseable). */
  visit_date: string | null;
  /** Provisional diagnosis note or symptoms scribbled by the physician. */
  diagnosis_or_symptoms: string | null;
  /** Extracted list of medicines with dosage, frequency, duration, and safety flags. */
  medicines: ExtractedMedicine[];
  /** Snippets of illegible or cropped text that could not be deciphered safely. */
  unreadable_text: string[];
  /** Safety alerts, potential interaction flags, or warnings (e.g. expired slip, missing strength). */
  general_warnings: string[];
  /** True whenever any medicine has low confidence, unreadable text exists, or pharmacist review is needed. */
  requires_human_review: boolean;
  /** Caregiver-focused summary and instruction narrative in the requested language. */
  summary_explanation?: string;
  /** Localized summaries so the Urdu/Sindhi/English chips all have content. */
  summary_explanation_ur?: string;
  summary_explanation_sd?: string;
  summary_explanation_en?: string;
  /** Informational medical disclaimer note. */
  disclaimer: string;
}

/** Error structure for AI vision and validation pipeline failures. */
export type AIErrorCode =
  | "MISSING_API_KEY"
  | "INVALID_API_KEY"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "RATE_LIMIT"
  | "INVALID_IMAGE"
  | "MALFORMED_RESPONSE"
  | "EMPTY_RESULT"
  | "BLURRY_OR_UNREADABLE"
  | "UNKNOWN_ERROR";

export interface AIAnalysisError {
  code: AIErrorCode;
  message: string;
  userFacingMessage: {
    en: string;
    ur: string;
    sd: string;
  };
  details?: unknown;
}
