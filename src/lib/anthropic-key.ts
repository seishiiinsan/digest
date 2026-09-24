import Anthropic from "@anthropic-ai/sdk";

export type KeyCheck = { ok: true } | { ok: false; message: string };

export function looksLikeAnthropicKey(key: string): boolean {
  return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(key);
}

export function describeKeyError(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) return "Clé refusée par Anthropic : elle est invalide ou révoquée.";
  if (error instanceof Anthropic.PermissionDeniedError) return "Cette clé n'a pas accès à l'API Messages.";
  if (error instanceof Anthropic.NotFoundError) return "Ce modèle n'est pas disponible avec cette clé.";
  if (error instanceof Anthropic.RateLimitError) return "Limite de débit atteinte sur cette clé, réessayez dans une minute.";
  // Crédit épuisé : 400 invalid_request_error sans classe dédiée, seul le message le distingue.
  if (error instanceof Anthropic.BadRequestError && /credit balance/i.test(error.message)) {
    return "Crédit insuffisant sur le compte Anthropic de cette clé.";
  }
  if (error instanceof Anthropic.InternalServerError) return "Anthropic est indisponible pour le moment, réessayez plus tard.";
  if (error instanceof Anthropic.APIConnectionError) return "Impossible de joindre l'API Anthropic depuis le serveur.";
  return "La clé n'a pas pu être vérifiée, réessayez.";
}

// Appel de test au coût négligeable : 1 token de sortie sur le modèle choisi.
export async function checkApiKey(apiKey: string, model: string): Promise<KeyCheck> {
  if (!looksLikeAnthropicKey(apiKey)) return { ok: false, message: "Format de clé invalide : une clé Anthropic commence par sk-ant-." };
  const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 20_000 });
  try {
    await client.messages.create({ model, max_tokens: 1, messages: [{ role: "user", content: "ok" }] });
    return { ok: true };
  } catch (error) {
    return { ok: false, message: describeKeyError(error) };
  }
}
