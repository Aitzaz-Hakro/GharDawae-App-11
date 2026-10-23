# Ghar Dawae — Phase 4: User Flows & UX

_Last updated: 2026-09-25_

## Screens (v1) — confirmed
1. **Splash / auth check** — logged in? → Home. Else → Login.
2. **Login / Signup**
3. **Home = family list** — avatar grid of members + "Add member" button.
4. **Add / Edit member** — name, avatar, relation, age.
5. **Member detail** — that person's medicine list + visit/doctor history +
   "Add record" button.
6. **Add prescription/record** — **camera opens first** (photo), then fields
   (doctor, date, medicines, notes).
7. **Record detail** — one prescription full (photo + details).
8. **Search** — across all members/records.
9. **Settings** — account, manage family, logout.

## Key Decisions
- **Add-prescription = camera-first.** Tap "Add record" → camera opens
  immediately → snap photo → then fill fields. (Photo is the anchor; typing
  follows.)
- **Home → member tap = straight to their records** (no summary card between).
  Fewer taps, faster.

## Journey 1 — Add a prescription
Member detail → tap "Add record" → **camera opens** → snap slip → confirm →
fill fields (doctor, date, medicines, notes) → save → back to member detail.

## Journey 2 — Offline lookup (THE core journey) — 3 taps
> Outside, no internet, need mother's medicine.

1. **Tap** — open app (already logged in → Home shows family avatars).
2. **Tap** — mother's avatar → her records/medicine list.
3. **Tap** — the medicine / prescription → see full detail + photo.

**3 taps, fully offline.** This is the flow to optimize above all else.
Non-negotiable: app opens straight to family grid when already logged in
(no re-login, no loading gate that blocks offline).

## Journey 3 — Add a family member
Home → "Add member" → enter name/relation/age, pick avatar → save →
back to Home grid.

## UX Principles (from wedge)
- **Offline-first everywhere** — no screen may hard-block on network.
- **Fast manual entry** — since OCR is cut, the add-fields form must be quick:
  smart defaults (today's date), recent doctors list, medicine autocomplete
  from past entries, minimal required fields.
- **Simple > feature-rich** — big competitors are cluttered; stay lean and
  elderly/caretaker-friendly.

## Open Questions Carried Forward
- Exact prescription fields + which are required (Phase 6 data model).
- Avatar source: preset icons vs photo upload (Phase 6).
- Do we need an "all family medicines" combined view? (Deferred — revisit if
  users ask; not v1.)
