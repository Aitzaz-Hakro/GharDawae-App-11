# Ghar Dawae — Phase 9: MVP Build Plan

_Last updated: 2026-09-26_

## Capacity
- **12 hours/week** (3 hrs/day × 4 days).
- **Solo dev** + Claude (this agent) as coding/planning partner.
- Constraint: user also has uni + a Flutter course this semester.

## Milestones (dependency order)

### M0 — Setup (foundation) · ~1 week (12h)
- [x] Expo (managed) + TypeScript project init
- [x] Repo structure (`/app`, `/db`, `/lib`, `/components`, `/docs` already exists)
- [x] Supabase project created (Postgres + Auth + Storage)
- [x] Schema + RLS pushed to Supabase (db/schema.sql, db/rls.sql — verified)
- [ ] EAS dev build installed on real Android phone (verify it runs)
- [ ] Expo Go working for quick iteration (blocked: "failed to download remote
      update" — likely SDK 57 vs Expo Go version / network; retry --tunnel)
- **Done when:** blank app runs on your phone, Supabase reachable.

### M1 — Auth + Family · ~1.5 weeks (18h)
- [x] Supabase signup/login (manager)
- [x] Splash → auth check → route (Home vs Login)
- [x] Create family on first login
- [x] Home = family avatar grid
- [x] Add / edit member (name, avatar preset+photo, relation, DOB/age, gender)
- **Done when:** manager logs in, adds members, sees grid.
- **Status:** code complete + type-checks; needs on-phone run to verify. Edit-member
  + photo-upload avatar deferred (add-member + preset avatars done).

### M2 — Local DB + offline core · ~2 weeks (24h) ⚠ hardest
- [ ] SQLite schema (all entities from Phase 6)
- [ ] SQLCipher encryption + key in `expo-secure-store`
- [ ] PowerSync client wired to Supabase
- [ ] Verify: offline read/write works, syncs when back online
- **Done when:** add data offline → reconnect → appears in Supabase (and reverse).
- **Note:** this is the riskiest milestone (sync + native modules + encryption).
  Budget extra buffer; expect debugging.

### M3 — Records (the heart) · ~2 weeks (24h)
- [ ] Camera-first add prescription (open camera → snap → fields)
- [ ] Structured fields: doctor_name, visit_date (default today), diagnosis, notes
- [ ] Add medicines (name, dosage, frequency, duration) — many per record
- [ ] Photo save: device filesystem + Supabase Storage on sync
- [ ] Record detail screen (photo + details)
- [ ] Member detail (medicine list + visit history)
- [ ] **Fast-entry UX**: today's date default, recent-doctor suggestions,
      medicine autocomplete from past entries, minimal required fields
- **Done when:** full add→view flow works offline, the core value is real.

### M4 — Search · ~0.5 week (6h)
- [ ] Search across members, records, medicines (local SQLite query)
- **Done when:** typing a medicine/doctor/member name finds it fast, offline.

### 🎨 Design Day (dedicated session) · after M3/M4, before M6
- Build uses **default UI** until here (system fonts, simple layout, placeholder
  colors) — don't block features on visuals.
- Then ONE dedicated session, design only: finalize colors, typography, spacing,
  avatar presets, app icon, splash, overall look/feel — on real screens with
  real data.
- Recorded in `docs/architecture.md` §5.

### M5 — Security hardening · ~1 week (12h)
- [ ] RLS policies on EVERY table (family-scoped) — verify cross-family isolation
- [ ] Private Supabase Storage bucket, scoped photo access
- [ ] Encryption verified end-to-end
- [ ] Privacy policy + signup consent + data-delete (local + cloud)
- **Done when:** a second test account cannot see the first family's data.

### M6 — Polish + test · ~1 week (12h)
- [ ] **Offline 3-tap journey** tested on real phone in airplane mode
- [ ] Empty states, error handling, loading states
- [ ] Low-end Android test (Pakistan target device)
- **Done when:** app feels solid, offline lookup is instant.

### M7 — Launch prep → **Phase 10**

## Rough Timeline
- **Sum ≈ 9 weeks** of focused work (108h) — realistically **~10–12 weeks**
  with uni load, debugging, and the M2 sync risk.
- Target MVP-ready: **late Nov / early Dec 2026** (from 2026-09-26 start).

## Critical Risks
1. **M2 sync (PowerSync + SQLCipher + Expo native build)** — highest risk.
   If it stalls >2 weeks, fallback = ship phone-only local SQLite first, add
   cloud sync right after (schema already supports it).
2. **Fast manual entry (M3)** — OCR is cut, so this UX IS the product. If typing
   is slow, users churn. Prototype it early, test with a real family member.
3. **Scope creep** — v2 features (AI, reminders) must stay OUT of v1.

## How We Work (solo + agent)
- Build **milestone by milestone**, not all at once.
- Each session: pick next unchecked task, I write/guide code, you test on phone.
- Update this doc's checkboxes as we go (living plan).
- When M2 gets scary, we slow down and verify sync in isolation before UI.

## Open Questions Carried Forward
- Monetization (any charges → who pays = manager) → **Phase 10**.
- Beta testers: which real families test first? → Phase 10.
