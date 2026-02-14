import type { Language } from "~/types/settings";

const SUPPORTED = new Set<string>(["en", "ja"]);

/**
 * Resolve the effective language from settings + browser/header hint.
 * - If `settingsLanguage` is non-null, use it (user explicitly chose).
 * - Otherwise parse `hint` (Accept-Language header value or navigator.language).
 * - Falls back to "en".
 */
export function resolveLanguage(
  settingsLanguage: Language | null | undefined,
  hint?: string | null
): Language {
  if (settingsLanguage) return settingsLanguage;
  if (hint) {
    const tags = hint.split(",").map((s) => s.split(";")[0].trim().toLowerCase());
    for (const tag of tags) {
      const primary = tag.split("-")[0];
      if (SUPPORTED.has(primary)) return primary as Language;
    }
  }
  return "en";
}
