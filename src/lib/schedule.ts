export interface ScheduleRule {
  frequency: "daily" | "weekly";
  weekday: number | null; // 0 = dimanche … 6 = samedi
  hour: number; // 0-23, heure locale
}

interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
}

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function localParts(date: Date, timeZone: string): LocalParts {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      weekday: "short",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: weekdays.indexOf(parts.weekday),
  };
}

// Instant UTC correspondant à une heure locale dans `timeZone` (heure inexistante au passage à l'heure d'été : décalée).
export function zonedToUtc(year: number, month: number, day: number, hour: number, timeZone: string): Date {
  const target = Date.UTC(year, month - 1, day, hour);
  let guess = target;
  for (let i = 0; i < 3; i++) {
    const p = localParts(new Date(guess), timeZone);
    const diff = target - Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    if (diff === 0) break;
    guess += diff;
  }
  return new Date(guess);
}

// Prochaine exécution strictement après `now`.
export function nextRunAt(rule: ScheduleRule, timeZone: string, now: Date): Date {
  const today = localParts(now, timeZone);
  for (let offset = 0; offset <= 7; offset++) {
    const day = new Date(Date.UTC(today.year, today.month - 1, today.day + offset));
    if (rule.frequency === "weekly" && day.getUTCDay() !== rule.weekday) continue;
    const candidate = zonedToUtc(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), rule.hour, timeZone);
    if (candidate > now) return candidate;
  }
  throw new Error("Aucune exécution trouvée sur 8 jours");
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}
