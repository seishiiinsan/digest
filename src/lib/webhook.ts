export type WebhookKind = "discord" | "slack";

// Seuls les webhooks Discord et Slack sont acceptés : le worker ne doit jamais appeler une adresse interne.
export function parseWebhookUrl(value: string): WebhookKind | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.port || url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  if ((host === "discord.com" || host === "discordapp.com") && /^\/api\/webhooks\/\d+\/[\w-]+\/?$/.test(url.pathname)) {
    return "discord";
  }
  if (host === "hooks.slack.com" && /^\/services\/[\w/]+$/.test(url.pathname)) return "slack";
  return null;
}
