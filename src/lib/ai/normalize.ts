// Defensive parsing for model output.
//
// Structured output is syntactically valid JSON, but values can still be
// missing, empty, or semantically wrong. Nothing here throws: the UI must
// always get a usable object, even if it has to fall back to a text reply.

import { parseSchedule } from "@/lib/schedule";
import type {
  AssistantReply,
  DoseTime,
  ExtractedMedicine,
  FoodAnalysis,
  PrescriptionExtraction,
} from "./types";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function asNullableString(value: unknown): string | null {
  const s = asString(value);
  return s.length > 0 ? s : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => asString(v))
    .filter((v) => v.length > 0);
}

function clamp01(value: unknown, fallback = 0.5): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(1, Math.max(0, n));
}

function normKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function asTimes(value: unknown): DoseTime[] {
  if (!Array.isArray(value)) return [];
  const allowed: DoseTime[] = ["morning", "afternoon", "night"];
  const out: DoseTime[] = [];
  for (const item of value) {
    const t = asString(item).toLowerCase() as DoseTime;
    if (allowed.includes(t) && !out.includes(t)) out.push(t);
  }
  return out;
}

function asDate(value: unknown): string | null {
  const s = asString(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return s;
}

function normalizeMedicine(input: unknown): ExtractedMedicine | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const name = asString(raw.name);
  if (!name) return null;

  const times = asTimes(raw.times);
  const frequency = asNullableString(raw.frequency);

  return {
    name,
    active_ingredient: asNullableString(raw.active_ingredient),
    strength: asNullableString(raw.strength),
    dosage: asNullableString(raw.dosage),
    frequency,
    duration: asNullableString(raw.duration),
    times: times.length > 0 ? times : parseSchedule(frequency),
    with_food:
      raw.with_food === "before" || raw.with_food === "after"
        ? raw.with_food
        : null,
    warnings: asStringArray(raw.warnings),
    confidence: clamp01(raw.confidence, 0.5),
  };
}

/**
 * Guarantee the duplicate-salt warning even if the model forgets it.
 * Two medicines sharing a salt is the cheapest clinically-meaningful check.
 */
function addDuplicateWarnings(
  medicines: ExtractedMedicine[],
  warnings: string[],
): string[] {
  const bySalt = new Map<string, ExtractedMedicine[]>();
  for (const m of medicines) {
    if (!m.active_ingredient) continue;
    const key = normKey(m.active_ingredient);
    if (!key) continue;
    const list = bySalt.get(key);
    if (list) list.push(m);
    else bySalt.set(key, [m]);
  }

  const out = [...warnings];
  for (const group of bySalt.values()) {
    if (group.length < 2) continue;
    const names = group.map((m) => m.name).join(" and ");
    const salt = group[0].active_ingredient ?? "the same medicine";
    const msg = `${names} both contain ${salt}. Taking both can exceed the safe dose — check with a doctor or pharmacist.`;
    if (!out.some((w) => w.toLowerCase().includes(salt.toLowerCase()))) {
      out.push(msg);
    }
  }
  return out;
}

export function normalizeExtraction(input: unknown): PrescriptionExtraction {
  const raw =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};

  const medicines = Array.isArray(raw.medicines)
    ? raw.medicines
        .map(normalizeMedicine)
        .filter((m): m is ExtractedMedicine => m !== null)
    : [];

  const warnings = addDuplicateWarnings(medicines, asStringArray(raw.warnings));

  const avg =
    medicines.length > 0
      ? medicines.reduce((sum, m) => sum + m.confidence, 0) / medicines.length
      : 0.5;

  return {
    raw_text: asString(raw.raw_text),
    doctor_name: asNullableString(raw.doctor_name),
    visit_date: asDate(raw.visit_date),
    diagnosis: asNullableString(raw.diagnosis),
    medicines,
    warnings,
    urdu_summary: asString(raw.urdu_summary),
    sindhi_summary: asNullableString(raw.sindhi_summary),
    overall_confidence: clamp01(raw.overall_confidence, avg),
  };
}

export function normalizeFood(input: unknown): FoodAnalysis {
  const raw =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  const verdict =
    raw.verdict === "good" || raw.verdict === "avoid" ? raw.verdict : "moderate";

  const swaps = Array.isArray(raw.swaps)
    ? raw.swaps
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const s = item as Record<string, unknown>;
          const from = asString(s.from);
          const to = asString(s.to);
          if (!from || !to) return null;
          return { from, to, why: asString(s.why) };
        })
        .filter(
          (s): s is { from: string; to: string; why: string } => s !== null,
        )
    : [];

  return {
    verdict,
    headline: asString(raw.headline, "Here is a general check on this food."),
    reasons: asStringArray(raw.reasons),
    concerns: asStringArray(raw.concerns),
    swaps,
    portion_note: asNullableString(raw.portion_note),
    urdu_summary: asString(raw.urdu_summary),
    confidence: clamp01(raw.confidence, 0.5),
  };
}

export function normalizeAssistantReply(input: unknown): AssistantReply {
  const raw =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  const text = asString(raw.text);

  if (raw.kind === "food" && raw.food) {
    return { kind: "food", text, food: normalizeFood(raw.food) };
  }
  if (raw.kind === "prescription" && raw.prescription) {
    return {
      kind: "prescription",
      text,
      prescription: normalizeExtraction(raw.prescription),
    };
  }
  return {
    kind: "text",
    text:
      text ||
      "I could not read that response. Please try again with a clearer photo.",
  };
}
