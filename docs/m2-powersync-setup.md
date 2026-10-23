# M2 Step 2 — PowerSync Cloud Setup (Supabase sync)

_Step-by-step. Do these in order. Everything here is browser/dashboard work — no
code changes needed; the connector code is already written._

## What you're setting up
A PowerSync **instance** (cloud service) sits between your app and Supabase. It
watches your Supabase Postgres, and pushes/pulls changes to your app's local
SQLite. Sync is scoped so a manager gets only their own family.

```
[ app local SQLite ] <-> [ PowerSync Cloud ] <-> [ Supabase Postgres ]
```

---

## 1. Create a PowerSync account / project
1. Go to **https://powersync.com** → **Sign up** (free tier is fine for dev).
2. Create a **project**, then an **instance** inside it (e.g. `ghar-dawae-dev`).
3. Dashboard should now show your instance with "Database Connection" /
   "Connect Supabase" options.

## 2. Give PowerSync a dedicated Postgres role (in Supabase)
PowerSync connects to your Postgres as a replication role. In Supabase →
**SQL Editor**, run (change the password to something strong):

```sql
-- dedicated replication role for PowerSync
create role powersync_role with
  login replication bypassrls
  password 'PUT-A-STRONG-PASSWORD-HERE';

grant select on all tables in schema public to powersync_role;
alter default privileges in schema public
  grant select on tables to powersync_role;
```

(The `grant select on all tables` covers our 4 tables + future ones.)

## 3. Connect Supabase to PowerSync
1. In **Supabase** → **Connect** → **Direct connection** → copy the full
   connection string (the one with `[YOUR-PASSWORD]`).
2. In **PowerSync dashboard** → your instance → **Database Connection** →
   **Postgres** tab → paste into **URI**.
3. Set **Username** = `powersync_role`, **Password** = the one you set above.
4. Click **Test Connection** → then **Save Connection**.
   (Provisions the cloud env — takes a minute or two.)

## 4. Configure client auth
PowerSync → **Client Auth** → enable **Use Supabase Auth**. This makes
`auth.user_id()` (used in our sync rules) resolve to the Supabase user id.
- If Supabase uses **legacy JWT signing keys**, paste the JWT secret here.
- If **asymmetric keys**, no secret needed.

## 5. Deploy the sync rules
1. PowerSync → **Sync Streams** (or **Sync Rules**) → editor.
2. Paste the contents of `docs/m2-powersync-sync-rules.yaml`.
3. Click **Validate** (checks against your Postgres), then **Deploy**.

## 6. Copy the instance URL
PowerSync dashboard → **Connect** (top bar) → copy the **instance URL**.
It looks like: `https://<instance-id>.powersync.journeyapps.com`.

## 7. Put the URL in your .env
Add to `.env` (git-ignored):
```
EXPO_PUBLIC_POWERSYNC_URL=https://<your-instance>.powersync.journeyapps.com
```
Restart Metro after changing `.env` (env vars are read at start).

---

## 8. Build + test
1. **Rebuild the dev build** (Step 1 added native SQLCipher/op-sqlite modules;
   same rebuild covers this):
   ```
   npx eas-cli@latest build --platform android --profile development
   ```
2. Install the APK (uninstall old app first if Android refuses in-place).
3. `npx expo start` → connect → log in.
4. **Test sync:**
   - Add a member in the app.
   - In Supabase → Table Editor → `members` → the row should appear (upload).
   - In Supabase, edit a row / insert one under your family.
   - In the app, pull-to-refresh (or reopen) → change appears (download).
5. **Offline test:** airplane mode → add member → works → back online → syncs up.

---

## Gotchas
- **4xx from uploadData blocks the queue** — our connector drops fatal-error
  batches (`22xxx`/`23xxx`/`42501`) instead of stalling. See connector.ts.
- **RLS + sync**: PowerSync connects as `powersync_role` (`bypassrls`), so sync
  rules — not RLS — scope what each manager receives. RLS still protects direct
  Supabase API access from the app. Both matter.
- **`EXPO_PUBLIC_POWERSYNC_URL` empty** → connector returns the empty endpoint →
  sync silently won't connect. Verify the var is set.
- **WAL growth**: Supabase logical replication can grow WAL on idle instances;
  set modest `max_wal_size` / `max_slot_wal_keep_size` if warned.
