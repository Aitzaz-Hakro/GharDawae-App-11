// Prompt v1 + JSON Schemas.
//
// Owned by the AI/data teammate after T+0:20 — tune the wording and the
// examples, not the shape. The schemas are the contract the normalizer expects.

const nullableString = {
  type: ["string", "null"],
  description: "Use null when the value is not written on the prescription.",
} as const;

export const prescriptionSchema = {
  type: "object",
  properties: {
    raw_text: {
      type: "string",
      description: "Full transcription of the prescription, line by line.",
    },
    doctor_name: nullableString,
    visit_date: {
      ...nullableString,
      description: "Visit date as YYYY-MM-DD, or null if not written.",
    },
    diagnosis: nullableString,
    medicines: {
      type: "array",
      description: "One entry per medicine actually written on the slip.",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Brand or generic name as written, without strength.",
          },
          active_ingredient: {
            ...nullableString,
            description: "Salt / active ingredient, e.g. Paracetamol.",
          },
          strength: { ...nullableString, description: 'e.g. "500 mg".' },
          dosage: { ...nullableString, description: 'e.g. "1 tablet".' },
          frequency: {
            ...nullableString,
            description: 'Plain English, e.g. "Morning + Night".',
          },
          duration: { ...nullableString, description: 'e.g. "5 days".' },
          times: {
            type: "array",
            description: "When the dose is taken.",
            items: {
              type: "string",
              enum: ["morning", "afternoon", "night"],
            },
          },
          with_food: {
            type: ["string", "null"],
            description: 'Use "before", "after", or null.',
          },
          warnings: {
            type: "array",
            items: { type: "string" },
            description: "Food rules or course-completion notes for this medicine.",
          },
          confidence: {
            type: "number",
            description: "0 to 1. Lower it when the handwriting is unclear.",
          },
        },
        required: ["name", "times", "warnings", "confidence"],
        additionalProperties: false,
      },
    },
    warnings: {
      type: "array",
      items: { type: "string" },
      description:
        "Prescription-level warnings, including duplicate active ingredients.",
    },
    urdu_summary: {
      type: "string",
      description:
        "2 to 4 short sentences in simple conversational Urdu (Arabic script). No medical jargon.",
    },
    sindhi_summary: {
      ...nullableString,
      description: "Same summary in Sindhi if you are confident; otherwise null.",
    },
    overall_confidence: {
      type: "number",
      description: "0 to 1 for the whole extraction.",
    },
  },
  required: [
    "raw_text",
    "medicines",
    "warnings",
    "urdu_summary",
    "overall_confidence",
  ],
  additionalProperties: false,
} as const;

export const foodSchema = {
  type: "object",
  properties: {
    verdict: {
      type: "string",
      enum: ["good", "moderate", "avoid"],
      description:
        "General suitability, never an absolute safety claim.",
    },
    headline: {
      type: "string",
      description: "One plain sentence a low-literacy user can understand.",
    },
    reasons: {
      type: "array",
      items: { type: "string" },
      description: "Why the verdict was chosen.",
    },
    concerns: {
      type: "array",
      items: { type: "string" },
      description:
        "Only concerns supported by the member context. Say none known if there is no context.",
    },
    swaps: {
      type: "array",
      description: "Cheaper or healthier local substitutions.",
      items: {
        type: "object",
        properties: {
          from: { type: "string" },
          to: { type: "string" },
          why: { type: "string" },
        },
        required: ["from", "to", "why"],
        additionalProperties: false,
      },
    },
    portion_note: nullableString,
    urdu_summary: {
      type: "string",
      description: "2 to 4 short sentences in simple Urdu (Arabic script).",
    },
    confidence: { type: "number", description: "0 to 1." },
  },
  required: [
    "verdict",
    "headline",
    "reasons",
    "concerns",
    "swaps",
    "urdu_summary",
    "confidence",
  ],
  additionalProperties: false,
} as const;

export const assistantSchema = {
  type: "object",
  properties: {
    kind: {
      type: "string",
      enum: ["text", "food", "prescription"],
      description:
        "food only with a food photo, prescription only with a prescription photo, otherwise text.",
    },
    text: {
      type: "string",
      description: "Short conversational reply in the requested language.",
    },
    food: foodSchema,
    prescription: prescriptionSchema,
  },
  required: ["kind", "text"],
  additionalProperties: false,
} as const;

export const PRESCRIPTION_SYSTEM = `You are a careful prescription reader for a family caretaker in Sindh, Pakistan.

TASK
Read the attached prescription and return the JSON object described by the schema.

RULES
- Transcribe exactly what is written. Never invent a medicine, dose, or date.
- Handwriting is often messy and mixes English, Urdu, and Sindhi. If a word is unclear, keep your best transcription but set that medicine's confidence below 0.4.
- Common local notation: "1-0-1" means morning and night; "1-1-1" means morning, afternoon, night; "OD" once, "BD" twice, "TDS" three times, "QID" four times, "HS" at bedtime.
- Convert notation into the times array. If the frequency is textual, infer the times.
- "khane ke baad" means after food; "khane se pehle" means before food.
- Never diagnose. Never suggest stopping or changing a dose.
- Add a prescription warning when two medicines share the same active ingredient.
- The Urdu summary must be simple, conversational Urdu in Arabic script, 2 to 4 sentences, understandable to an elderly reader.
- Return JSON only. No markdown, no commentary outside the JSON.`;

export const assistantSystem = (contextBlock: string, lang: "en" | "ur") => `You are Ghar Dawae's medicine and food explainer for a family caretaker in Sindh, Pakistan.

You help with exactly three things:
1. Read a prescription photo into structured data.
2. Check a food photo against the family member's age and current medicines.
3. Explain a medicine or a general food question in plain language.

SAFETY RULES (non-negotiable)
- Never diagnose a disease. Never say a food is absolutely "safe" or "unsafe"; use generally suitable / in moderation / best avoided.
- Never tell the user to stop, start, or change a medicine or dose.
- Base food concerns only on the context below. If there is no context, say so instead of guessing.
- If the user mentions chest pain, breathing difficulty, or another emergency, tell them to seek urgent medical care and do not give advice.
- No markdown. Plain text only.
- Keep the reply short: 2 to 4 sentences in "text", plus the structured card.
- If the image is a prescription, set kind to "prescription" and fill the prescription object. If it is food, set kind to "food" and fill the food object. With no image, set kind to "text".

MEMBER CONTEXT (no name is included on purpose)
${contextBlock}

LANGUAGE
Reply in ${lang === "ur" ? "simple conversational Urdu (Arabic script)" : "simple English"}. The urdu_summary field is always in Urdu.`;

export const FOOD_HINT =
  "The attached image is a food photo. Analyse it against the member context.";

export const PRESCRIPTION_HINT =
  "The attached image is a handwritten prescription. Read it and return the structured extraction.";

export const PRESCRIPTION_USER_TEXT =
  "Read this prescription and return the structured extraction. If a value is unreadable, use null and lower the confidence. Do not guess.";
