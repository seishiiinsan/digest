import { parseWebhookUrl, type WebhookKind } from "@/lib/webhook";

export interface DeliveryItem {
  title: string;
  summary: string;
  category: string;
  topic: string | null;
  url: string;
  domain: string;
}

export interface DigestMessage {
  heading: string;
  digestUrl: string;
  items: DeliveryItem[];
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

function footer(item: DeliveryItem): string {
  return [item.category, item.topic, item.domain].filter(Boolean).join(" · ");
}

// Discord : 10 embeds et ~6000 caractères max par message.
export function discordPayloads(message: DigestMessage): object[] {
  const intro = message.items.length
    ? `**${message.heading}** · ${message.items.length} info(s) · ${message.digestUrl}`
    : `**${message.heading}** · rien de nouveau sur vos thèmes.`;
  const payloads: { username: string; content: string; embeds: object[]; allowed_mentions: object }[] = [];
  let current = { username: "Digest", content: intro, embeds: [] as object[], allowed_mentions: { parse: [] } };
  let size = intro.length;

  for (const item of message.items) {
    const embed = {
      title: truncate(item.title, 256),
      url: item.url,
      description: truncate(item.summary, 700),
      footer: { text: truncate(footer(item), 200) },
    };
    const embedSize = embed.title.length + embed.description.length + embed.footer.text.length;
    if (current.embeds.length === 10 || size + embedSize > 5500) {
      payloads.push(current);
      current = { username: "Digest", content: "", embeds: [], allowed_mentions: { parse: [] } };
      size = 0;
    }
    current.embeds.push(embed);
    size += embedSize;
  }
  payloads.push(current);
  return payloads;
}

function slackEscape(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Slack : 50 blocs max par message, 3000 caractères par section.
export function slackPayloads(message: DigestMessage): object[] {
  const sections = message.items.map((item) => ({
    type: "section",
    text: {
      type: "mrkdwn",
      text: truncate(
        `*<${item.url}|${slackEscape(item.title)}>*\n${slackEscape(item.summary)}\n_${slackEscape(footer(item))}_`,
        3000,
      ),
    },
  }));
  const intro = message.items.length
    ? `${message.items.length} info(s) · <${message.digestUrl}|lire dans Digest>`
    : "Rien de nouveau sur vos thèmes.";
  const header = [
    { type: "header", text: { type: "plain_text", text: truncate(message.heading, 150) } },
    { type: "context", elements: [{ type: "mrkdwn", text: intro }] },
  ];

  const payloads: object[] = [];
  for (let i = 0; i === 0 || i < sections.length; i += 45) {
    const blocks = [...(i === 0 ? header : []), ...sections.slice(i, i + 45)];
    payloads.push({ text: i === 0 ? message.heading : `${message.heading} (suite)`, blocks });
  }
  return payloads;
}

export class DeliveryError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "DeliveryError";
  }
}

// Envoi HTTP : seulement vers Discord ou Slack, sans suivre de redirection.
export async function sendWebhook(url: string, kind: WebhookKind, payloads: object[], fetchImpl: typeof fetch = fetch) {
  if (parseWebhookUrl(url) !== kind) throw new DeliveryError("Adresse de webhook refusée.", false);
  for (const payload of payloads) {
    let response: Response;
    try {
      response = await fetchImpl(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new DeliveryError(`Impossible de joindre ${kind === "discord" ? "Discord" : "Slack"}.`, true);
    }
    if (response.ok) continue;
    if (response.status === 429 || response.status >= 500) {
      throw new DeliveryError(`${kind === "discord" ? "Discord" : "Slack"} indisponible (HTTP ${response.status}).`, true);
    }
    const hint = response.status === 404 || response.status === 403 ? " : webhook supprimé ou révoqué ?" : "";
    throw new DeliveryError(`Webhook refusé (HTTP ${response.status})${hint}`, false);
  }
}

export function payloadsFor(kind: WebhookKind, message: DigestMessage): object[] {
  return kind === "discord" ? discordPayloads(message) : slackPayloads(message);
}
