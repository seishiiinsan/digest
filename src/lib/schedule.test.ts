import { describe, expect, it } from "vitest";
import { isValidTimeZone, nextRunAt, zonedToUtc } from "./schedule";

const paris = "Europe/Paris";

describe("zonedToUtc", () => {
  it("gère l'heure d'été et d'hiver", () => {
    expect(zonedToUtc(2026, 7, 1, 8, paris).toISOString()).toBe("2026-07-01T06:00:00.000Z");
    expect(zonedToUtc(2026, 12, 1, 8, paris).toISOString()).toBe("2026-12-01T07:00:00.000Z");
    expect(zonedToUtc(2026, 9, 24, 8, "America/New_York").toISOString()).toBe("2026-09-24T12:00:00.000Z");
  });
});

describe("nextRunAt", () => {
  it("quotidien : aujourd'hui si l'heure n'est pas passée, sinon demain", () => {
    const rule = { frequency: "daily" as const, weekday: null, hour: 8 };
    expect(nextRunAt(rule, paris, new Date("2026-09-24T05:00:00Z")).toISOString()).toBe("2026-09-24T06:00:00.000Z");
    expect(nextRunAt(rule, paris, new Date("2026-09-24T06:00:00Z")).toISOString()).toBe("2026-09-25T06:00:00.000Z");
  });

  it("hebdomadaire : prochain jour choisi", () => {
    // 24/09/2026 est un jeudi ; lundi = 1
    const rule = { frequency: "weekly" as const, weekday: 1, hour: 9 };
    expect(nextRunAt(rule, paris, new Date("2026-09-24T10:00:00Z")).toISOString()).toBe("2026-09-28T07:00:00.000Z");
  });

  it("traverse le changement d'heure", () => {
    const rule = { frequency: "daily" as const, weekday: null, hour: 8 };
    // passage à l'heure d'hiver le 25/10/2026
    expect(nextRunAt(rule, paris, new Date("2026-10-24T07:00:00Z")).toISOString()).toBe("2026-10-25T07:00:00.000Z");
  });

  it("utilise la date locale, pas la date UTC", () => {
    const rule = { frequency: "daily" as const, weekday: null, hour: 1 };
    // 23:30 UTC le 24 = 01:30 à Paris le 25 : prochaine exécution le 26 à 01:00 locale
    expect(nextRunAt(rule, paris, new Date("2026-09-24T23:30:00Z")).toISOString()).toBe("2026-09-25T23:00:00.000Z");
  });
});

describe("isValidTimeZone", () => {
  it("valide les fuseaux IANA", () => {
    expect(isValidTimeZone("Europe/Paris")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
  });
});
