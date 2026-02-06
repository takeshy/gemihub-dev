import { createContext, useContext } from "react";
import type { Language } from "~/types/settings";
import { t } from "./translations";
import type { TranslationStrings } from "./translations";

interface I18nContextValue {
  language: Language;
  t: (key: keyof TranslationStrings) => string;
}

const I18nContext = createContext<I18nContextValue>({
  language: "en",
  t: (key) => t("en", key),
});

export function I18nProvider({
  language,
  children,
}: {
  language: Language;
  children: React.ReactNode;
}) {
  const value: I18nContextValue = {
    language,
    t: (key) => t(language, key),
  };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
