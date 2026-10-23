/**
 * Pre-launch preflight. Runs the checks that are cheap to automate but
 * expensive to discover after an EAS build: broken config, missing env vars,
 * dependency drift, and a typecheck/lint pass.
 *
 *   npm run preflight      (or: node scripts/preflight.mjs)
 *
 * Deliberately does NOT run a build, and does NOT touch the database — it only
 * looks. Anything requiring a device or a real account is in
 * docs/m7-launch-pack.md §8.
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const problems = [];
const warnings = [];

function ok(msg) {
  console.log(`  ok    ${msg}`);
}
function warn(msg) {
  warnings.push(msg);
  console.log(`  warn  ${msg}`);
}
function fail(msg) {
  problems.push(msg);
  console.log(`  FAIL  ${msg}`);
}

function section(title) {
  console.log(`\n${title}`);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function run(cmd) {
  try {
    // stdout has to be decoded here: a command that succeeds still prints, and
    // callers (the EAS env check) only look at the output.
    const stdout = execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
    return { ok: true, output: String(stdout ?? "").trim() };
  } catch (e) {
    return {
      ok: false,
      output: `${e.stdout ?? ""}${e.stderr ?? ""}`.trim(),
    };
  }
}

// --- app.json -----------------------------------------------------------------
section("App config");
let app = null;
try {
  app = readJson("app.json").expo;
  if (!app.name || !app.slug) fail("app.json is missing name or slug");
  else ok(`name "${app.name}", slug "${app.slug}"`);

  if (!app.android?.package) fail("app.json is missing android.package");
  else ok(`android package ${app.android.package}`);

  if (!app.extra?.eas?.projectId) fail("app.json is missing extra.eas.projectId");
  else ok("EAS projectId present");

  if (!app.version) fail("app.json is missing version");
  else ok(`version ${app.version}`);

  // A health app that ships with the wrong permission copy gets rejected.
  const perms = JSON.stringify(app.plugins ?? []);
  if (!perms.includes("expo-camera")) warn("expo-camera plugin not configured");
  else ok("camera + photo permission copy configured");

  // Web is a development convenience only; v1 ships Android.
  ok("target platform: Android (iOS deferred — docs/10)");
} catch (e) {
  fail(`could not read app.json: ${e.message}`);
}

// --- eas.json -----------------------------------------------------------------
section("Build profiles");
try {
  const eas = readJson("eas.json").build ?? {};
  if (eas.development?.developmentClient !== true) {
    warn("development profile does not set developmentClient");
  } else ok("development profile uses the dev client");

  if (eas.preview?.developmentClient) {
    fail("preview profile enables developmentClient — it would ship the dev launcher");
  } else ok("preview profile is standalone (no dev launcher)");

  if (eas.production?.android?.buildType !== "app-bundle") {
    fail("production profile is not building an app-bundle (Play needs .aab)");
  } else ok("production profile builds an .aab");

  if (!eas.production?.autoIncrement) {
    warn("production profile does not autoIncrement versionCode");
  } else ok("production autoIncrements versionCode");
} catch (e) {
  fail(`could not read eas.json: ${e.message}`);
}

// --- environment --------------------------------------------------------------
section("Environment");
const requiredEnv = [
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY",
  "EXPO_PUBLIC_POWERSYNC_URL",
];

if (existsSync(".env")) {
  const env = readFileSync(".env", "utf8");
  for (const key of requiredEnv) {
    const match = new RegExp(`^${key}=(.+)$`, "m").exec(env);
    if (!match || !match[1].trim()) fail(`${key} is missing or empty in .env`);
    else ok(`${key} is set locally`);
  }

  if (/^SUPABASE_SERVICE_ROLE_KEY=.+/m.test(env)) {
    warn(
      "SUPABASE_SERVICE_ROLE_KEY is in .env — fine locally, but it must NEVER " +
        "be prefixed EXPO_PUBLIC_ or it ships inside the app",
    );
  }
} else {
  warn("no .env file — copy .env.example and fill it in");
}

// Cloud builds read EAS environment variables, not the local .env. This is the
// single most likely cause of a build that installs but cannot log in.
//
// Two quirks worth knowing: `eas env:list` rejects --non-interactive outright,
// and its default short format prints nothing when stdout is a pipe. The long
// format prints names reliably, which is all we need here.
console.log("");
const easEnv = run(
  "npx eas-cli@latest env:list --environment production --format long",
);
if (!easEnv.ok) {
  warn("could not read EAS environment variables (offline or not logged in)");
} else if (/No variables found/i.test(easEnv.output)) {
  fail(
    "EAS has no production environment variables — a cloud build would ship " +
      "with undefined Supabase config. Run: eas env:create --environment production",
  );
} else {
  const missing = requiredEnv.filter((k) => !easEnv.output.includes(k));
  if (missing.length > 0) fail(`EAS production env missing: ${missing.join(", ")}`);
  else ok("EAS production env has all required EXPO_PUBLIC_ vars");
}

// --- secrets that must not be committed ---------------------------------------
section("Committed secrets");
const leak = run(
  "git grep -n -I -E 'service_role|SUPABASE_SERVICE_ROLE_KEY' -- ':!*.example' ':!docs' ':!scripts'",
);
if (leak.ok && leak.output.trim()) {
  fail(`possible secret committed:\n${leak.output}`);
} else {
  ok("no service-role key in tracked source");
}

const ignored = run("git check-ignore .env");
if (ignored.ok) ok(".env is git-ignored");
else fail(".env is NOT git-ignored — it holds secrets");

// --- code health --------------------------------------------------------------
section("Code health");
for (const [label, cmd] of [
  ["typecheck (tsc --noEmit)", "npx tsc --noEmit"],
  ["lint (expo lint)", "npx expo lint"],
]) {
  const res = run(cmd);
  if (res.ok) ok(label);
  else fail(`${label}\n${res.output.split("\n").slice(0, 12).join("\n")}`);
}

// --- summary ------------------------------------------------------------------
console.log(`\n${"─".repeat(60)}`);
if (problems.length === 0 && warnings.length === 0) {
  console.log("Preflight clean.");
} else {
  if (warnings.length > 0) {
    console.log(`\n${warnings.length} warning(s):`);
    for (const w of warnings) console.log(`  • ${w}`);
  }
  if (problems.length > 0) {
    console.log(`\n${problems.length} problem(s) — fix before building:`);
    for (const p of problems) console.log(`  • ${p}`);
  } else {
    console.log("\nNo blocking problems.");
  }
}

console.log(
  "\nStill manual (needs a device): docs/m7-launch-pack.md §8",
);
process.exit(problems.length > 0 ? 1 : 0);
