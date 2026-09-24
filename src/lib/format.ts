export function formatDateTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone }).format(date);
}

export function formatUsd(value: number | { toString(): string }): string {
  const amount = typeof value === "number" ? value : Number(value.toString());
  return `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} $`;
}

export function formatTokens(value: number): string {
  return value.toLocaleString("fr-FR");
}

export const RUN_STATUS_LABEL = {
  queued: "En attente",
  running: "En cours",
  succeeded: "Terminée",
  failed: "Échec",
} as const;

export const CATEGORY_LABEL = {
  release: "Release",
  announcement: "Annonce",
  article: "Article",
  security: "Sécurité",
  trend: "Tendance",
} as const;
