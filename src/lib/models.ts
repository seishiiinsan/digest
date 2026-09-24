// Modèles proposés dans les réglages. Prix en dollars par million de tokens.
export const MODELS = [
  { id: "claude-sonnet-5", label: "Claude Sonnet 5", input: 2, output: 10, hint: "Bon équilibre coût et qualité" },
  { id: "claude-opus-5", label: "Claude Opus 5", input: 5, output: 25, hint: "Thèmes pointus, synthèses plus fines" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", input: 1, output: 5, hint: "Veille large et peu coûteuse" },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];

export const DEFAULT_MODEL: ModelId = "claude-sonnet-5";

export function isModelId(value: string): value is ModelId {
  return MODELS.some((model) => model.id === value);
}
