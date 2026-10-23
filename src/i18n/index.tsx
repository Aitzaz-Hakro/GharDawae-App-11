import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import en, { type StringKey } from "./en";
import ur from "./ur";

export type Lang = "en" | "ur";

type LanguageContextValue = {
  lang: Lang;
  isUrdu: boolean;
  setLang: (lang: Lang) => void;
  toggle: () => void;
  t: (key: StringKey) => string;
};

const STORAGE_KEY = "ghardawae.language";
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // A failed read is harmless: the app opens in English.
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (alive && (value === "en" || value === "ur")) setLangState(value);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const toggle = useCallback(() => {
    setLangState((prev) => {
      const next: Lang = prev === "en" ? "ur" : "en";
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const t = useCallback(
    (key: StringKey) => (lang === "ur" ? (ur[key] ?? en[key]) : en[key]),
    [lang],
  );

  const value = useMemo(
    () => ({ lang, isUrdu: lang === "ur", setLang, toggle, t }),
    [lang, setLang, toggle, t],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return value;
}

export type { StringKey };
