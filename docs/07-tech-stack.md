# Ghar Dawae — Phase 7: Tech Stack & Architecture

_Last updated: 2026-09-26_

## Context that drove these choices
- User skillset = **React / Next.js** (strong). Flutter = learning this
  semester, NOT yet shipped → too risky to bet the product on.
- Goal B (real product) → ship with known skill, learn Flutter on the side.
- Offline-first is the core, non-negotiable requirement.
- Cloud backup **required** (data must survive phone loss).
- Market = Pakistan, mostly low/mid-end Android, spotty internet.
- Emulator pain → solved by testing on a real Android phone.

## The Stack (locked)

| Layer | Choice | Why |
|-------|--------|-----|
| **Framework** | **Expo (managed) + dev build** | Reuses React skill; no emulator (test on real phone); EAS cloud builds; avoids bare-RN native config hell |
| **Language** | TypeScript | Type safety on a relational schema |
| **Local DB** | **SQLite via PowerSync** (`@op-engineering/op-sqlite`) | Relational schema fits (Family→Member→Prescription→Medicine); offline source of truth. **Corrected in M2:** PowerSync bundles its own SQLite (op-sqlite), not expo-sqlite. |
| **Backend** | **Supabase** | Postgres (1:1 with our schema), built-in auth, file storage; free tier fine for 100 families |
| **Offline↔cloud sync** | **PowerSync + Supabase** | Purpose-built offline-first sync for Postgres; robust (hand-rolled sync is bug-prone) |
| **Photo storage** | Device filesystem (local) + **Supabase Storage** (backup) | Offline-first, cloud-backed |
| **Auth** | Supabase Auth (manager login only, v1) | Matches Model A |

## Testing / Build Workflow (no emulator)
- **Expo Go** for quick UI iteration (QR scan on real phone).
- **EAS development build** (APK on real Android phone) for anything needing
  native modules — `expo-sqlite`, PowerSync. Build in Expo's cloud, install APK.
- Emulator / Android Studio **not required**.

## Architecture (offline-first)
```
[ React Native UI (Expo) ]
          |
   [ Local SQLite ]  <-- source of truth, app always reads/writes here
          |
   [ PowerSync client ]  <-- syncs local <-> cloud in background when online
          |
   [ Supabase (Postgres + Storage + Auth) ]  <-- cloud backup / restore
```
- **App always reads/writes local SQLite** → instant, works fully offline.
- **PowerSync** pushes/pulls changes to Supabase when internet is available.
- **Photos:** saved to device filesystem first; uploaded to Supabase Storage on
  sync; local path + remote URL both tracked.
- **Offline lookup 3-tap journey never touches network** → guaranteed fast.

## Why NOT the alternatives
- **Flutter:** better offline story in theory, but user hasn't shipped it →
  slower + riskier for goal B. Revisit only if RN blocks something.
- **Bare React Native:** more native config pain, needs Android Studio; Expo
  covers everything this app needs.
- **Firebase Firestore:** offline "just works" but NoSQL fights our relational
  schema. Supabase/Postgres matches the data model cleanly.

## Open Questions Carried Forward
- **Local DB encryption** (SQLCipher / equivalent) + encrypted photos → Phase 8.
- PowerSync auth integration with Supabase Auth → detail during build.
- Cost check: Supabase + PowerSync free tiers vs 100+ families → Phase 10.
