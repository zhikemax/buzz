import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { setDateFormatLocale } from "./dateLocale";
import {
  type Locale,
  type MessageKey,
  type TranslateFn,
  applyDocumentLocale,
  detectLocale,
  persistLocale,
  translate,
} from "./locale";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslateFn;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectLocale());

  useEffect(() => {
    applyDocumentLocale(locale);
    setDateFormatLocale(locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
    applyDocumentLocale(next);
  }, []);

  const t = useCallback<TranslateFn>(
    (key, params) => translate(locale, key, params),
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}

export function useT() {
  return useLocale().t;
}

/** Safe translate for non-React helpers; falls back to English keys if needed. */
export function presenceMessageKey(
  status: "online" | "away" | "offline",
): MessageKey {
  switch (status) {
    case "online":
      return "presence.online";
    case "away":
      return "presence.away";
    case "offline":
      return "presence.offline";
  }
}
