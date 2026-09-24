export interface Ticker {
  stop(): Promise<void>;
}

export function msUntilNextMinute(now: Date): number {
  return 60_000 - (now.getTime() % 60_000);
}

// Lance `task` au début de chaque minute. Un tick encore en cours fait sauter le suivant.
export function startTicker(
  task: (now: Date) => Promise<void>,
  onError: (error: unknown) => void = console.error,
): Ticker {
  let timer: NodeJS.Timeout | undefined;
  let running: Promise<void> | undefined;
  let stopped = false;

  const schedule = () => {
    if (!stopped) timer = setTimeout(tick, msUntilNextMinute(new Date()));
  };

  const tick = () => {
    if (!running) {
      const now = new Date();
      running = Promise.resolve()
        .then(() => task(now))
        .catch(onError)
        .finally(() => {
          running = undefined;
        });
    }
    schedule();
  };

  schedule();

  return {
    async stop() {
      stopped = true;
      clearTimeout(timer);
      await running;
    },
  };
}
