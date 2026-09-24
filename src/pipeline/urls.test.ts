import { describe, expect, it } from "vitest";
import { domainOf, normalizeUrl, urlHash } from "./urls";

describe("normalizeUrl", () => {
  it("rend équivalentes les variantes d'une même page", () => {
    const variants = [
      "https://nextjs.org/blog/next-16",
      "http://www.NextJS.org/blog/next-16/",
      "https://nextjs.org/blog/next-16?utm_source=x&utm_medium=y#intro",
    ];
    expect(new Set(variants.map(normalizeUrl))).toEqual(new Set(["https://nextjs.org/blog/next-16"]));
  });

  it("garde les paramètres utiles, triés", () => {
    expect(normalizeUrl("https://a.dev/p?b=2&a=1&ref=hn")).toBe("https://a.dev/p?a=1&b=2");
  });

  it("refuse ce qui n'est pas http(s)", () => {
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeUrl("pas une url")).toBeNull();
  });

  it("hash stable et domaine lisible", () => {
    expect(urlHash("https://a.dev")).toHaveLength(64);
    expect(urlHash("https://a.dev")).toBe(urlHash("https://a.dev"));
    expect(domainOf("https://www.github.blog/x")).toBe("github.blog");
  });
});
