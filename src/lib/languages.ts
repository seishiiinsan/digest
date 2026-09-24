// Langues de sortie des veilles (code BCP 47 → libellé).
export const LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
] as const;

export function isLanguage(code: string): boolean {
  return LANGUAGES.some((language) => language.code === code);
}
