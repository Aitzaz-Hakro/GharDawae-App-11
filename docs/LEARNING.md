# Ghar Dawae — Learning Log

_A running list of every tool, concept, and technique we use — so you can learn
as we build. When we hit something new, it gets added here first. If you don't
know it, we pause and learn before moving on._

_Last updated: 2026-10-10_

---

## How to use this doc
- Each entry = **What it is** (plain) → **Why we use it here** → **Learn it**
  (where to look) → **Status** (🔴 new / 🟡 learning / 🟢 comfortable).
- Tell me your status on each. 🔴 = we slow down and I explain before using it.

---

## Category: Framework & Language

### React Native
- **What:** framework to build real mobile apps using React (the web library you
  already know). Same components/hooks idea, but renders to native mobile UI.
- **Why here:** reuses your React/Next skill for a mobile app.
- **Learn:** React Native docs → "Core Components and APIs".
- **Status:** 🟡 (you know React; RN is React + mobile components)

### Expo
- **What:** a toolkit on top of React Native that handles the hard native setup
  (build, camera, storage) so you write mostly JS/TS.
- **Why here:** no emulator needed (test on real phone), less native config pain.
- **Learn:** Expo docs → "Get started"; concepts: Expo Go vs dev build, EAS.
- **Status:** 🟡 (you built one practice Expo app)

### TypeScript
- **What:** JavaScript + types. Catches mistakes before running.
- **Why here:** our data has a strict shape (Member, Prescription, Medicine) —
  types prevent bugs.
- **Learn:** TypeScript handbook → basics (types, interfaces). You'll mostly
  learn by seeing it in our code.
- **Status:** 🟢

---

## Category: Data & Offline

### SQLite
- **What:** a small database that lives in a single file, on the device. No server.
- **Why here:** our offline source of truth — app reads/writes here instantly,
  works with no internet.
- **Learn:** concept of tables/rows/SQL SELECT-INSERT; `expo-sqlite` docs.
- **Status:** 🟢 (SQL comfortable; `expo-sqlite` API is the only new part)

### SQL (the query language)
- **What:** how you talk to SQLite — `SELECT`, `INSERT`, `UPDATE`, `WHERE`.
- **Why here:** we query medicines/records/members with it (esp. search).
- **Learn:** any "SQL in 1 hour" intro; we'll write real queries together.
- **Status:** 🟢

### Offline-first architecture
- **What:** app treats the local device as the primary data store; cloud is a
  backup/sync target, not a requirement to function.
- **Why here:** this is the whole product — works with no internet.
- **Learn:** concept only for now; you'll see it in how we structure reads/writes.
- **Status:** 🔴

### PowerSync
- **What:** a service + SDK that keeps a local SQLite database on the device in
  sync with a cloud database (our Supabase Postgres). The app reads/writes local
  SQLite instantly (works offline); PowerSync pushes/pulls changes in the
  background when online.
- **Why here:** hand-writing sync (conflict handling, offline queue) is very
  bug-prone. PowerSync does it correctly. This IS the offline-first core.
- **Parts to know:**
  - **Client SDK** (`@powersync/react-native`) — the local DB + query hooks.
  - **Cloud service** — hosted; connects to Supabase, needs an account.
  - **Sync rules** — server-side config saying who syncs what (ours: a manager
    syncs only their own family).
  - **Connector** — small code file: provides auth token + uploads queued writes.
- **Learn:** docs.powersync.com → React Native/Expo guide.
- **Status:** 🔴 (new — go slow; this is M2's core)

### op-sqlite
- **What:** the actual SQLite engine PowerSync uses on React Native
  (`@op-engineering/op-sqlite`). Replaces expo-sqlite — can't run both.
- **Why here:** PowerSync requires it; it also supports SQLCipher encryption.
- **Status:** 🔴

### SQLCipher (via op-sqlite) · corrected
- **What:** encrypted SQLite — the local DB file is unreadable without a key
  (256-bit AES).
- **How (corrected for our stack):** enable `"op-sqlite": { "sqlcipher": true }`
  in package.json, then pass `sqliteOptions.encryptionKey` when creating the DB.
  (NOT the expo-sqlite `useSQLCipher` plugin I first wrote — PowerSync owns the
  SQLite layer.)
- **Key storage:** the encryption key comes from `expo-secure-store` (device
  Keystore/Keychain), never hard-coded.
- **Status:** 🔴

---

## Category: Backend & Cloud

### Supabase
- **What:** a hosted backend — gives you a Postgres database, user login (Auth),
  and file storage, without running your own server.
- **Why here:** cloud backup + auth + photo storage, free tier, matches our
  relational data.
- **Learn:** Supabase docs → "Getting started"; Auth + Database + Storage sections.
- **Status:** 🟢

### Postgres
- **What:** a powerful SQL database (what Supabase runs in the cloud).
- **Why here:** cloud side of our data; mirrors the local SQLite schema.
- **Learn:** same SQL basics as SQLite — the language transfers.
- **Status:** 🔴

### Row-Level Security (RLS)
- **What:** database rules so each user can only read/write their OWN rows.
- **Why here:** **critical** — without it, any user could read every family's
  medical data. Non-negotiable security control.
- **Learn:** Supabase docs → "Row Level Security". We'll write policies together.
- **Status:** 🟢 (comfortable with concept; we still verify policies carefully in M5)

---

## Category: Security

### SQLCipher
- **What:** encrypted version of SQLite — the local DB file is unreadable without
  a key.
- **Why here:** medical data on device must be encrypted at rest.
- **Learn:** concept of encryption-at-rest; how we plug it into expo-sqlite.
- **Status:** 🔴

### expo-secure-store
- **What:** secure place on the phone (Android Keystore / iOS Keychain) to keep
  secrets like our encryption key.
- **Why here:** the SQLCipher key must never sit in plaintext or in code.
- **Learn:** Expo docs → "SecureStore".
- **Status:** 🔴

### Password hashing
- **What:** passwords are stored as a scrambled one-way value, never plaintext.
- **Why here:** Supabase Auth does this for us — but you should understand why.
- **Learn:** concept: hashing vs encryption; why plaintext passwords = disaster.
- **Status:** 🔴

---

## Category: Tooling & Workflow

### EAS (Expo Application Services)
- **What:** Expo's cloud build service — turns your code into an installable APK
  without a local Android Studio setup.
- **Why here:** build the app, install on your real phone, no emulator. Also the
  only way to run native modules (SQLite/SQLCipher/PowerSync) that Expo Go lacks.
- **Learn:** Expo docs → "EAS Build" / "Create a development build".
- **Status:** 🟡 (setting up now)

### Development build (vs Expo Go) · M0·EAS
- **What:** a real installable app binary (APK) that includes
  `expo-dev-client` — your app + any native modules, plus a dev menu.
- **Why here:** Expo Go only has its bundled native modules. M2 adds SQLite,
  SQLCipher, PowerSync (native) → need a dev build. Also fixes the "failed to
  download remote update" error (dev build connects to Metro differently).
- **Key config:** `eas.json` development profile: `developmentClient: true`,
  `distribution: "internal"`, `android.buildType: "apk"` (dev builds must be APK,
  not AAB).
- **THE RULE (cost us two debugging sessions):** once a project has ANY native
  module, **Expo Go is dead for that project — permanently**. Not a version
  mismatch, not fixable by SDK alignment. Expo Go is one prebuilt binary holding
  *its own* fixed set of native modules; it cannot load a native module your
  project added, because that code isn't in it. The error is misleading — it
  reads like a broken install:
  `Base module not found. Did you do a pod install/clear the gradle cache?`
  That message is about **your project's** native build, so it is nonsense when
  there is no native build (Expo Go) — nothing to pod install, no gradle cache.
  Read it as: "this native module isn't in the binary you're running."
  Native modules in this project: `@op-engineering/op-sqlite` (behind PowerSync),
  `expo-camera`, `expo-image-picker`, `@react-native-community/datetimepicker`.
  Test path from here on = the **preview** profile.
- **Status:** 🟡

### Web is not a supported target for this stack · M2
- **What:** Expo can run an app in a browser, and it *looks* like it should work
  here. It cannot. Two hard stops:
  - `@powersync/react-native` is a **platform-specific adapter for iOS/Android
    only** — it wraps `@op-engineering/op-sqlite`, a native module with no web
    implementation. Web needs a different package, `@powersync/web` (currently
    **beta**), which runs SQLite as WebAssembly in a Web Worker.
  - `expo-secure-store` **has no web implementation**. Its web build is literally
    `export default {};`, so `SecureStore.getItemAsync` is `undefined` in a
    browser. The DB encryption key lives there, so the key path dies too.
- **Symptoms, and why they mislead:** the module-scope throw happens while Expo
  Router is still registering routes, so **every** route reports
  `Route "./x.tsx" is missing the required default export`. The warnings point at
  eight innocent screen files; the actual fault is one native import at the top
  of `_layout.tsx`'s import chain. Fix the warnings and nothing changes.
- **Making web work anyway** would need: `@powersync/web`, `npx @powersync/web
  copy-assets` into `public/`, a `metro.config.js` setting
  `resolver.unstable_conditionsByPlatform.web` and rewriting `resolveRequest` to
  return `{ type: 'empty' }` for `@powersync/react-native` on web, plus
  platform-split DB files (`.web.ts`). **Declined** — v1 ships Android only
  (docs/10). Recorded so nobody re-litigates it.
- **Corollary worth remembering:** "works on device" and "works in a browser"
  are unrelated questions once native modules are involved. Testing web proves
  nothing about the app, and a web failure proves nothing is broken.
- **Status:** 🟡

### Build profiles: development vs preview vs production · M2
- **What:** EAS builds differ by profile (defined in `eas.json`).
  - **development** — `developmentClient: true`. Includes the dev launcher +
    dev menu; REQUIRES a running Metro server. This is the "Expo banner" screen.
    For day-to-day coding (hot reload).
  - **preview** — standalone APK, `distribution: internal`. JS **bundled inside**
    the app; NO Metro, NO dev launcher, runs on its own. For testing as a real
    app / sharing with testers.
  - **production** — `.aab` for Google Play. No dev tooling.
- **Why here:** to get a "real" installable app with no Expo banners and no
  dependency on the PC dev server, build the **preview** profile.
- **Commands:**
  - dev: `npx eas-cli@latest build -p android --profile development`
  - standalone: `npx eas-cli@latest build -p android --profile preview`
  - store: `npx eas-cli@latest build -p android --profile production`
- **Gotcha:** a standalone (preview/production) build has a **frozen JS bundle** —
  no hot reload; changes need a rebuild unless EAS Update (OTA) is set up.
  Uninstall the dev build before installing a preview APK (different signing).
- **Gotcha (costs real money):** a cloud build does **not** read your local
  `.env`. Its environment comes from EAS environment variables per environment
  (`eas env:create --environment production`). Get this wrong and the APK
  installs, launches, and then cannot reach Supabase — with no error that points
  at the config.
- **Status:** 🟡

### Camera + image picker (expo-camera, expo-image-picker) · M3
- **What:** `expo-camera` renders `<CameraView>` (the live preview) and
  `takePictureAsync()` returns a photo at a temporary `uri`. `expo-image-picker`
  opens the system gallery via `launchImageLibraryAsync()`.
- **Why here:** camera-first record entry is the core flow; the gallery picker
  is the fallback for slips already photographed.
- **Key facts:**
  - Permissions come from hooks: `useCameraPermissions()` and
    `ImagePicker.useMediaLibraryPermissions()`. Both return
    `[response, requestPermission]`.
  - Only **one camera preview at a time** — unmount it when the screen loses
    focus, or the next camera screen stays black.
  - The returned `uri` lives in the **cache** directory, which the OS may purge.
    Copy it somewhere durable before trusting it.
- **Status:** 🔴

### File storage (expo-file-system, class API) · M3
- **What:** the current API is three classes — `File`, `Directory`, `Paths`.
  `Paths.document` = permanent app storage; `Paths.cache` = purgeable.
  `new File(Paths.document, "photos", "x.jpg")`, then `.create()`, `.copy()`,
  `.move()`, `.delete()`, `.exists`.
- **Why here:** prescription photos must outlive the camera's temp file.
- **Gotcha:** the old functions (`FileSystem.documentDirectory`, `copyAsync`,
  `getInfoAsync`…) are **deprecated and throw** from the main entry point. Use
  the classes, or import from `expo-file-system/legacy` to keep old code alive.
- **Also:** don't store absolute file URIs in the database — on iOS the app's
  container path changes between installs. Store the file **name** and rebuild
  the path at read time.
- **Status:** 🔴

### Supabase Storage (buckets, policies, signed URLs) · M3
- **What:** file storage alongside the database. A **bucket** is a container;
  buckets are **private by default**, and a private bucket denies *everything*
  until you add policies. Access is granted with RLS policies on the
  `storage.objects` table — the same policy language as the database.
- **Why here:** prescription photos must survive a reinstall, and photos must
  never leak between families.
- **Key facts:**
  - `storage.foldername(name)[1]` splits the object path, so a key of
    `<family_id>/<record_id>.jpg` lets a policy check ownership in one line.
  - A private bucket has no public URL. You mint a **signed URL**
    (`createSignedUrl`) — scoped to one object, expiring.
  - Uploads default to upsert behaviour, so the `update` policy matters as much
    as `insert`.
  - A 403 from storage almost always means a missing policy, not a bug.
- **Note:** PowerSync syncs **table rows only** — file uploads are ordinary
  client calls, so table sync rules and file policies are separate concerns.
- **Status:** 🔴

### Git / version control
- **What:** tracks code history, lets you undo, branch, and back up your work.
- **Why here:** this repo isn't a git repo yet — we should init it early so your
  work is safe.
- **Learn:** basic `git init / add / commit / push`; GitHub.
- **Status:** 🟢

---

## Concepts we'll add as we build
_(This section grows. Each new library, pattern, or technique lands here before
we use it in code.)_

### Expo Router (file-based routing) · M0
- **What:** screens are files under `src/app/`. A file = a route. Folders group
  routes; `(auth)` / `(main)` = layout groups (parens = not in the URL path).
  `_layout.tsx` wraps its folder's screens.
- **Why here:** default Expo template uses it; less boilerplate than manual
  navigation config. Like Next.js app-router but for mobile — familiar to you.
- **Learn:** Expo docs → "Expo Router". Maps closely to Next.js routing.
- **Status:** 🟡 (Next.js knowledge transfers directly)

### EXPO_PUBLIC_ env vars · M0
- **What:** env vars prefixed `EXPO_PUBLIC_` are inlined into the app bundle at
  build time and readable via `process.env.EXPO_PUBLIC_X`. Without the prefix
  they're undefined in the app.
- **Why here:** feed Supabase URL + anon key into `src/lib/supabase.ts`.
- **Note:** these are PUBLIC (shipped in the app). Never put secret keys here —
  the Supabase anon key is safe by design; RLS is what protects data.
- **Status:** 🟢 (same idea as Next.js `NEXT_PUBLIC_`)

### AsyncStorage · M0
- **What:** simple key-value storage on the device (like localStorage for RN).
- **Why here:** Supabase stores the login session here so the manager stays
  logged in across app restarts (needed for instant offline open).
- **Status:** 🟡

### Supabase auth session persistence · M0
- **What:** `persistSession` + a `storage` adapter keep the user logged in;
  `detectSessionInUrl: false` because mobile has no URL bar.
- **Status:** 🟢

### Transactions (db.writeTransaction) · M3
- **What:** a block of writes that succeeds or fails as one unit —
  `db.writeTransaction(async (tx) => { ... })`, where `tx.execute(...)` is the
  in-transaction handle. Other devices/screens reading the DB never see a
  half-finished result.
- **Why here:** a prescription and its medicines are one logical record. Without
  a transaction a crash between the two INSERTs leaves an orphan.
- **Note:** plain `db.execute()` is fine for a single statement.
- **Status:** 🟡

### Debounced autocomplete · M3
- **What:** wait ~150 ms after the user stops typing before running the query,
  and tag each response with the text it was for so a slow reply for an old
  keystroke can't overwrite a newer one.
- **Why here:** searching past medicine names on every keystroke is wasteful and
  can show results that don't match what's on screen.
- **Status:** 🟡

### Route types (Expo Router typedRoutes) · M3
- **What:** with `experiments.typedRoutes`, Expo generates
  `.expo/types/router.d.ts` listing every valid route, so `router.push` typos
  become type errors. The file is generated and git-ignored.
- **Gotcha:** a **newly added route file isn't in those types until Metro has
  run once**. Typecheck fails with "not assignable" on a path that clearly
  exists — start the dev server and re-run `tsc`.
- **Status:** 🟡

### Offline search over LIKE · M4
- **What:** searching members, records and medicines with `WHERE name LIKE ?`.
  `%` is the wildcard; `?` binds a parameter so user input is never concatenated
  into SQL.
- **Gotcha (the real lesson):** `%` and `_` are wildcards *inside the pattern*,
  and a user can type them. `WHERE name LIKE '%${q}%'` with `q = "%"` matches
  every row. Escape `\`, `%`, `_` in the term and declare the escape character
  explicitly:
  `WHERE name LIKE ? ESCAPE '\'` with the bound term already escaped.
  A medicine named `Vit_D` otherwise matches a search for `Vit D`.
- **Also:** finding the medicines for N records is one `IN (...)` query, not one
  query per record. 1+N queries is the default mistake and it only shows up when
  a family has real history.
- **Why here:** the whole point of search is that it works in airplane mode, so
  it has to be a local query — which means these are the failure modes that
  matter.
- **Status:** 🟡

### Sync status listeners (PowerSync) · M6
- **What:** `db.registerListener({ statusChanged })` fires when the connection
  state or upload queue changes; `db.currentStatus` reads it now;
  `db.getUploadQueueStats()` gives the pending-upload count.
- **Gotcha:** the status object is not cheap to render from — copy the fields you
  need into local state in the callback rather than reading `db.currentStatus`
  during render.
- **Design lesson worth keeping:** "offline" is a normal state for an
  offline-first app. Surfacing it as an error trains users to ignore the thing
  that is supposed to warn them. Only a genuine failure gets error styling.
- **Status:** 🟡

### Privacy policy + consent gate · M5
- **What:** Play requires a publicly hosted privacy policy for a health app, and
  a Data Safety form whose answers must match observed behaviour. In-app, the
  policy is one constant (`PRIVACY_VERSION`, `PRIVACY_SECTIONS`) rendered in one
  screen, with signup blocked until a consent checkbox is ticked.
- **Lesson:** keep the policy text in exactly one place. A hosted page and an
  in-app page that drift apart are a compliance problem, not a docs problem.
- **Status:** 🟡

### Destructive-action ordering (delete my data) · M5
- **What:** account deletion removes the cloud copy **first**, then the local
  database and photo files.
- **Why that order:** cloud delete is the step that can fail (network, RLS). Fail
  there and nothing has been removed, so the app can honestly say "nothing was
  deleted". Delete locally first and a failed cloud call leaves an account whose
  records are gone from the phone but alive in the cloud — the worst of both.
- **Also:** a name claim is not a permission check. The delete path goes through
  supabase-js so RLS scopes every statement to the owner's family; the loop
  itself never decides what it is allowed to touch.
- **Status:** 🟡

- [ ] State management (how data flows through the app)
- [ ] Forms & validation (the fast-entry screen)
- [x] Camera access (expo-camera / image-picker) · M3
- [x] File system (saving photos on device) · M3
- [x] Photo upload to Supabase Storage (on sync) · M3
- [x] Search (SQLite queries across members, records, medicines) · M4
- [x] Sync status / upload queue listeners · M6
- [x] Consent + hosted privacy policy · M5
- _…more as they come up_
