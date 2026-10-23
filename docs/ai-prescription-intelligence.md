# Ghar Dawae — ParchiiAI Prescription Intelligence

_Document Version: 1.0.0 — Hackathon Engineering Release_  
_Target Model: Google Gemini 2.5 Flash Vision (`gemini-2.5-flash`)_  
_Branch: `feat/ai-prescription-intelligence`_

---

## 1. Feature Purpose and Scope

**Ghar Dawae / ParchiiAI** is an AI-powered prescription-reading and caregiver-assistance feature embedded natively into the Ghar Dawae mobile healthcare application.

In Pakistan, medical prescriptions ("parchii") and medicine packages present steep comprehension challenges for family caretakers:
- Ambiguous or rushed physician handwriting.
- Non-standard dosage notation (e.g. `1+0+1`, `TDS`, `BD`, `SOS`, `نہار منہ`).
- Unfamiliar commercial brand names vs generic active ingredients (e.g. *Augmentin* vs *Amoxicillin/Clavulanate*).
- Multilingual barrier: English medical slips given to Urdu and Sindhi-speaking caretakers without clear explanations.

### Scope
- **Vision Understanding:** Ingest captured prescription slips and medicine strips directly from the app's camera and gallery.
- **Structured Clinical Extraction:** Parse doctor name, visit date, tentative diagnosis/symptoms, and a structured array of medicines (brand name, normalized trade name, active generic formulation, strength, dosage, frequency, treatment duration, and meal timing).
- **Uncertainty & Safety Invariants:** Explicitly detect unreadable scribbles, blurry packaging, or ambiguous dosages; flag them with `needs_pharmacist_confirmation: true` and `confidence: "low"`.
- **Multilingual Patient Explanations:** Produce simple, actionable instructions for caretakers in **Urdu (اردو)**, **Sindhi (سنڌي)**, and **English**.
- **Interactive Review & Draft Flow:** Allow caretakers to preview, switch language, inspect warnings, and apply extracted medicines into the existing record form without destructive overwrites or automated database writes.

---

## 2. Architecture and Data Flow

```
[ Prescription Slip / Medicine Package ]
                   │
                   ▼ (1. Capture / Select)
   [ expo-camera / expo-image-picker ]
                   │
                   ▼ (2. Image URI)
   [ src/lib/ai/service.ts ]
          │ ──> Read image as Base64 (expo-file-system)
          │ ──> Prepare multimodal payload & clinical safety prompt
                   │
                   ▼ (3. HTTP POST with timeout / fallback)
   [ Google Gemini 2.5 Flash Vision API ]
   (https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent)
                   │
                   ▼ (4. Raw JSON Response)
   [ src/lib/ai/validator.ts ]
          │ ──> Sanitize nulls, types, strings
          │ ──> Enforce clinical safety invariants
          │ ──> Compute pharmacist confirmation & human review flags
                   │
                   ▼ (5. Display-Ready Object)
   [ src/components/AIPrescriptionReview.tsx ]
          │ ──> Urdu / Sindhi / English explanation cards
          │ ──> Confidence pills & pharmacist verification alerts
          │ ──> Unreadable sections & medical disclaimers
                   │
                   ▼ (6. User Review & "Accept & Apply")
   [ src/components/RecordForm.tsx ]
          │ ──> Populates draft fields without overwriting user edits
                   │
                   ▼ (7. Local-First Atomic Save)
   [ PowerSync / SQLite (SQLCipher) ] ──> Supabase Sync
```

---

## 3. Model and Provider Specifications

ParchiiAI supports **dual vision providers** with automatic key detection:

### A. OpenAI Vision (Supported & Recommended for OpenAI Key Holders)
- **Primary Model:** `gpt-4o-mini` (fast, cost-effective multimodal vision).
- **Fallback Model:** `gpt-4o` (flagship vision understanding).
- **Endpoint:** `https://api.openai.com/v1/chat/completions` with `response_format: { type: "json_object" }`.
- **Environment Key:** `EXPO_PUBLIC_OPENAI_API_KEY`.

### B. Google Gemini Vision
- **Primary Model:** `gemini-2.5-flash` (Gemini 2.5 Flash Vision).
- **Fallback Model:** `gemini-1.5-flash`.
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`.
- **Environment Key:** `EXPO_PUBLIC_GEMINI_API_KEY`.

- **Protocol:** Direct REST POST via native `fetch` with AbortController timeout (35s). Requires zero external SDK dependencies.

---

## 4. Request Format and Response Schema

### Request Payload
```json
{
  "contents": [
    {
      "parts": [
        {
          "inlineData": {
            "mimeType": "image/jpeg",
            "data": "<base64_encoded_image>"
          }
        },
        {
          "text": "<ParchiiAI system prompt with strict clinical safety instructions>"
        }
      ]
    }
  ],
  "generationConfig": {
    "responseMimeType": "application/json",
    "temperature": 0.1
  }
}
```

### Response Schema Contract (`PrescriptionExtractionResult`)
```typescript
export interface PrescriptionExtractionResult {
  language: "ur" | "sd" | "en";
  extraction_status: "complete" | "partial" | "failed";
  doctor_name: string | null;
  visit_date: string | null; // YYYY-MM-DD
  diagnosis_or_symptoms: string | null;
  medicines: Array<{
    name_as_written: string | null;
    normalized_name: string | null;
    active_ingredient: string | null;
    strength: string | null;
    dosage_as_written: string | null;
    frequency_as_written: string | null;
    duration_as_written: string | null;
    meal_instruction_as_written: string | null;
    purpose: string | null;
    confidence: "high" | "medium" | "low";
    uncertain_fields: string[];
    needs_pharmacist_confirmation: boolean;
    explanation_ur?: string | null;
    explanation_sd?: string | null;
    explanation_en?: string | null;
  }>;
  unreadable_text: string[];
  general_warnings: string[];
  requires_human_review: boolean;
  summary_explanation?: string;
  disclaimer: string;
}
```

---

## 5. Relevant Source Files

| File | Purpose |
| :--- | :--- |
| `src/lib/ai/types.ts` | Type definitions, enums, error codes, and extraction contracts. |
| `src/lib/ai/config.ts` | Model configurations, endpoints, timeouts, and API key security helpers. |
| `src/lib/ai/prompt.ts` | System prompt with medical safety rules, Pakistani context, and JSON schema. |
| `src/lib/ai/validator.ts` | Runtime validation, sanitization of missing values, and human review flags. |
| `src/lib/ai/service.ts` | Base64 file preparation, Gemini API request, retry/timeout logic, error creation. |
| `src/components/AIPrescriptionReview.tsx` | Interactive UI review modal with language selector (Urdu/Sindhi/English). |
| `src/components/RecordForm.tsx` | Integrated "Analyze with ParchiiAI" action, draft population without overwriting. |
| `src/app/(main)/record/[id].tsx` | Integrated "ParchiiAI Assistant & Instructions" for existing prescriptions with photos. |
| `scripts/test-ai-service.mjs` | Automated 10-scenario test runner verifying mock and runtime behavior. |

---

## 6. Environment-Variable Configuration

Variables in `.env` (configured via `.env.example`):

```bash
# Provide either your OpenAI key OR your Google Gemini key:
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
# Or:
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...

# Optional: Serverless backend proxy URL for production deployments
# EXPO_PUBLIC_AI_PROXY_URL=https://your-backend.com/api/parchiiai
```

---

## 7. Local Setup and Execution

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Add your EXPO_PUBLIC_GEMINI_API_KEY into .env
   ```
3. **Run AI unit and contract tests:**
   ```bash
   npm run test:ai
   # or: node scripts/test-ai-service.mjs
   ```
4. **Launch development server:**
   ```bash
   npx expo start
   ```

---

## 8. Image Privacy and API-Key Security

> [!WARNING]
> **Client-Side Secret Storage Warning:**  
> Environment variables prefixed with `EXPO_PUBLIC_` are bundled directly into the compiled JavaScript application assets and are **technically extractable** from production `.apk` / `.aab` bundles. Compiling a key into an APK does not make it secure.

### Security Architecture & Precautions
1. **Never Commit Secrets:** `.env` is tracked in `.gitignore` and verified by `scripts/preflight.mjs`. No credentials or service-role keys are committed.
2. **Production Proxy Ready:** The architecture includes `EXPO_PUBLIC_AI_PROXY_URL`. In production releases, mobile clients point to a serverless backend proxy (e.g. Cloudflare Worker or Supabase Edge Function) which appends the Gemini API key securely on the server.
3. **Restricted Keys:** Hackathon and client keys must be restricted via Google Cloud Console to only the Generative Language API and rate-limited.
4. **Zero Logging of Sensitive Data:** The AI pipeline never logs base64 images, patient names, medical conditions, or API keys to the console or telemetry.
5. **Local-First Retention:** Photos remain stored locally on disk (`Paths.document/photos/{id}.jpg`) with SQLite metadata encrypted via SQLCipher.

---

## 9. Error Handling and Fallback Behavior

The service provides graceful degradation across all failure modes:

| Failure Mode | Internal Code | User Experience & Multilingual Fallback |
| :--- | :--- | :--- |
| Missing API Key | `MISSING_API_KEY` | Shows helpful alert in Urdu/Sindhi/English advising caretaker to configure key in settings. |
| Offline / Network Drop | `NETWORK_ERROR` | Informs caretaker of connection loss; manual prescription typing remains 100% functional. |
| Timeout (> 35s) | `TIMEOUT` | Suggests retaking photo under better lighting; aborts cleanly without UI freeze. |
| Quota Exceeded (429) | `RATE_LIMIT` | Informs caretaker to retry in 60 seconds; preserves captured photo and manual edits. |
| Model 404 / 503 | Auto-Fallback | Transparently retries with `gemini-1.5-flash` before raising an error. |
| Corrupt / Blurry Image | `INVALID_IMAGE` / `failed` | Highlights illegibility and opens camera/gallery picker to retake. |
| Malformed JSON | `MALFORMED_RESPONSE` | Safely caught by JSON parser; falls back to manual entry with clear warning banner. |

---

## 10. Medical Safety Boundaries

> [!CAUTION]
> **ParchiiAI is an extraction and comprehension aid, not a diagnostic or prescribing system.**

1. **No Autonomous Prescribing:** ParchiiAI never calculates, adjusts, or recommends dosages.
2. **Preserve Handwritten Ambiguity:** If handwriting cannot be deciphered with high certainty, the field is set to `null`, `confidence` is marked `"low"`, and `needs_pharmacist_confirmation` is set to `true`.
3. **No Phantom Normalization:** Trade names are only normalized if unambiguously supported by the visual evidence.
4. **Informational Indications Only:** Generated `purpose` descriptions are strictly informational common usages (e.g., "بخار اور درد کے لیے / Pain & fever") and are never presented as a doctor's confirmed diagnosis.
5. **Mandatory Disclaimers:** Every output and review surface prominently displays the regulatory disclaimer advising verification with a licensed physician or pharmacist.

---

## 11. Test Cases and Actual Results

Automated test suite executed via `scripts/test-ai-service.mjs`:

```
============================================================
  ParchiiAI Prescription Intelligence — Automated Test Suite
============================================================

  [PASS] Test 1: Clear prescription with multiple readable fields
  [PASS] Test 2: Blurry or handwritten prescription
  [PASS] Test 3: Medicine strip with uncertain product name or strength
  [PASS] Test 4: Image with no readable prescription text
  [PASS] Test 5: Malformed or unexpected API response
  [PASS] Test 6: Missing API key or configuration
  [PASS] Test 7: Network failure, timeout, or rate-limit response
  [PASS] Test 8: Invalid image input
  [PASS] Test 9: Valid result containing missing fields
  [PASS] Test 10: Regression checks for manual entry and offline data structures

============================================================
  Test Suite Summary: 10 passed, 0 failed
============================================================
```

---

## 12. Known Limitations and Future Work

### Limitations
1. **Direct Mobile Client Calls (Hackathon Mode):** Direct client calls to Google AI require an API key in client configuration, requiring APK-level obfuscation or proxy deployment for production.
2. **Extremely Degraded Slips:** Physically torn or heavily water-damaged slips will trigger `"extraction_status": "failed"` requiring complete manual transcription.
3. **Offline AI:** Vision model inference requires an active internet connection. (Offline browsing of previously saved records remains fully functional via SQLite/SQLCipher).

### Future Work
- **Serverless Edge Proxy:** Deploy a Supabase Edge Function with rate limiting and IP throttling to proxy Gemini requests.
- **Audio Output:** Text-to-speech reading of Urdu and Sindhi instructions for elderly or low-literacy family caretakers.
- **Drug-Drug Interaction Screen:** Local offline checking against a verified DRAP formulary database before saving.

---

## 13. Fix Pass — 2026-10-23

- **Multilingual output:** the prompt now asks for `explanation_ur`, `explanation_sd`, and `explanation_en` for every medicine, plus `summary_explanation_ur/sd/en`. The language chips are populated in one call.
- **Remote photos:** saved records whose photo exists only as a signed Supabase URL are downloaded to the cache and base64-encoded before the vision call.
- **Gemini part order:** the text prompt now precedes the image, matching Google's recommendation.
- **Record detail CTA:** the button says "Done" because that screen does not apply results to a saved record.
- **Error taxonomy:** HTTP 401/403 now returns `INVALID_API_KEY` with an actionable message instead of a generic error.
- **Tooling:** `npm run lint` uses `eslint src`; `expo lint` hangs in this environment.
- **Testing caveat:** `npm run test:ai` exercises the validator/config logic with local fixtures and does not call a provider. A live key test is still required (see §7).
