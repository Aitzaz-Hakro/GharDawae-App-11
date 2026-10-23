// Public AI service used by the screens.
//
// Keeping these two functions separate from the provider adapter means the
// team can swap Gemini for another API without touching the UI.

import { cacheExtraction, getCachedExtraction } from "./cache";
import { requestStructured } from "./gemini";
import { normalizeAssistantReply, normalizeExtraction } from "./normalize";
import {
  assistantSchema,
  assistantSystem,
  FOOD_HINT,
  PRESCRIPTION_HINT,
  PRESCRIPTION_SYSTEM,
  PRESCRIPTION_USER_TEXT,
  prescriptionSchema,
} from "./prompt";
import type {
  AssistantArgs,
  AssistantReply,
  MemberContext,
  PrescriptionExtraction,
} from "./types";

/** Read a prescription photo into the structured contract. */
export async function extractPrescription(
  imageUri: string,
): Promise<PrescriptionExtraction> {
  const cached = getCachedExtraction(imageUri);
  if (cached) return cached;

  const raw = await requestStructured({
    instructions: PRESCRIPTION_SYSTEM,
    text: PRESCRIPTION_USER_TEXT,
    imageUri,
    schema: prescriptionSchema as unknown as Record<string, unknown>,
  });

  const extraction = normalizeExtraction(raw);
  cacheExtraction(imageUri, extraction);
  return extraction;
}

function contextBlock(context: MemberContext | null): string {
  if (!context) {
    return "No member context is available. Say that the guidance is general and cannot account for medicines or age.";
  }

  const lines: string[] = [];
  if (context.age !== null) lines.push(`Age: ${context.age}`);
  if (context.gender) lines.push(`Gender: ${context.gender}`);
  lines.push("Current medicines:");
  if (context.medicines.length === 0) lines.push("- None recorded");
  for (const m of context.medicines.slice(0, 12)) lines.push(`- ${m}`);

  if (context.recent_notes.length > 0) {
    lines.push("Recent visit notes:");
    for (const note of context.recent_notes.slice(0, 3)) lines.push(`- ${note}`);
  }

  return lines.join("\n");
}

/**
 * One assistant turn. Text, a food photo, or a prescription photo.
 * The photo is sent only for the current turn; history stays text-only.
 */
export async function sendToAssistant(
  args: AssistantArgs,
): Promise<AssistantReply> {
  const history = args.history
    .slice(-8)
    .filter((m) => m.text.trim().length > 0)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
    .join("\n");

  const hint =
    args.imageKind === "food"
      ? FOOD_HINT
      : args.imageKind === "prescription"
        ? PRESCRIPTION_HINT
        : "";

  const text = [
    args.text.trim() ? `User: ${args.text.trim()}` : "",
    hint,
    history ? `Recent conversation:\n${history}` : "",
    `Reply in ${args.lang === "ur" ? "Urdu" : "English"}.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const raw = await requestStructured({
    instructions: assistantSystem(contextBlock(args.context), args.lang),
    text,
    imageUri: args.imageUri,
    schema: assistantSchema as unknown as Record<string, unknown>,
  });

  const reply = normalizeAssistantReply(raw);

  // A prescription read in chat can be saved without a second API call.
  if (reply.kind === "prescription" && args.imageUri) {
    cacheExtraction(args.imageUri, reply.prescription);
  }

  return reply;
}
