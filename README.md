# Ghar Dawae 🏠💊

> **The family caretaker's medicine app** — manage your whole family's medicine
> records and prescriptions, available even offline.

Ghar Dawae ("home medicine" in Urdu) lets one family manager keep every
member's prescriptions, medicines, and doctor-visit history in one place —
fast to add, always available offline, backed up to the cloud.

---

## Status (as of 2026-10-23)

**v1 feature set is built through M7 (launch prep).** The app runs on a real
Android device via an EAS development build. It has **not** been submitted to
the Play Store yet.

| Area | State |
|---|---|
| Auth (manager only) | Done |
| Family members (add / edit / delete) | Done |
| Prescriptions: camera + fast manual entry | Done |
| Visit history, record detail | Done |
| Offline search (members / records / medicines) | Done |
| Encrypted local DB + PowerSync cloud sync | Done |
| Photo backup to Supabase Storage | Done |
| Privacy screen, signup consent, delete-all-data | Done |
| Launch pack + preflight checks | Done (`docs/m7-launch-pack.md`) |
| On-device QA pass, Play submission | Pending |

> The top-level `docs/` files were written as a planning series (phases 1–10)
> before the build started. They are still the source of intent, but
> `docs/architecture.md` is the **living build log** and reflects what actually
> shipped. When the two disagree, the code (and architecture.md) wins.

---

## The Idea in 30 Seconds

- **One account, many people.** Only the manager logs in. Family members are
  data rows (`members`), never accounts. This is "Model A" in the docs.
- **Offline is the product.** The 3-tap lookup of a sick member's medicines
  must work in airplane mode. Network is never on the critical path.
- **Entry speed is the feature.** OCR was deliberately cut; adding a
  prescription must be fast by hand. Recent-doctor chips and medicine
  autocomplete exist for that reason.
- **Photo optional, medicines required-ish.** A record is valid with a photo
  OR at least one medicine.

**MVP scope:** signup/login, family members, prescription photo + manual entry,
medicine list, visit history, offline search, cloud backup + sync.

**Out of v1:** reminders, AI assistant, OCR, doctor directory, biometrics, iOS,
web, OTA updates.

---

## Architecture (offline-first)

```
[ Expo React Native UI ]
        │  reads/writes always local, instant
        ▼
[ Local SQLite — SQLCipher encrypted ]   ← source of truth
        │  background push/pull when online
        ▼
[ PowerSync client ]
        │
        ▼
[ Supabase: Postgres · Auth · Storage ]  ← cloud backup
```

**Golden rule: the UI never waits on the network.** Screens query local SQLite.
PowerSync replays local writes to Supabase and pulls remote changes back down.
Supabase is only touched directly for auth, photo upload/signing, and
account deletion.

**Photo handling is two-layer on purpose:**

- `prescriptions.photo_path` — local file name in the device documents dir
- `prescriptions.photo_url` — object key in the private `prescription-photos` bucket

`usePhotoSource()` prefers the local file and falls back to a signed URL, which
is what makes a reinstall or a second device work.

---

## Tech Stack (as actually installed)

| Layer | Choice |
|---|---|
| Framework | Expo **SDK 57** (managed), React Native 0.86.3, React 19.2.3 |
| Language | TypeScript **strict**, path alias `@/* → src/*` |
| Routing | expo-router (file-based, typed routes) |
| Local DB | **`@op-engineering/op-sqlite` via PowerSync**, SQLCipher encryption |
| Encryption key | `expo-secure-store` (256-bit, generated once with `expo-crypto`) |
| Cloud | Supabase (Postgres + Auth + Storage) |
| Sync | PowerSync (`@powersync/react-native`), family-scoped sync rules |
| UI system | Custom "Warm Cabinet" tokens; `react-native-svg`; no UI kit |
| State | React context for auth only; everything else is local `useState` + re-query on focus. **No Redux/Zustand/React Query.** |
| Build | EAS Build (dev / preview / production profiles) |
| Target | Android-first (`com.ghardawae.app`), iOS deferred |

> Note: older docs say `expo-sqlite`. That is stale — the shipped stack is
> `op-sqlite` bundled with PowerSync, which is what enables SQLCipher.

---

## Repository Map

```
GharDawae App/
├── src/
│   ├── app/                     # Expo Router routes — every file is a screen
│   │   ├── _layout.tsx          # fonts, nav theme, auth gate, sync lifecycle
│   │   ├── (auth)/              # login, signup
│   │   └── (main)/              # home, search, member/*, record/*, settings/*
│   ├── components/              # Avatar, Icon, Cabinet blocks, SyncBanner,
│   │                            # RecordForm, CameraCapture
│   ├── constants/               # theme tokens, color hook, avatars, privacy copy
│   └── lib/
│       ├── auth.ts / auth-context.tsx / supabase.ts
│       ├── family.ts            # members data access (SQL)
│       ├── records.ts           # prescriptions + medicines data access (SQL)
│       ├── search.ts            # offline 3-way search
│       ├── photo.ts             # device filesystem
│       ├── photo-sync.ts        # Supabase Storage backup + signed URLs
│       ├── account.ts           # full cloud + local erase
│       ├── powersync/           # db singleton, schema, key, connector, sync hook
│       └── uuid.ts              # offline id minting
├── db/                          # Supabase SQL — run manually in SQL Editor
│   ├── schema.sql               # tables + indexes
│   ├── rls.sql                  # row-level security (family-scoped)
│   └── storage.sql              # private photo bucket policies
├── docs/                        # planning series + living build log
├── scripts/                     # preflight, asset generation, template reset
├── assets/                      # fonts, DiceBear avatars, icons, images
├── android/                     # generated by prebuild — gitignored, do not edit
└── app.json / eas.json / tsconfig.json / eslint.config.js
```

**Screens (12):** login, signup, home family grid, search, member detail,
member new, member edit, record detail, record new, camera, settings, privacy.

---

## How Data Flows

**Writing a prescription**

```
record/camera → RecordForm
  → savePhoto(uri, recordId)              documents/photos/<id>.jpg
  → addPrescription()                     one SQLite transaction:
                                          prescriptions + medicines
  → PowerSync upload queue                upsert into Supabase
  → syncPendingPhotos() every 60s         upload to Storage, set photo_url
```

**Reading**

```
home:            resolveFamily → listMembers + prescriptionCounts   (2 queries)
member detail:   prescriptions ORDER BY visit_date DESC
                 → loadMedicinesFor(ids)                            (1 query, no N+1)
search:          resolveFamily → 3 LIKE queries → SearchHit[]
record detail:   getPrescription + listMedicines + usePhotoSource
```

Screens re-query on focus (`useFocusEffect`), which is how a newly added
member or record appears elsewhere without a global store.

### Data Model (4 tables)

```
auth.users (manager) 1──n families 1──n members 1──n prescriptions 1──n medicines
```

- `families` — `id`, `name`, `manager_user_id`, `created_at`
- `members` — `family_id`, `name`, `avatar_type` (`preset`|`photo`),
  `avatar_value`, `relation`, `date_of_birth`, `age`, `gender`
- `prescriptions` — `member_id`, `photo_path`, `photo_url`, `doctor_name`,
  `visit_date`, `diagnosis_note`, `notes`
- `medicines` — `prescription_id`, `name`, `dosage`, `frequency`, `duration`

Security: RLS on every table, with `security definer` helpers
(`owns_family`, `owns_member`, `owns_prescription`) that walk up to
`families.manager_user_id = auth.uid()`. The storage bucket is private; object
keys are `<family_id>/<record_id>.<ext>` so policies can scope by folder.

---

## Setup

**Prerequisites:** Node 20+, a real Android phone, Expo Go (UI-only) and/or an
EAS development build (required for anything native: SQLite, camera, secure
store). No emulator needed per project docs.

```bash
npm install
cp .env.example .env        # then fill in real values
npx expo start              # Metro (UI-only work in Expo Go)
npx expo run:android        # local native build
# or: npx eas-cli@latest build --profile development --platform android
```

**Environment variables** (all three required — `src/lib/supabase.ts` throws if
the first two are missing):

| Variable | Where it comes from |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API (public by design; RLS is the boundary) |
| `EXPO_PUBLIC_POWERSYNC_URL` | PowerSync dashboard → Connect → instance URL |

Cloud setup, in order:

1. Run `db/schema.sql`, then `db/rls.sql` in the Supabase SQL Editor.
2. Run `db/storage.sql` and create the private `prescription-photos` bucket.
3. Create a PowerSync instance + dedicated Postgres role, deploy the rules in
   `docs/m2-powersync-sync-rules.yaml`.
4. Put `EXPO_PUBLIC_*` vars into the **EAS production environment** too — local
   `.env` is not used by cloud builds.

Never commit `.env`. Never prefix the service-role key with `EXPO_PUBLIC_`.

Full walkthroughs: `docs/m2-powersync-setup.md`, `docs/m3-photo-storage-setup.md`.

---

## Commands

| Command | What it does |
|---|---|
| `npm start` | Metro dev server (`expo start`) |
| `npm run android` | Local native build + install (`expo run:android`) |
| `npm run ios` | Same for iOS (deferred, no iOS config exists) |
| `npm run web` | Web dev server — partial support only |
| `npm run lint` | `eslint src` (ESLint 9 flat config) |
| `npm run typecheck` | `tsc --noEmit`, strict |
| `npm run preflight` | Pre-launch gate: env vars, EAS cloud env, secret leaks, build profiles, typecheck + lint |
| `npm run reset-project` | ⚠️ Stock template script. Deletes `src/` and `scripts/`. **Do not run.** |

Install dependencies with `npx expo install <pkg>` — never `npm install <pkg>` —
so versions match SDK 57.

There is **no CI, no test runner, and no formatter**. The quality gates are
`typecheck` + `lint` + `preflight`, plus manual on-device checks in
`docs/m7-launch-pack.md` §8.

---

## Conventions (read before contributing)

1. **Offline first.** All domain reads/writes go to local SQLite. Never query
   Supabase directly for family/member/record data — that is PowerSync's job.
2. **Data access lives in `src/lib/`.** Screens do not write SQL inline; they
   call `family.ts`, `records.ts`, `search.ts`.
3. **Multi-row writes are transactional.** Use `db.writeTransaction` (e.g.
   prescription + medicines, cascading member deletes).
4. **The schema lives in three places** — `db/schema.sql` (cloud),
   `src/lib/powersync/schema.ts` (local), and the TS types in
   `family.ts` / `records.ts`. Change all three together; there is no codegen.
5. **IDs are minted client-side** (`src/lib/uuid.ts`) so rows can be created
   offline before Postgres ever sees them.
6. **Styling pattern:** `const c = useColors()` then
   `useMemo(() => makeStyles(c), [c])`. Tokens come from `constants/theme.ts`.
   No NativeWind, no styled-components.
7. **Fonts:** each weight is its own loaded family (`Fonts.headingBold`, etc.).
   Do not set `fontWeight` — Android synthesises a double-bold.
8. **Accessibility is systematic:** give every `Pressable` a role, label, and
   state; mark decorative icons as hidden from assistive tech.
9. **Comments explain *why*.** The codebase deliberately cites design docs by
   number; keep that style for non-obvious decisions.
10. **Before calling a task done:** `npm run typecheck` and `npm run lint` must
    pass, and the app must still work with the network off.

---

## Known Gaps / Next Work

- **Prescriptions cannot be edited in the UI.** `updatePrescription()` exists
  in `records.ts` but no screen calls it (only delete is wired).
- **Member photo avatars** are supported by schema, RLS, and `Avatar.tsx`, but
  both member forms hard-code `avatar_type: "preset"`.
- **`date_of_birth`** exists in SQL but forms only capture `age`.
- **`member/new.tsx` and `member/[id]/edit.tsx` are ~90% duplicated** — no
  shared `MemberForm` yet.
- **No `updated_at` or soft delete**; sync conflicts are last-write-wins.
- **No automated tests or CI.**
- **Dead scaffolding:** `src/db/` is empty, `src/global.css` is unused,
  `@expo/ui`, `expo-symbols`, `expo-glass-effect`, reanimated and gesture-handler
  are installed but not imported yet.
- **`android/` is generated** (CNG) and gitignored. Never edit it by hand —
  change `app.json` or a config plugin instead. The release build type in
  Gradle still points at the debug keystore; real signing happens in EAS.

---

## Docs Index

**Read these first**

| File | What it covers |
|---|---|
| `AGENTS.md` | Repo rules for AI agents and contributors (Expo SDK 57 policy, commands) |
| `docs/architecture.md` | **Living** architecture + per-feature build log (most accurate) |
| `docs/design-system.md` | "Warm Cabinet" design system — colour, type, spacing, motion |

**Product intent (planning series, written before the build)**

| File | What it covers |
|---|---|
| `01-vision.md` | Problem, pitch, scope guards |
| `02-market.md` | Pakistan market, personas, competitors, wedge |
| `03-features.md` | Feature set and MVP line |
| `04-flows.md` | Screens, journeys, 3-tap offline lookup |
| `05-ai-assistant.md` | v2 AI sketch + safety rules |
| `06-data-model.md` | Entities and relationships |
| `07-tech-stack.md` | Stack rationale |
| `08-security.md` | Encryption, RLS, privacy/legal |
| `09-mvp-plan.md` | Milestones M0–M7 |
| `10-launch.md` | Beta, Play Store, growth |

**Operational / launch**

| File | What it covers |
|---|---|
| `m2-powersync-setup.md` | PowerSync ↔ Supabase setup step by step |
| `m2-powersync-sync-rules.yaml` | The sync rules to deploy |
| `m3-photo-storage-setup.md` | Storage bucket + policies |
| `m7-launch-pack.md` | Play Console, Data Safety, store listing, device QA checklist |
| `privacy-policy.md` | Hosted privacy policy |
| `LEARNING.md` | Running log of concepts learned, with status markers |

---

## For AI Agents Working in This Repo

1. **Read `AGENTS.md`.** It is short and overrides assumptions.
2. **Expo SDK 57 — do not trust training data.** Check the `expo` version in
   `package.json`, then read
   `https://docs.expo.dev/versions/v57.0.0/` and `https://docs.expo.dev/llms.txt`
   before using an Expo/EAS/RN API.
3. **Where things live:** routes in `src/app/`, reusable UI in
   `src/components/`, SQL data access in `src/lib/*.ts`, DB/sync plumbing in
   `src/lib/powersync/`.
4. **Invariants you must not break:** local-first reads/writes, SQLCipher
   encryption, family-scoped RLS, photos stored as filename + object key,
   client-minted UUIDs.
5. **Do not:** query Supabase for domain data, add `expo-sqlite`, edit
   `android/`, run `reset-project`, commit `.env`, or add a state library
   without a clear reason.
6. **Verify with** `npm run typecheck`, `npm run lint`, and (before a build)
   `npm run preflight`.

---

## Success

**100 families actively using = success.** More = more.

## License

See `LICENSE`.
