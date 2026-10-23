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
