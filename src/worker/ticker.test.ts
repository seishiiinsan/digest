import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { msUntilNextMinute, startTicker } from "./ticker";

describe("msUntilNextMinute", () => {
  it("vise la minute suivante", () => {
    expect(msUntilNextMinute(new Date("2026-09-24T10:00:00.000Z"))).toBe(60_000);
    expect(msUntilNextMinute(new Date("2026-09-24T10:00:59.250Z"))).toBe(750);
  });
});

describe("startTicker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-24T10:00:30.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("s'aligne sur le début de chaque minute", async () => {
    const calls: string[] = [];
    const ticker = startTicker(async (now) => {
      calls.push(now.toISOString());
    });

    await vi.advanceTimersByTimeAsync(29_999);
    expect(calls).toEqual([]);

    await vi.advanceTimersByTimeAsync(1 + 120_000);
    expect(calls).toEqual([
      "2026-09-24T10:01:00.000Z",
      "2026-09-24T10:02:00.000Z",
      "2026-09-24T10:03:00.000Z",
    ]);

    await ticker.stop();
  });

  it("saute un tick si le précédent tourne encore", async () => {
    let calls = 0;
    const ticker = startTicker(async () => {
      calls++;
      await new Promise((resolve) => setTimeout(resolve, 90_000));
    });

    await vi.advanceTimersByTimeAsync(30_000 + 60_000);
    expect(calls).toBe(1);

    await vi.advanceTimersByTimeAsync(60_000);
    expect(calls).toBe(2);

    const stopped = ticker.stop();
    await vi.advanceTimersByTimeAsync(90_000);
    await stopped;
  });

  it("continue après une erreur", async () => {
    const onError = vi.fn();
    let calls = 0;
    const ticker = startTicker(async () => {
      calls++;
      throw new Error("boom");
    }, onError);

    await vi.advanceTimersByTimeAsync(30_000 + 60_000);
    expect(calls).toBe(2);
    expect(onError).toHaveBeenCalledTimes(2);

    await ticker.stop();
  });

  it("stop() attend la fin du tick en cours puis n'en lance plus", async () => {
    let finished = false;
    const task = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5_000));
      finished = true;
    });
    const ticker = startTicker(task);

    await vi.advanceTimersByTimeAsync(30_000);
    const stopped = ticker.stop();
    await vi.advanceTimersByTimeAsync(5_000);
    await stopped;
    expect(finished).toBe(true);

    await vi.advanceTimersByTimeAsync(180_000);
    expect(task).toHaveBeenCalledTimes(1);
  });
});
