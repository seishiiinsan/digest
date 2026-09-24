import { describe, expect, it } from "vitest";
import { normalizeDomain, parseList, topicFromForm } from "./topic-input";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("topic input", () => {
  it("découpe et dédoublonne les listes", () => {
    expect(parseList(" React, Next.js\nReact ,, ")).toEqual(["React", "Next.js"]);
  });

  it("normalise les domaines", () => {
    expect(normalizeDomain("https://www.React.dev/blog")).toBe("react.dev");
    expect(normalizeDomain("github.blog")).toBe("github.blog");
    expect(normalizeDomain("localhost")).toBeNull();
    expect(normalizeDomain("pas un domaine")).toBeNull();
  });

  it("valide un thème complet", () => {
    const result = topicFromForm(
      form({ title: " Next.js ", keywords: "RSC, App Router", includeDomains: "nextjs.org\nhttps://vercel.com/blog", detailLevel: "short" }),
    );
    expect(result.success && result.data).toEqual({
      title: "Next.js",
      description: "",
      keywords: ["RSC", "App Router"],
      includeDomains: ["nextjs.org", "vercel.com"],
      excludeDomains: [],
      detailLevel: "short",
    });
  });

  it("signale un titre vide ou un domaine invalide", () => {
    expect(topicFromForm(form({ title: "" })).error?.issues[0].message).toBe("Donnez un titre à la rubrique.");
    expect(topicFromForm(form({ title: "x", excludeDomains: "exemple" })).error?.issues[0].message).toBe(
      "Domaine invalide : exemple",
    );
  });
});
