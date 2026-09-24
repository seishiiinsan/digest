const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://localhost:8025";

interface MessageSummary {
  ID: string;
  Subject: string;
}

// Attend le dernier email reçu par `to` dont le sujet contient `subject`, et renvoie le premier lien.
export async function waitForLink(to: string, subject: string, timeoutMs = 10_000): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const query = encodeURIComponent(`to:"${to}" subject:"${subject}"`);
    const response = await fetch(`${MAILPIT_URL}/api/v1/search?query=${query}`);
    const { messages } = (await response.json()) as { messages: MessageSummary[] };
    if (messages.length > 0) {
      const message = await fetch(`${MAILPIT_URL}/api/v1/message/${messages[0].ID}`);
      const { Text } = (await message.json()) as { Text: string };
      const link = Text.match(/https?:\/\/\S+/)?.[0];
      if (link) return link;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Aucun email « ${subject} » reçu par ${to}`);
}
