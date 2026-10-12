export const defaultLanguage = "pl";

export const languages = [
  { code: "pl", label: "Polski", nativeLabel: "Polski", flag: "pl" },
  { code: "en", label: "Angielski", nativeLabel: "English", flag: "gb" },
  { code: "de", label: "Niemiecki", nativeLabel: "Deutsch", flag: "de" },
  { code: "tr", label: "Turecki", nativeLabel: "Türkçe", flag: "tr" },
];

export const languageCodes = languages.map((language) => language.code);

export function normalizeLanguage(language) {
  return languageCodes.includes(language) ? language : defaultLanguage;
}

export function getLanguageLabel(language) {
  return (
    languages.find((item) => item.code === normalizeLanguage(language))
      ?.label || "Polski"
  );
}

export function getVideoKey(language, audience) {
  return `${normalizeLanguage(language)}:${normalizeAudience(audience)}`;
}

export function normalizeAudience(audience) {
  return audience === "subcontractor" ? "subcontractor" : "guest";
}
