# Hammad — Backend & AI Tasks (Hackathon)

Owner: Hammad · Last updated: 2026-10-23 · Status: UI + adapter + STT built; Gemini key pending
Source of truth for: AI service layer, contracts, assistant screen, demo cache.
Scope source of truth: `~/.commandcode/plans/hackathon-ai-prescription.md`.

> **API details are pending from the team.** The request shape lives in exactly
> one function (`requestStructured` in `src/lib/ai/gemini.ts`). Change that
> function only; every screen and helper is already wired to the typed
> `extractPrescription` / `sendToAssistant` functions.

## 1. Mission

Ship two AI surfaces on the existing Expo app:

1. Prescription scan → structured extraction → the existing record form.
2. Assistant chat → text / food photo / prescription photo → structured reply.

No model training. No DB changes. No new native modules unless STT is approved.

## 2. Owned files

```
src/lib/ai/**  ·  src/app/(main)/assistant.tsx  ·  .env.example
```

Do not touch: `RecordForm.tsx`, `record/new.tsx`, `Icon.tsx`, `i18n`,
`records.ts`, `family.ts`, `powersync/**`, `db/*.sql`, `app.json`, `eas.json`.

## 3. Current repo state (what already exists)

| File | State |
|---|---|
| `src/lib/ai/types.ts` | Frozen contract v1 |
| `src/lib/ai/cache.ts` | In-memory extraction cache |
| `src/lib/ai/demo.ts` | Offline demo replies (prescription + food + text) |
| `src/lib/ai/normalize.ts` | Defensive parsing |
| `src/lib/ai/prompt.ts` | Prompt v1 + JSON schemas |
| `src/lib/ai/gemini.ts` | **Adapter — replace the request shape here** |
| `src/lib/ai/chat.ts` | `sendToAssistant` (wired) |
| `src/lib/ai/context.ts` | `buildMemberContext` (wired) |
| `src/lib/ai/stt.ts` | Groq Whisper (default) + xAI Grok STT; endpoint verified live |
| `src/app/(main)/record/new.tsx` | Calls `extractPrescription`, shows loading/error |
| `src/components/RecordForm.tsx` | Renders the AI review UI |
| `src/app/(main)/assistant.tsx` | Chat screen + push-to-talk mic |

## 4. Frozen contract

See `src/lib/ai/types.ts`. Freeze at T+0:20. Functions you must export:

- `extractPrescription(imageUri: string): Promise<PrescriptionExtraction>`
- `sendToAssistant(args: AssistantArgs): Promise<AssistantReply>`
- `buildMemberContext(memberId: string): Promise<MemberContext | null>`
- `cacheExtraction(uri, extraction)` / `getCachedExtraction(uri)`
- `demoPrescriptionReply()` / `demoFoodReply()` / `demoTextReply()`

## 5. Gemini adapter

`src/lib/ai/gemini.ts` exports one function:

```ts
requestStructured({
  instructions,   // system prompt
  text,           // user text + recent history
  imageUri?,      // base64 inline image
  schema,         // JSON Schema from prompt.ts
}): Promise<unknown>
```

It reads:

- `EXPO_PUBLIC_GEMINI_API_KEY` (required for live calls)
- `EXPO_PUBLIC_GEMINI_MODEL` (default `gemini-2.5-flash`)
- `EXPO_PUBLIC_GEMINI_ENDPOINT` (default `https://generativelanguage.googleapis.com/v1beta/interactions`)

The current implementation follows the Interactions API shape
(`input: [text, image]`, `response_format: { type: "text", mime_type,
"application/json", schema }`). It also parses the legacy
`candidates[0].content.parts[0].text` response shape. **If the team's API
differs, change only this function.**

Restart Metro with `--clear` after editing `.env`.

## 6. Task checklist

- [ ] T+0:00 Pull latest; confirm the key and endpoint with the team
- [ ] T+0:10 Verify `requestStructured` against the real API (curl first)
- [ ] T+0:20 Freeze `types.ts`; announce any changes
- [ ] T+0:40 Prescription photo → valid `PrescriptionExtraction`
- [ ] T+1:00 Food photo → valid `FoodAnalysis`
- [ ] T+1:10 Share the signatures with the frontend
- [ ] T+1:20 **Checkpoint 1**; update this doc
- [ ] T+1:20 Wire `buildMemberContext` + `chat.ts`
- [ ] T+1:40 Polish `assistant.tsx`
- [x] T+1:50 `stt.ts` — Groq Whisper + xAI Grok; mic UI wired
- [ ] T+2:00 Error taxonomy + retry + demo fallback
- [ ] T+2:20 **Checkpoint 2**; update this doc
- [ ] T+2:20 Demo cache + `assets/demo/*` images
- [ ] T+2:45 Integration fixes with the frontend
- [ ] T+3:00 **Feature freeze**; update this doc
- [ ] T+3:10 Start the preview APK

## 7. Error taxonomy → UI behaviour

| Code | UI |
|---|---|
| `network` | "No connection. Try again." + Retry |
| `rate_limit` | "Busy right now — try in a few seconds." + Retry |
| `bad_json` | "Couldn't read that. Enter it manually." |
| `api` | "Something went wrong." + Retry |
| `not_configured` | "AI is not configured yet." |

Never throw raw model output into the UI; always normalize first.

## 8. Demo cache

`src/lib/ai/demo.ts` — prescription, food, and text replies that work with the
network off. The assistant's "Try a sample" button uses these. Add real photos
under `assets/demo/` when available.

## 9. Update protocol

1. Update this doc at every checkpoint (T+1:20, T+2:20, T+3:00).
2. Contract/endpoint/signature changes get a Change Log row in the same commit.
3. Blockers go in the Change Log; ping the team.
4. Scope changes are decided in the plan, not here.

## 10. Verification before handoff

- `npm run typecheck` and `npm run lint` pass.
- Prescription photo → JSON; food photo → JSON.
- Malformed JSON returns `bad_json`, no crash.
- Assistant works with no member context.
- Demo mode works in airplane mode.
- No key is committed.

## 11. Change Log (append-only)

| Time | Change | By |
|---|---|---|
| T+0:00 | Doc created; contract v1 + UI scaffolding in place | Team |
| T+1:40 | Contract v1, provider adapter, review UI, assistant screen, demo samples landed. `tsc`, ESLint, and the Android bundle are clean. Live API still needs a curl check against the real endpoint/key. | Team |
| T+2:10 | STT shipped: Groq Whisper default, xAI Grok alternative, push-to-talk mic in the assistant. Groq endpoint verified with a real multipart request (HTTP 200). Gemini key is still empty locally, so live extraction remains unverified. | Team |

## 12. Build note (EAS)

The app now adds **one native module**: `expo-audio` (microphone recording).
A new EAS build is required; an older dev client will crash or fail to resolve
the recording APIs. Add these to the EAS environment before the build, or the
built app will show "AI is not configured yet" / "Speech-to-text is not
configured":

```
EXPO_PUBLIC_GEMINI_API_KEY=...
EXPO_PUBLIC_GEMINI_MODEL=gemini-2.5-flash
# Optional: only if the team's endpoint differs from the default
EXPO_PUBLIC_GEMINI_ENDPOINT=...

# Speech-to-text (Groq by default)
EXPO_PUBLIC_GROQ_API_KEY=...        # or EXPO_PUBLIC_STT_API_KEY
EXPO_PUBLIC_STT_ENDPOINT=https://api.groq.com/openai/v1/audio/transcriptions
EXPO_PUBLIC_STT_MODEL=whisper-large-v3-turbo
# For xAI instead:
# EXPO_PUBLIC_STT_ENDPOINT=https://api.x.ai/v1/stt
# EXPO_PUBLIC_STT_MODEL=grok-voice-transcribe-2.0
```

Local `.env` is not used by cloud builds. `npm run preflight` warns about the
local Gemini key but does not check the AI/STT keys in EAS yet.

**Known gap:** the local `EXPO_PUBLIC_GEMINI_API_KEY` is empty. Prescription
extraction and food analysis will show "AI is not configured yet" until a key
is added. The "Try a sample" buttons still work offline.
