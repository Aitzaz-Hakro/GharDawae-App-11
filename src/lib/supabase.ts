// Supabase client for Ghar Dawae.
//
// Reads config from EXPO_PUBLIC_* env vars (see .env / .env.example).
// EXPO_PUBLIC_ vars are inlined into the app bundle at build time — the anon
// key is designed to be public (safe on-device); real protection comes from
// Row-Level Security policies on the database (see docs/08-security.md).
//
// Auth sessions persist in AsyncStorage so the manager stays logged in
// (supports the "open straight to family grid" offline flow from docs/04).

import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Copy .env.example to .env and fill " +
      "EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // React Native has no URL bar, so no session to detect in the URL.
    detectSessionInUrl: false,
  },
});
