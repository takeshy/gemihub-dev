import { useEffect } from "react";
import type { Language, FontSize } from "~/types/settings";

export function useApplySettings(language: Language, fontSize: FontSize) {
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    document.documentElement.lang = language;
    localStorage.setItem("gemini-hub-fontSize", String(fontSize));
    localStorage.setItem("gemini-hub-language", language);
  }, [language, fontSize]);
}
