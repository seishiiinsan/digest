import { describe, expect, it } from "vitest";
import { parseWebhookUrl } from "./webhook";

describe("parseWebhookUrl", () => {
  it("reconnaît Discord et Slack", () => {
    expect(parseWebhookUrl("https://discord.com/api/webhooks/123456/abc-DEF_1")).toBe("discord");
    expect(parseWebhookUrl("https://discordapp.com/api/webhooks/1/x")).toBe("discord");
    expect(parseWebhookUrl(" https://hooks.slack.com/services/T000/B000/XXXX ")).toBe("slack");
  });

  it("refuse tout le reste", () => {
    for (const url of [
      "http://discord.com/api/webhooks/1/x",
      "https://discord.com.evil.test/api/webhooks/1/x",
      "https://discord.com:8443/api/webhooks/1/x",
      "https://user:pw@hooks.slack.com/services/T/B/X",
      "https://discord.com/channels/1/2",
      "https://127.0.0.1/api/webhooks/1/x",
      "pas une url",
    ]) {
      expect(parseWebhookUrl(url), url).toBeNull();
    }
  });
});
