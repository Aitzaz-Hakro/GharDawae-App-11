# Ghar Dawae 🏠💊

> **The family caretaker's medicine app** — manage your whole family's medicine
> records and prescriptions, available even offline.

Ghar Dawae ("home medicine" in Urdu) lets one family manager keep every
member's prescriptions, medicines, and doctor-visit history in one place —
fast to add, always available offline, backed up to the cloud.

---

## Status
**Planning complete (Phases 1-10).** Next step: begin build at **M0** (see
`docs/09-mvp-plan.md`). Planning done 2026-09-26.

## The One-Liner
Ghar Dawae is an app that manages your family's medicine records for you —
available even offline.

## Who It's For
- **The Manager** — adds/organizes records for the whole family.
- **The Caretaker** — needs fast, offline access to a sick/elderly member's meds.
(Often the same person.)

## The Wedge
The simplest **family-caretaker** medicine app: offline, fast, no clutter.
Incumbents (oladoc, Marham, MyHealth Rex) are booking-first or individual-account;
none own the family-caretaker use case.

---

## MVP Scope (v1)
- Signup / login (manager)
- Add family members (avatar, relation, age)
- Add prescription: **photo + fast manual entry** (OCR deliberately cut)
- Medicine list + doctor/visit history per member
- **Offline view of everything** (core differentiator — 3-tap lookup)
- Search
- Cloud backup + sync

**Not in v1:** AI assistant (v2), reminders (v2), doctor recommendation (later),
OCR (cut), biometric unlock (v2), iOS (Android-first).

## Tech Stack
| Layer | Choice |
|-------|--------|
| Framework | Expo (managed React Native) + TypeScript |
| Local DB | SQLite (`expo-sqlite`) + SQLCipher encryption |
| Backend | Supabase (Postgres + Auth + Storage) |
| Sync | PowerSync + Supabase (offline-first) |
| Testing | Real Android phone via Expo Go + EAS dev build (no emulator) |

## Architecture (offline-first)
```
[ Expo RN UI ] → [ Local SQLite (encrypted) ] ⇄ [ PowerSync ] ⇄ [ Supabase cloud ]
```
App always reads/writes local SQLite (instant, offline). PowerSync syncs to
cloud when online. The 3-tap offline lookup never touches network.

## Success
**100 families actively using = success.** More = more.

---

## Planning Docs (read in order)
1. [`docs/01-vision.md`](docs/01-vision.md) — problem, pitch, scope guards
2. [`docs/02-market.md`](docs/02-market.md) — Pakistan, personas, competitors, wedge
3. [`docs/03-features.md`](docs/03-features.md) — feature set, MVP line
4. [`docs/04-flows.md`](docs/04-flows.md) — screens, journeys, 3-tap offline
5. [`docs/05-ai-assistant.md`](docs/05-ai-assistant.md) — v2 AI sketch + safety
6. [`docs/06-data-model.md`](docs/06-data-model.md) — entities + schema
7. [`docs/07-tech-stack.md`](docs/07-tech-stack.md) — stack + architecture
8. [`docs/08-security.md`](docs/08-security.md) — encryption, RLS, privacy
9. [`docs/09-mvp-plan.md`](docs/09-mvp-plan.md) — milestones M0-M7, timeline
10. [`docs/10-launch.md`](docs/10-launch.md) — beta, Play Store, growth

## Build Roadmap (from Phase 9)
- **M0** Setup · **M1** Auth+Family · **M2** Local DB+Sync ⚠hardest ·
  **M3** Records (the heart) · **M4** Search · **M5** Security hardening ·
  **M6** Polish+test · **M7** Launch
- Capacity: 12h/week (3h × 4 days), solo + agent.
- Target MVP: **late Nov / early Dec 2026**.

## Top Risks
1. **M2 sync** (PowerSync + SQLCipher + native build) — hardest. Fallback:
   ship phone-only local first, add sync after (schema supports it).
2. **Fast manual entry** — OCR cut, so entry speed IS the product. Prototype early.
3. **Scope creep** — keep v2 features out of v1.
