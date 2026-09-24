// Modèles proposés dans les réglages. Prix en dollars par million de tokens.
export const MODELS = [
  { id: "claude-sonnet-5", label: "Claude Sonnet 5", input: 2, output: 10, hint: "Bon équilibre coût et qualité" },
  { id: "claude-opus-5", label: "Claude Opus 5", input: 5, output: 25, hint: "Thèmes pointus, synthèses plus fines" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", input: 1, output: 5, hint: "Veille large et peu coûteuse" },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];

export const DEFAULT_MODEL: ModelId = "claude-sonnet-5";

// Recherche web facturée à part : 10 $ les 1 000 recherches. Écriture en cache ×1,25, lecture ×0,1.
export const WEB_SEARCH_USD = 0.01;
export const CACHE_WRITE_MULTIPLIER = 1.25;
export const CACHE_READ_MULTIPLIER = 0.1;

// Opus 5 et Sonnet 5 ont les outils web à filtrage dynamique ; Haiku 4.5 garde les versions de base.
export function supportsDynamicWebTools(model: string): boolean {
  return model !== "claude-haiku-4-5";
}

export function modelPricing(model: string) {
  return MODELS.find((m) => m.id === model) ?? MODELS[0];
}

export function isModelId(value: string): value is ModelId {
  return MODELS.some((model) => model.id === value);
}
