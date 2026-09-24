const messages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Email ou mot de passe incorrect.",
  EMAIL_NOT_VERIFIED: "Adresse non vérifiée. Un nouveau lien de confirmation vient de vous être envoyé.",
  PASSWORD_TOO_SHORT: "Le mot de passe doit contenir au moins 10 caractères.",
  PASSWORD_TOO_LONG: "Le mot de passe est trop long.",
  PASSWORD_COMPROMISED: "Ce mot de passe apparaît dans des fuites de données connues. Choisissez-en un autre.",
  INVALID_EMAIL: "Adresse email invalide.",
  INVALID_TOKEN: "Ce lien est invalide ou a expiré. Faites une nouvelle demande.",
  INVALID_PASSWORD: "Mot de passe incorrect.",
};

export interface AuthError {
  code?: string;
  status?: number;
  message?: string;
}

export function authErrorMessage(error: AuthError): string {
  if (error.status === 429) return "Trop de tentatives, réessayez plus tard.";
  if (error.code && messages[error.code]) return messages[error.code];
  return "Une erreur est survenue, réessayez.";
}
