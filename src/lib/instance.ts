// Réglages de l'instance, lus dans l'environnement du serveur.
export function signupEnabled(): boolean {
  return process.env.SIGNUP_ENABLED !== "false";
}

export function isAdmin(email: string): boolean {
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}
