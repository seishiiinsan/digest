import { describe, expect, it, vi } from "vitest";
import { DeliveryError, discordPayloads, sendWebhook, slackPayloads, type DigestMessage } from "./delivery";

function message(count: number): DigestMessage {
  return {
    heading: "Veille du 24 sept. 2026",
    digestUrl: "https://digest.test/veilles/1",
    items: Array.from({ length: count }, (_, i) => ({
      title: `Info ${i} <b>`,
      summary: "Résumé ".repeat(50),
      category: "Release",
      topic: "Next.js",
      url: `https://nextjs.org/${i}`,
      domain: "nextjs.org",
    })),
  };
}

const discordUrl = "https://discord.com/api/webhooks/1/token";

describe("messages", () => {
  it("Discord : 10 embeds max par message, aucune mention", () => {
    const payloads = discordPayloads(message(23)) as { embeds: { title: string; url: string }[]; allowed_mentions: object }[];
    expect(payloads.map((p) => p.embeds.length).reduce((a, b) => a + b)).toBe(23);
    expect(payloads.every((p) => p.embeds.length <= 10)).toBe(true);
    expect(payloads[0].embeds[0]).toMatchObject({ title: "Info 0 <b>", url: "https://nextjs.org/0" });
    expect(payloads[0].allowed_mentions).toEqual({ parse: [] });
  });

  it("Slack : échappe le texte et découpe en messages de 50 blocs max", () => {
    const payloads = slackPayloads(message(60)) as { blocks: { text?: { text: string } }[] }[];
    expect(payloads).toHaveLength(2);
    expect(payloads.every((p) => p.blocks.length <= 50)).toBe(true);
    expect(payloads[0].blocks[2].text!.text).toContain("*<https://nextjs.org/0|Info 0 &lt;b&gt;>*");
  });

  it("signale une veille vide", () => {
    expect(JSON.stringify(discordPayloads(message(0)))).toContain("rien de nouveau");
    expect(JSON.stringify(slackPayloads(message(0)))).toContain("Rien de nouveau");
  });
});

describe("sendWebhook", () => {
  it("poste chaque message en JSON sans suivre de redirection", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 204 }));
    await sendWebhook(discordUrl, "discord", [{ a: 1 }, { b: 2 }], fetchImpl);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[0]).toMatchObject([discordUrl, { method: "POST", redirect: "error", body: '{"a":1}' }]);
  });

  it("refuse une adresse qui n'est pas un webhook du bon service", async () => {
    const fetchImpl = vi.fn();
    await expect(sendWebhook("https://evil.test/api/webhooks/1/x", "discord", [{}], fetchImpl)).rejects.toThrow("refusée");
    await expect(sendWebhook(discordUrl, "slack", [{}], fetchImpl)).rejects.toThrow("refusée");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("distingue erreurs temporaires et définitives", async () => {
    const status = (code: number) => vi.fn(async () => new Response(null, { status: code }));
    await expect(sendWebhook(discordUrl, "discord", [{}], status(429))).rejects.toMatchObject({ retryable: true });
    await expect(sendWebhook(discordUrl, "discord", [{}], status(404))).rejects.toMatchObject({
      retryable: false,
      message: "Webhook refusé (HTTP 404) : webhook supprimé ou révoqué ?",
    });
    await expect(sendWebhook(discordUrl, "discord", [{}], vi.fn().mockRejectedValue(new Error("x")))).rejects.toBeInstanceOf(DeliveryError);
  });
});
