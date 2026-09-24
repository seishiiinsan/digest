import { describe, expect, it } from "vitest";
import { consume } from "./rate-limit";

const rule = { max: 3, windowMs: 60_000 };

describe("consume", () => {
  it("ouvre une fenêtre au premier appel", () => {
    expect(consume(null, rule, 1_000)).toEqual({ allowed: true, record: { count: 1, windowStart: 1_000 } });
  });

  it("bloque au-delà du maximum dans la fenêtre", () => {
    let record = null;
    const results: boolean[] = [];
    for (let i = 0; i < 4; i++) {
      const result = consume(record, rule, 1_000 + i);
      results.push(result.allowed);
      record = result.record;
    }
    expect(results).toEqual([true, true, true, false]);
  });

  it("repart à zéro quand la fenêtre expire", () => {
    const full = { count: 3, windowStart: 0 };
    expect(consume(full, rule, 59_999).allowed).toBe(false);
    expect(consume(full, rule, 60_000)).toEqual({ allowed: true, record: { count: 1, windowStart: 60_000 } });
  });
});
