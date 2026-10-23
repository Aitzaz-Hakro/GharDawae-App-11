# Ghar Dawae — Learning Log

_A running list of every tool, concept, and technique we use — so you can learn
as we build. When we hit something new, it gets added here first. If you don't
know it, we pause and learn before moving on._

_Last updated: 2026-09-26_

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
- **Status:** 🟡

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

- [ ] Camera access (expo-camera / image-picker)
- [ ] File system (saving photos on device)
- [ ] State management (how data flows through the app)
- [ ] Forms & validation (the fast-entry screen)
- _…more as they come up_
