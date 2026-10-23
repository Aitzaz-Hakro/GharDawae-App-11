# Ghar Dawae — Phase 5: AI Assistant Design (v2 — deferred)

_Last updated: 2026-09-25_

> **Status: NOT in v1.** This is a forward-looking sketch so the v1 data model
> (Phase 6) stores records in an AI-ready, structured shape. No AI is built
> until v2. Details here are provisional and will be revisited before v2.

## Why sketch it now
If AI arrives in v2, it needs **structured data** (medicines, doctors, visits
as fields — not just photos) to read a member's history. Deciding this now
means the Phase 6 schema is AI-ready and we avoid a painful migration later.

## AI's Main Job (v2)
- **Primary:** chat about a family member's medical history — answer questions
  over their stored records ("what did the doctor give Ammi last time for her
  cough?", "when was Baba's last visit?").
- **Secondary (later):** explain a prescription in simple terms; suggest general
  precautions and food/lifestyle tips based on past issues.

## Safety Rules (NON-NEGOTIABLE)
- **NEVER diagnoses.** No naming diseases as fact, no treatment prescriptions.
- **Always disclaims:** every health-related answer ends with a clear
  "consult a qualified doctor" note.
- **No emergencies:** for urgent/serious symptoms, tells user to seek immediate
  medical care, does not advise.
- **Grounded only:** answers from the family's stored records + general safe
  info — does not invent medical facts.
- Disclaimers and safety copy reviewed before v2 launch (liability).

## Online vs Offline
- **v2 AI = online (cloud model).** Requires internet. Use a capable cloud LLM
  (e.g. latest Claude) for quality + safety control.
- **Offline stays record-viewing only** (v1 core). No offline AI in v2 —
  on-device medical models are heavy and risky. Revisit far later if ever.

## Implication for Phase 6 (data model)
Store as **structured fields**, not just images:
- Medicines: name, dosage, frequency, duration.
- Visits: doctor, date, reason/diagnosis-note, notes.
- Keep photo as attachment alongside structured fields.
This lets v2 AI read history without OCR-ing images.

## Open Questions (for v2, not now)
- Which cloud LLM + cost per family.
- How to handle Urdu queries.
- Privacy: does sending records to a cloud AI need explicit user consent?
  (Almost certainly yes — Phase 8 security will note this.)
