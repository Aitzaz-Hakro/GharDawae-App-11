/**
 * Runtime schema validator and sanitizer for ParchiiAI outputs.
 *
 * Enforces medical safety invariants, strips dangerous or malformed structures,
 * calculates human-review flags, and ensures fallback safety without relying
 * on heavyweight third-party validation libraries.
 */

import { AI_CONFIG } from "./config";
import {
  ConfidenceLevel,
  ExtractedMedicine,
  ExtractionLanguage,
  ExtractionStatus,
  PrescriptionExtractionResult,
} from "./prescription-types";

/**
 * Clean and normalize a string field. Returns null if empty, whitespace-only,
 * or representing undefined/null/unknown.
 */
function cleanString(val: unknown): string | null {
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  if (
    trimmed === "" ||
    trimmed.toLowerCase() === "null" ||
    trimmed.toLowerCase() === "undefined" ||
    trimmed.toLowerCase() === "none" ||
    trimmed.toLowerCase() === "n/a"
  ) {
    return null;
  }
  return trimmed;
}

/**
 * Ensure a confidence level is valid.
 */
function sanitizeConfidence(val: unknown): ConfidenceLevel {
  if (val === "high" || val === "medium" || val === "low") {
    return val;
  }
  return "low";
}

/**
 * Validates and sanitizes a single extracted medicine entry.
 */
export function validateMedicine(raw: unknown): ExtractedMedicine | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;

  const nameAsWritten = cleanString(m.name_as_written);
  const normalizedName = cleanString(m.normalized_name);
  const activeIngredient = cleanString(m.active_ingredient);
  const strength = cleanString(m.strength);
  const dosage = cleanString(m.dosage_as_written);
  const frequency = cleanString(m.frequency_as_written);
  const duration = cleanString(m.duration_as_written);
  const meal = cleanString(m.meal_instruction_as_written);
  const purpose = cleanString(m.purpose);

  let confidence = sanitizeConfidence(m.confidence);
  const uncertainFields: string[] = Array.isArray(m.uncertain_fields)
    ? m.uncertain_fields.filter((f): f is string => typeof f === "string")
    : [];

  // Medical Safety Rule: If both name_as_written and normalized_name are missing,
  // this is an invalid medicine entry.
  if (!nameAsWritten && !normalizedName) {
    return null;
  }

  // Safety invariant: If name is uncertain or confidence is low, pharmacist confirmation is mandatory.
  let needsConfirmation = Boolean(m.needs_pharmacist_confirmation);
  if (
    confidence === "low" ||
    uncertainFields.length > 0 ||
    !dosage ||
    !frequency ||
    !strength
  ) {
    needsConfirmation = true;
  }

  // If both name fields exist and are identical, keep them clean
  return {
    name_as_written: nameAsWritten || normalizedName,
    normalized_name: normalizedName,
    active_ingredient: activeIngredient,
    strength: strength,
    dosage_as_written: dosage,
    frequency_as_written: frequency,
    duration_as_written: duration,
    meal_instruction_as_written: meal,
    purpose: purpose,
    confidence: confidence,
    uncertain_fields: uncertainFields,
    needs_pharmacist_confirmation: needsConfirmation,
    explanation_ur: cleanString(m.explanation_ur),
    explanation_sd: cleanString(m.explanation_sd),
    explanation_en: cleanString(m.explanation_en),
  };
}

/**
 * Validates and sanitizes the full model output against the contract.
 */
export function validatePrescriptionExtraction(
  raw: unknown,
  requestedLanguage: ExtractionLanguage = "ur",
): PrescriptionExtractionResult {
  if (!raw || typeof raw !== "object") {
    return createEmptyOrFailedResult(
      "failed",
      requestedLanguage,
      ["Model output was empty or invalid JSON."],
    );
  }

  const obj = raw as Record<string, unknown>;

  const lang: ExtractionLanguage =
    obj.language === "ur" || obj.language === "sd" || obj.language === "en"
      ? obj.language
      : requestedLanguage;

  let extractionStatus: ExtractionStatus = "complete";
  if (
    obj.extraction_status === "complete" ||
    obj.extraction_status === "partial" ||
    obj.extraction_status === "failed"
  ) {
    extractionStatus = obj.extraction_status;
  }

  const doctorName = cleanString(obj.doctor_name);
  const visitDate = cleanString(obj.visit_date);
  const diagnosis = cleanString(obj.diagnosis_or_symptoms);

  const rawMedicines = Array.isArray(obj.medicines) ? obj.medicines : [];
  const medicines: ExtractedMedicine[] = [];
  for (const item of rawMedicines) {
    const validated = validateMedicine(item);
    if (validated) {
      medicines.push(validated);
    }
  }

  const unreadableText: string[] = Array.isArray(obj.unreadable_text)
    ? obj.unreadable_text.filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    : [];

  const generalWarnings: string[] = Array.isArray(obj.general_warnings)
    ? obj.general_warnings.filter((w): w is string => typeof w === "string" && w.trim().length > 0)
    : [];

  // If no medicines were parsed and status wasn't failed, mark as failed or partial
  if (medicines.length === 0 && extractionStatus !== "failed") {
    extractionStatus = "failed";
    generalWarnings.push("No legible medicines could be identified in the image.");
  }

  // Human review invariant:
  // Requires human review if:
  // - status is partial or failed
  // - any medicine requires pharmacist confirmation
  // - any unreadable text is reported
  // - general warnings are present
  const requiresHumanReview =
    extractionStatus !== "complete" ||
    medicines.some((m) => m.needs_pharmacist_confirmation || m.confidence !== "high") ||
    unreadableText.length > 0 ||
    generalWarnings.length > 0 ||
    Boolean(obj.requires_human_review);

  const summaryExplanation = cleanString(obj.summary_explanation) || undefined;

  // Keep the language chips useful even if the model only filled the single
  // legacy summary field: assign it to the language that was requested.
  const summaryUr =
    cleanString(obj.summary_explanation_ur) ||
    (lang === "ur" ? summaryExplanation : undefined);
  const summarySd =
    cleanString(obj.summary_explanation_sd) ||
    (lang === "sd" ? summaryExplanation : undefined);
  const summaryEn =
    cleanString(obj.summary_explanation_en) ||
    (lang === "en" ? summaryExplanation : undefined);

  return {
    language: lang,
    extraction_status: extractionStatus,
    doctor_name: doctorName,
    visit_date: visitDate,
    diagnosis_or_symptoms: diagnosis,
    medicines: medicines,
    unreadable_text: unreadableText,
    general_warnings: generalWarnings,
    requires_human_review: requiresHumanReview,
    summary_explanation: summaryExplanation,
    summary_explanation_ur: summaryUr,
    summary_explanation_sd: summarySd,
    summary_explanation_en: summaryEn,
    disclaimer: AI_CONFIG.DISCLAIMER_TEXT[lang] || AI_CONFIG.DISCLAIMER_TEXT.en,
  };
}

/**
 * Helper to construct a safe fallback/failed result.
 */
export function createEmptyOrFailedResult(
  status: ExtractionStatus,
  language: ExtractionLanguage,
  warnings: string[] = [],
): PrescriptionExtractionResult {
  return {
    language: language,
    extraction_status: status,
    doctor_name: null,
    visit_date: null,
    diagnosis_or_symptoms: null,
    medicines: [],
    unreadable_text: [],
    general_warnings: warnings,
    requires_human_review: true,
    disclaimer: AI_CONFIG.DISCLAIMER_TEXT[language] || AI_CONFIG.DISCLAIMER_TEXT.en,
  };
}
