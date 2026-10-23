# Ghar Dawae — Architecture & Feature Build Log

_Living document. Records HOW the app is structured and HOW each feature is
built. Updated as we build — every milestone/feature adds its section here._

_Last updated: 2026-09-26_

---

## 1. High-Level Architecture (offline-first)
```
┌──────────────────────────────────────────────┐
│              Expo React Native (UI)            │
│  screens · components · navigation · forms     │
└───────────────────┬────────────────────────────┘
                    │ read/write (always local, instant)
┌───────────────────▼────────────────────────────┐
│        Local SQLite  (SQLCipher-encrypted)      │  ← source of truth
│        key stored in expo-secure-store          │
└───────────────────┬────────────────────────────┘
                    │ background sync when online
┌───────────────────▼────────────────────────────┐
│                  PowerSync client                │
└───────────────────┬────────────────────────────┘
                    │ push / pull
┌───────────────────▼────────────────────────────┐
│   Supabase:  Postgres · Auth · Storage (photos)  │  ← cloud backup
│              Row-Level Security per family        │
└──────────────────────────────────────────────────┘
```
**Golden rule:** the UI never waits on the network. It reads/writes local SQLite.
PowerSync moves data to/from cloud in the background. The 3-tap offline lookup
must work in airplane mode.

## 2. Planned Folder Structure
```
GharDawae App/
├── docs/                  # all planning + this architecture doc
├── app/                   # screens (expo-router file-based routing)
│   ├── (auth)/            # login, signup
│   ├── (main)/            # home, member, records
│   └── _layout.tsx
├── components/            # reusable UI (Avatar, RecordCard, etc.)
├── db/                    # SQLite schema, migrations, queries
├── lib/                   # supabase client, powersync setup, helpers
├── hooks/                 # custom React hooks (data access)
├── constants/             # theme, presets (avatars), config
└── assets/                # icons, images
```
_(Adjusted as we go; recorded here when it changes.)_

## 3. Data Flow Pattern (how a feature reads/writes)
1. UI calls a **hook** (e.g. `useMembers()`).
2. Hook queries **local SQLite** (via db/ query functions).
3. Writes go to local SQLite immediately → UI updates instantly.
4. **PowerSync** detects the local change → syncs to Supabase when online.
5. Remote changes flow back down through PowerSync → local SQLite → UI.

_This pattern repeats for every feature. Individual features documented below._

---

## 4. Feature Build Log
_Each feature gets a section here WHEN we build it: what it does, which files,
key decisions, gotchas. Empty until we start M-milestones._

### (template for each feature)
```
### <Feature name>  ·  Milestone <Mx>  ·  <date>
- **What it does:**
- **Files touched:**
- **Data:** (tables/fields used)
- **Key decisions:**
- **Gotchas / things learned:** (also cross-link docs/LEARNING.md)
```

### — nothing built yet —
_First entry lands when we start M0/M1._

### Project Scaffold · Milestone M0 · 2026-09-26
- **What it does:** base Expo app runs; foundation for all features.
- **Files touched:** whole repo scaffolded via `create-expo-app` (default
  template = Expo Router + TypeScript). Renamed to Ghar Dawae in
  `package.json` + `app.json` (slug `ghar-dawae`, scheme `ghardawae`).
- **Structure added:** `src/lib/` (supabase/powersync clients + helpers),
  `src/db/` (SQLite schema + queries). Existing scaffold: `src/app/` (screens,
  file-based routing), `src/components/`, `src/constants/`, `src/hooks/`.
- **Key decisions:**
  - Kept the default Expo Router template (file-based routing under `src/app/`).
  - `.env` git-ignored; `.env.example` committed as the template (secrets never
    committed).
  - Added `css.d.ts` ambient types so `tsc` passes on the template's CSS imports.
- **Gotchas / learned:**
  - `npx tsc --noEmit` = our type-check command; must be clean before commit.
  - Scaffolded into temp `_init/` then moved to root (root wasn't empty — had
    docs/ + README). Template README/.claude discarded to keep ours.
- **Verify still pending:** EAS dev build on real Android phone (needs your
  Expo account login — interactive).

### Supabase Client + Cloud Schema · Milestone M0→M1 · 2026-09-26
- **What it does:** connects the app to Supabase (auth + cloud DB) and defines
  the cloud Postgres schema + security.
- **Files touched:**
  - `src/lib/supabase.ts` — Supabase client, session persisted in AsyncStorage.
  - `db/schema.sql` — Postgres tables: families, members, prescriptions, medicines.
  - `db/rls.sql` — Row-Level Security policies (family-scoped) + helper functions.
  - deps added: `@supabase/supabase-js`, `@react-native-async-storage/async-storage`,
    `react-native-url-polyfill`.
- **Key decisions:**
  - Config via `EXPO_PUBLIC_*` env vars; anon key is public-by-design, real
    protection = RLS.
  - Session persisted (AsyncStorage) + `detectSessionInUrl: false` (no URL bar
    on mobile) → supports "open straight to family grid" offline flow.
  - RLS uses `security definer` helper functions (`owns_family`,
    `owns_member`, `owns_prescription`) that walk child → family → auth.uid().
- **ACTION REQUIRED (you):** run `db/schema.sql` then `db/rls.sql` in Supabase
  SQL Editor. Order matters (schema first).
- **Gotchas / learned:** `EXPO_PUBLIC_` prefix required for env vars to reach
  the app bundle; without it `process.env.X` is undefined at runtime.

### M1 — Auth + Family · 2026-09-26
- **What it does:** manager signup/login, auth-gated navigation, family auto-created
  on first login, home = family avatar grid, add-member form, member detail (stub
  for M3 records).
- **Files:**
  - `src/lib/auth.ts` — signUp / signIn / signOut / getSession (Supabase Auth).
  - `src/lib/auth-context.tsx` — `AuthProvider` + `useAuth`; tracks session via
    `onAuthStateChange`, restores from AsyncStorage on launch.
  - `src/app/_layout.tsx` — root auth gate: `(auth)` group vs `(main)` group,
    splash held until session resolved.
  - `src/app/(auth)/` — `_layout`, `login.tsx`, `signup.tsx`.
  - `src/app/(main)/` — `_layout`, `index.tsx` (family grid + FAB + logout),
    `member/new.tsx` (add member), `member/[id].tsx` (detail, records stub).
  - `src/lib/family.ts` — Family/Member types + getMyFamily / createFamily /
    getOrCreateFamily / listMembers / addMember.
  - `src/constants/avatars.ts` — emoji preset avatars + relation list.
- **Data flow (v1 interim):** reads/writes go straight to Supabase. **M2 swaps
  reads to local SQLite** with PowerSync syncing to Supabase — screens/hooks
  stay the same, only `src/lib/*` data functions change.
- **Key decisions:**
  - Family auto-created ("My Family") on first login (getOrCreateFamily) — zero
    onboarding friction; rename later in settings.
  - Emoji preset avatars for v1 (no asset deps); photo upload + Design Day later.
  - Default UI only (plain styles) per design-day plan; not final visuals.
- **Gotchas / learned:**
  - Expo Router route types live in `.expo/types/router.d.ts` — regenerated when
    `expo start` runs. After adding/moving routes, `tsc` errors on `href` strings
    until the dev server regenerates them. Ran `expo start --offline` once to fix.
  - Deleted the template's demo components (animated-icon, app-tabs, hint-row,
    web-badge, external-link) — they referenced the removed `/explore` route.
  - `ThemeProvider` for expo-router comes from `expo-router`, not
    `@react-navigation/native` (not installed).
- **Verify pending (needs phone):** actually run signup → add member → see grid.

### EAS dev build setup · M0 · 2026-10-08
- **What it does:** cloud-builds an installable Android APK (dev build) so we can
  test on a real phone AND run native modules Expo Go lacks (needed for M2).
- **Files touched:**
  - `eas.json` (new) — development profile: `developmentClient: true`,
    `distribution: internal`, `android.buildType: apk`; preview (internal apk);
    production (app-bundle, autoIncrement).
  - `app.json` — added `android.package: "com.ghardawae.app"`; changed
    `web.output` static → `single` (fix below).
  - `expo-dev-client` dependency added.
- **Key decisions:**
  - Android dev builds must be **.apk** (per Expo SDK 57 docs) — .aab can't be
    installed on a device.
  - `appVersionSource: "remote"` in eas.json cli config.
- **Gotchas / learned:**
  - **Web crash fix:** `web.output: "static"` prerenders on Node (no `window`),
    which crashed Supabase auth + AsyncStorage at startup
    (`ReferenceError: window is not defined`). Switched to `"single"` (SPA, no
    SSR). Web now works.
  - `expo-dev-client` makes Metro connect to the dev build differently — this
    also resolves the earlier Expo Go "failed to download remote update" error.
  - Followed AGENTS.md: read SDK-57 versioned EAS docs instead of trusting
    training data.
- **ACTION REQUIRED (you):** first EAS build is interactive — Expo account login,
  keystore generation. Run:
  `npx eas-cli@latest build --platform android --profile development`

### M2 Step 1 — Local Encrypted SQLite (PowerSync) · 2026-10-08
- **What it does:** app now reads/writes a **local encrypted SQLite DB** — fully
  offline. Cloud sync added in Step 2.
- **Files:**
  - `src/lib/powersync/schema.ts` — PowerSync client Schema (Tables: families,
    members, prescriptions, medicines). `id` auto-created by PowerSync.
  - `src/lib/powersync/key.ts` — 256-bit key generated once (expo-crypto),
    stored in `expo-secure-store`.
  - `src/lib/powersync/db.ts` — single `PowerSyncDatabase` instance with
    `sqliteOptions.encryptionKey`.
  - `src/lib/family.ts` — rewritten: all reads/writes now local SQL (was Supabase).
  - screens updated: home, member/new, member/[id] use local DB.
- **PLAN CORRECTION vs docs/07-tech-stack.md:** PowerSync uses
  **`@op-engineering/op-sqlite`**, NOT `expo-sqlite`. Can't run both. SQLCipher is
  enabled via `package.json`: `"op-sqlite": { "sqlcipher": true }` — NOT the
  expo-sqlite `useSQLCipher` plugin originally planned. Encryption still achieved.
- **Key decisions:**
  - Key from expo-secure-store (Keystore/Keychain); never in AsyncStorage/code.
  - Reads are direct SQL (`db.getOptional`, `db.getAll`); writes via `db.execute`.
  - Local UUIDs generated client-side for row ids (no server round-trip).
  - Interim: `manager_user_id = session.user.id ?? "local"` until sync uses real
    auth.
- **Gotchas / learned:**
  - op-sqlite + SQLCipher needs a **native rebuild** (new dev build) — the
    currently-installed dev build lacks the SQLCipher native module.
  - SQLCipher is NOT supported in Expo Go — dev build required.
  - Removed unused Expo template theme components (`themed-text/view`,
    `collapsible`, `use-theme`, `use-color-scheme`); fixed lint (escaped
    apostrophes, unused var, react-compiler manual-memoization warning).
- **Verify pending (needs rebuilt dev build on phone):** add member offline,
  kill + reopen app, data persists; airplane mode works.

### M2 Step 2 — Cloud Sync (PowerSync <-> Supabase) · 2026-10-08
- **What it does:** local SQLite now syncs to Supabase cloud (upload + download),
  scoped per manager family. Offline still works; sync happens in background.
- **Files:**
  - `src/lib/powersync/connector.ts` — `SupabaseConnector`:
    `fetchCredentials()` (returns PowerSync URL + Supabase access token),
    `uploadData()` (pushes PUT/PATCH/DELETE to Supabase via
    `getNextCrudTransaction`, drops fatal-error batches to avoid a stuck queue).
  - `src/lib/powersync/sync.ts` — `usePowerSyncSync()` hook: connect on login,
    disconnect on sign-out; safe offline.
  - `src/app/_layout.tsx` — mounts the sync hook at root.
  - `docs/m2-powersync-sync-rules.yaml` — family-scoped sync streams (edition 3).
  - `docs/m2-powersync-setup.md` — the dashboard setup walkthrough.
- **Key decisions:**
  - Sync scoping = sync rules (PowerSync connects as `powersync_role` with
    `bypassrls`, so rules — not RLS — decide what each manager receives).
    RLS still guards direct Supabase API access from the app. Both matter.
  - Upload uses `supabase.from(table).upsert/update/delete` — RLS applies to
    these writes as the logged-in user.
  - Fatal Postgres errors (`22xxx`/`23xxx`/`42501`) → drop batch (complete) so the
    upload queue can't stall forever; transient errors rethrow → auto-retry.
- **ACTION REQUIRED (you):** follow `docs/m2-powersync-setup.md` (create PowerSync
  account, connect Supabase, deploy sync rules, set POWERSYNC_URL).
- **Gotchas:** empty `EXPO_PUBLIC_POWERSYNC_URL` → sync silently won't connect.
  Restart Metro after editing `.env`. Same rebuild as Step 1 covers the native
  modules.

### M2 Step 3 — Standalone (preview) build · 2026-10-08
- **What it does:** produces an installable APK with the JS bundle baked in —
  no Expo dev launcher screen, no Metro/dev-server dependency. Runs on its own.
- **Why:** the `development` profile ships `expo-dev-client`, so every launch
  shows the dev launcher and needs the PC's Metro server. A standalone build is
  what a real tester/user should install.
- **Files/config:**
  - `eas.json` — three profiles: `development` (`developmentClient: true`,
    needs Metro), `preview` (plain — `distribution: "internal"`,
    `android.buildType: "apk"`), `production` (`app-bundle`, `autoIncrement`).
    The absence of `developmentClient` in preview is exactly what removes the
    dev launcher.
  - EAS environment variables (project-scoped, environment `preview`):
    `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`,
    `EXPO_PUBLIC_POWERSYNC_URL`. Created with
    `eas env:create --environment preview`. **Dev-client builds read the local
    `.env`; EAS cloud builds do NOT** — they need these vars on the server, or
    the bundle ships with `undefined` config.
- **Key decisions:**
  - Keep `expo-dev-client` in `dependencies` (not devDependencies) for now.
    EAS autolinking is driven by `developmentClient: true`, so for a prebuild
    project a `--profile preview` build omits the dev launcher. Moving it to
    devDependencies would also strip it, but that change needs a native
    rebuild verification, so it's deferred.
  - Preview APK is signed with the same remote keystore as the dev build →
    Android installs it as an upgrade. Backendless installs (a dev build with
    no Metro running) are wiped; local data goes with it. Fresh installs are
    expected for the standalone step anyway.
- **Commands:** build `npx eas-cli@latest build -p android --profile preview`;
  install from the build's link/QR; store build uses
  `--profile production`.
- **Gotchas:** a standalone build has a **frozen JS bundle** — no hot reload;
  code changes need a rebuild (or EAS Update OTA once configured). Local
  `.env` edits do not reach cloud builds — use `eas env:create`/`env:update`.
- **ARTIFACT:** preview APK build
  `3c5fe40e-c764-434b-893e-358349cd13ff` @ commit `78ba5be` —
  https://expo.dev/accounts/aitzaz_dev/projects/ghar-dawae/builds/3c5fe40e-c764-434b-893e-358349cd13ff

### M3 — Records (camera-first add + visit history) · 2026-10-08
- **What it does:** a manager can photograph a prescription slip, type the
  doctor/date/diagnosis, add any number of medicines, and later browse a
  member's visit history and open any record. Works fully offline.
- **Files:**
  - `src/lib/records.ts` — prescriptions + medicines data access. Atomic
    create (`writeTransaction` so a record never lands without its medicines),
    ordered reads, delete, plus the two fast-entry queries (`recentDoctors`,
    `medicineSuggestions`) and date helpers (`today`, `parseDateInput`,
    `formatDateInput`, `formatVisitDate`).
  - `src/lib/photo.ts` — `savePhoto` / `photoUri` / `deletePhoto` /
    `replacePhoto` on the class-based `expo-file-system` API (`File`,
    `Directory`, `Paths`).
  - `src/lib/uuid.ts` — shared id generator (was duplicated in `family.ts`).
  - `src/components/RecordForm.tsx` — the shared form. Owns photo, doctor,
    date, diagnosis, medicine rows, notes, and the fast-entry affordances.
  - `src/app/(main)/record/camera.tsx` — `CameraView` capture, gallery
    fallback, permission gate.
  - `src/app/(main)/record/new.tsx` — resolves the member, mounts the form.
  - `src/app/(main)/record/[id].tsx` — record detail + delete.
  - `src/app/(main)/member/[id].tsx` — rewritten: visit-history list.
- **Key decisions:**
  - **Photo naming = record id.** The form mints the record's uuid *before*
    saving, names the photo file after it, then inserts the row with that same
    id. The photo and its record can't drift apart, and no second UPDATE is
    needed. (`NewPrescription.id` is optional for this reason.)
  - **Store the file NAME, not the URI.** iOS app-container paths contain a
    UUID that changes on reinstall; an absolute path saved today dies tomorrow.
    The directory is re-derived at read time via `photoUri()`.
  - **Copy out of cache.** Both the camera and the image picker return URIs in
    the purgeable cache directory, so every image is copied into
    `Paths.document/photos` before its URI is trusted.
  - **Camera pushes the shot to the form** (`router.replace` with a `photoUri`
    param). If the form were mounted first and the shot kept in screen state, a
    capture-then-back-out would lose the photo.
  - **Camera preview mounts only while focused** (`useFocusEffect`), because
    only one camera preview may run at a time and RN keeps screens mounted.
  - **Two queries, not 1+N,** for member history: load prescriptions, then
    batch-load medicines with `IN (...)`.
  - **Autocomplete responses are tagged with their query.** A slow response for
    an earlier keystroke can't render under a newer one.
- **Deps (native — needed a rebuild):** `expo-camera`, `expo-image-picker`,
  `expo-file-system`, `@react-native-community/datetimepicker`.
- **Gotchas:**
  - Expo Router route types are generated into `.expo/types/router.d.ts`; new
    route files don't typecheck until Metro has run once (`expo start`).
  - `expo-file-system`'s `documentDirectory`/`copyAsync` etc. are deprecated and
    **throw** from the main entry — use `File`/`Directory`/`Paths`.
  - Android's date picker dismisses itself and may report no date; only keep the
    picker open on iOS.
  - `react-hooks/set-state-in-effect` (lint, React Compiler rules) rejects
    `setState` in an effect body — derive instead, or set state in the async
    callback.
- **Not yet:** on-phone verification of the whole flow.

### M3 Step 2 — Photo backup to Supabase Storage · 2026-10-08
- **What it does:** local photo files are copied up to the private
  `prescription-photos` bucket, and the object key is stored in
  `prescriptions.photo_url`. A reinstalled app (or a second device) can then
  still show a slip whose local file is gone.
- **Files:**
  - `db/storage.sql` — four bucket policies (select/insert/update/delete) on
    `storage.objects`, scoped by `owns_family((storage.foldername(name))[1])`.
  - `src/lib/photo-sync.ts` — `uploadPhoto` (reads the file as bytes, uploads
    with `upsert`, writes `photo_url`), `syncPendingPhotos` (backs up every row
    with a `photo_path` and no `photo_url`), `signedPhotoUrl`.
  - `src/lib/use-photo-source.ts` — `usePhotoSource` hook: local file if
    present, else a signed URL.
  - `src/lib/powersync/sync.ts` — runs the pending-photo sweep on sign-in and
    every 60 s.
  - `docs/m3-photo-storage-setup.md` — setup walkthrough.
- **Key decisions:**
  - **Object key = `<family_id>/<record_id>.<ext>`.** The leading family id is
    what makes the storage policy a one-liner: `storage.foldername(name)[1]`
    hands the policy the same id the table helpers take.
  - **Photos are NOT part of the PowerSync stream.** PowerSync moves table rows,
    not files. Uploads go through the ordinary supabase-js storage client, which
    is exactly why these RLS policies (not the PowerSync sync rules) are the
    security boundary for photos.
  - **Private bucket + signed URLs.** No public URL to store; a short-lived URL
    is minted per view. The local file is preferred so the common path stays
    offline.
  - **Uploads are best-effort and idempotent.** A failure leaves the local file
    alone and the row is retried on the next sweep; `upsert` makes a retry safe.
  - **Deleting a record does not delete the uploaded object.** The row that
    referenced it is gone and the bucket is private, so the orphan is harmless;
    a sweep can come later. Not worth the complexity in v1.
- **Gotchas:**
  - The policies call `owns_family()`/`owns_prescription()`, so `db/rls.sql`
    must be applied first.
  - A private bucket with no policies silently fails every upload (RLS denies by
    default) — a 403 from storage is almost always a missing policy.
- **ACTION REQUIRED (you):** run `db/storage.sql` in the Supabase SQL Editor.
- **Not yet:** sweep orphaned objects in the bucket.

### M4 — Offline search · 2026-10-10
- **What it does:** one search box on the family grid finds family members,
  prescriptions (by doctor, diagnosis or notes) and individual medicines, all
  from local SQLite with no network.
- **Files:**
  - `src/lib/search.ts` — the query layer. Returns a `MemberHit | RecordHit |
    MedicineHit` union; record hits carry a `matchedOn` field naming the column
    that matched, so the result row can say *why* it matched.
  - `src/app/(main)/search.tsx` — debounced (150 ms) screen, grouped results,
    recent searches on focus.
  - `src/lib/records.ts` — `recentDoctors()`, `medicineSuggestions()` (reused by
    the record form's autocomplete).
- **Key decisions:**
  - **Search the local DB, never the API.** The product promise is that lookup
    works with no internet; a remote search box would break exactly when it
    matters.
  - **Escape LIKE metacharacters.** `likeTerm()` escapes `\`, `%` and `_` and
    every query uses `LIKE ? ESCAPE '\'`. Without this, typing `%` matches every
    row and a medicine called `Vit_D` matches `Vit D`.
  - **Two queries, not 1+N.** `loadMedicinesFor(ids)` takes the whole set of
    record ids and runs one `IN (...)` query instead of a query per record.
- **Gotchas:**
  - `react-hooks/set-state-in-effect` rejects `setRunning(true)` in an effect
    body when it would be synchronous on every render — it moved inside the
    debounce timer, and the "no manager yet" case became an early return rather
    than `setState(null)`.
- **Not yet:** search history persistence; ranking (results are grouped, not
  scored).

### M5 — Privacy, consent and delete-my-data · 2026-10-10
- **What it does:** completes the security-hardening milestone — a written
  privacy policy, a required consent gate at signup, an in-app policy screen,
  and a real account deletion path.
- **Files:**
  - `docs/privacy-policy.md` — the hosted copy Play requires (GitHub Pages).
  - `src/constants/privacy.ts` — `PRIVACY_VERSION` + `PRIVACY_SECTIONS`: the one
    source of truth, rendered by both the in-app screen and (in wording) the
    hosted page.
  - `src/app/(main)/settings/privacy.tsx` — renders the sections in-app.
  - `src/app/(auth)/signup.tsx` — required checkbox; signup is blocked with an
    Alert if it is unticked.
  - `src/lib/account.ts` — `deleteCloudFamily()` (photos → medicines →
    prescriptions → members → families, each query scoped by RLS),
    `deleteLocalData()`, `deleteAccountData()`.
  - `src/lib/family.ts` — `updateMember()`, `countPrescriptions()`,
    `deleteMemberDeep()`; `src/lib/powersync/key.ts` — `clearDbEncryptionKey()`.
  - `src/app/(main)/member/[id]/edit.tsx` — the edit-member screen M1 had
    deferred, plus delete-member with the prescription count in the confirm.
- **Key decisions:**
  - **Cloud first, local second.** If the cloud delete fails, nothing has been
    removed and the user is told "nothing was deleted". The reverse order would
    destroy the only copy of the records the user just asked to keep.
  - **Two confirmations before deleting an account.** One mis-tap must not
    destroy medical records. The second dialog says there is no recovery.
  - **Deletion goes through supabase-js, not PowerSync.** RLS then scopes each
    delete to the owner's family, so a bug in the loop cannot reach another
    family's rows.
  - **Consent is a hard gate, not a nudge.** Storing health records for other
    people is the sensitive part; an unticked box stops the signup.
- **Not yet:** on-device verification that a second account cannot see the first
  family's data (`docs/m7-launch-pack.md` §8).

### M6 — Sync visibility and empty states · 2026-10-10
- **What it does:** makes the backup state legible in plain language, and
  replaces blank screens with copy that tells the user what to do next.
- **Files:**
  - `src/lib/use-sync-status.ts` — subscribes with `db.registerListener({
    statusChanged })` and polls `db.getUploadQueueStats()`; returns `{ state:
    "idle" | "syncing" | "offline" | "error", hasPendingUploads, pendingUploads,
    lastSyncedAt, message }`.
  - `src/components/SyncBanner.tsx` — renders nothing in the normal case.
  - `src/app/(main)/index.tsx` — banner, tappable search bar, richer empty state.
  - `src/app/(main)/settings/index.tsx` — backup summary in plain words
    ("Saved on this phone" / "3 changes waiting" / "Up to date").
- **Key decisions:**
  - **Offline is not an error.** The app is offline-first; showing a red banner
    whenever the network drops would train users to ignore the banner. Only a
    genuine sync failure gets an error line.
  - **The banner says nothing when there is nothing to say.** A permanently
    visible "Synced ✓" is noise; it appears only when work is pending.
  - **"Waiting to back up", not "pending upload".** The Settings summary is
    written for a caretaker, not an engineer.
- **Not yet:** the airplane-mode and low-end-Android passes — they need the real
  phone.

### M7 — Launch pack · 2026-10-10
- **What it does:** the paperwork and the guardrails around shipping v1 — nothing
  here is user-facing code.
- **Files:**
  - `docs/m7-launch-pack.md` — policy hosting, Play Console, Data Safety
    answers, listing copy, beta plan, and the on-device checklist.
  - `scripts/preflight.mjs` — `npm run preflight`.
- **Key decisions:**
  - **Preflight exists to save build credits.** EAS builds are limited, so the
    cheap-but-expensive-to-discover mistakes (broken app.json, a preview profile
    that would ship the dev launcher, missing env vars, a committed
    service-role key, tsc/lint failures) are checked before a build is spent.
  - **It checks the EAS production environment, not just `.env`.** Cloud builds
    do not read the local `.env`; a build without EAS env vars installs fine and
    then cannot log in. This check found the production environment genuinely
    empty.
- **Gotchas:**
  - `eas env:list` rejects `--non-interactive`, and its default short format
    prints nothing when stdout is a pipe. `--format long` prints names reliably.
  - A helper that captures command output must decode stdout on the success path
    too — an early version returned `output: ""` there and reported a false
    failure on every run.
- **ACTION REQUIRED (you):** enable GitHub Pages on `/docs` for the policy URL,
  and replace the placeholder support email.

---

## 5. Design Approach
- **Default-first:** during build we use sensible default UI (system fonts,
  simple layout, placeholder colors) so we don't block on visuals.
- **Dedicated Design Day:** a separate session focused ONLY on design —
  finalize colors, typography, spacing, avatar presets, icon, splash,
  overall look/feel. Slotted after core features feel real (around M3/M4),
  before launch polish (M6).
- Rationale: design well once we can see real screens with real data, not in
  the abstract. Avoids redesigning empty shells.

## 6. Architecture Decisions Log (ADRs — short)
_Record notable "why we chose X" moments here as they happen._
- **2026-09-26** Local-first with PowerSync (not Firebase): relational schema +
  offline sync robustness. (See docs/07-tech-stack.md.)
- **2026-09-26** Model A (manager-only login, members = data): simpler v1;
  schema leaves room for member logins later. (See docs/06-data-model.md.)
- **2026-10-10** Search runs on local SQLite, never the API: the promise is that
  lookup works with no internet.
- **2026-10-10** Cloud-first account deletion: a network failure must leave the
  user's data intact and say so, not half-erase it.
- **2026-10-10** Photos use storage RLS, not PowerSync sync rules, as the
  security boundary: PowerSync moves rows, not files.
- **2026-10-10** Being offline is not presented as an error anywhere in the UI;
  only a real sync failure is.
