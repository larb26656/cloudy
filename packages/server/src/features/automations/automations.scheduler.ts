import type { AutomationsService } from "./automations.service";
import type { AutomationInput } from "./automations.model";

type Schedule = NonNullable<AutomationInput["schedule"]>;

function fieldMatches(field: string, value: number, max: number) {
  return field.split(",").some((part) => {
    const [range = "*", stepText] = part.split("/");
    const step = stepText ? Number(stepText) : 1;
    if (range === "*") return value % step === 0;
    const [startText, endText] = range.split("-");
    const startValue = Number(startText);
    const endValue = endText === undefined ? startValue : Number(endText);
    const start = max === 7 && startValue === 0 ? 7 : startValue;
    const end = max === 7 && endValue === 0 ? 7 : endValue;
    const normalizedValue = max === 7 && value === 0 ? 7 : value;
    return (
      normalizedValue >= start &&
      normalizedValue <= end &&
      (normalizedValue - start) % step === 0
    );
  });
}

function localParts(date: Date, timezone: string) {
  const values = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    minute: "numeric",
    hour: "numeric",
    day: "numeric",
    month: "numeric",
    weekday: "short",
    year: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: string) =>
    values.find((item) => item.type === type)!.value;
  return {
    minute: Number(part("minute")),
    hour: Number(part("hour")),
    day: Number(part("day")),
    month: Number(part("month")),
    year: Number(part("year")),
    weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
      part("weekday"),
    ),
  };
}

export function cronMatches(cron: string, date: Date, timezone: string) {
  const fields = cron.trim().split(/\s+/);
  if (fields.length !== 5) return false;
  const parts = localParts(date, timezone);
  const minute = fieldMatches(fields[0]!, parts.minute, 59);
  const hour = fieldMatches(fields[1]!, parts.hour, 23);
  const day = fieldMatches(fields[2]!, parts.day, 31);
  const month = fieldMatches(fields[3]!, parts.month, 12);
  const weekday = fieldMatches(fields[4]!, parts.weekday, 7);
  const dayWildcard = fields[2]!.startsWith("*");
  const weekdayWildcard = fields[4]!.startsWith("*");
  return (
    minute &&
    hour &&
    month &&
    (dayWildcard || weekdayWildcard ? day && weekday : day || weekday)
  );
}

export function nextCronOccurrences(
  cron: string,
  timezone: string,
  after: Date,
  count = 3,
) {
  const occurrences: Date[] = [];
  const seen = new Set<string>();
  const start = Math.floor(after.getTime() / 60_000) * 60_000 + 60_000;
  for (
    let timestamp = start;
    timestamp < start + 2 * 366 * 24 * 60 * 60_000 &&
    occurrences.length < count;
    timestamp += 60_000
  ) {
    const candidate = new Date(timestamp);
    if (!cronMatches(cron, candidate, timezone)) continue;
    const parts = localParts(candidate, timezone);
    const key = `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
    if (seen.has(key)) continue;
    seen.add(key);
    occurrences.push(candidate);
  }
  return occurrences;
}

export function canonicalCronSlot(cron: string, timezone: string, date: Date) {
  const target = localParts(date, timezone);
  let earliest = date;
  for (
    let timestamp = date.getTime() - 60_000;
    timestamp >= date.getTime() - 3 * 60 * 60_000;
    timestamp -= 60_000
  ) {
    const candidate = new Date(timestamp);
    const parts = localParts(candidate, timezone);
    if (
      parts.year === target.year &&
      parts.month === target.month &&
      parts.day === target.day &&
      parts.hour === target.hour &&
      parts.minute === target.minute &&
      cronMatches(cron, candidate, timezone)
    ) {
      earliest = candidate;
    }
  }
  return earliest;
}

export function createAutomationsScheduler(
  service: AutomationsService,
  options: { now?: () => Date; intervalMs?: number } = {},
) {
  const now = options.now ?? (() => new Date());
  const intervalMs = options.intervalMs ?? 1_000;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let lastMinute = Math.floor(now().getTime() / 60_000);

  const tick = async () => {
    if (!running) return;
    const current = now();
    const minute = Math.floor(current.getTime() / 60_000);
    if (minute > lastMinute) {
      lastMinute = minute;
      for (const automation of service.list()) {
        const schedule = automation.schedule as Schedule | null;
        if (
          schedule?.enabled &&
          cronMatches(schedule.cron, current, schedule.timezone)
        ) {
          await service.start(
            automation.id,
            "schedule",
            canonicalCronSlot(schedule.cron, schedule.timezone, current),
          );
        }
      }
    }
    timer = setTimeout(() => void tick(), intervalMs);
  };

  return {
    start() {
      if (running) return;
      running = true;
      lastMinute = Math.floor(now().getTime() / 60_000);
      timer = setTimeout(() => void tick(), intervalMs);
    },
    async stop() {
      running = false;
      if (timer) clearTimeout(timer);
      timer = undefined;
      await service.stopOwnedRuns();
    },
    preview(cron: string, timezone: string, after = now()) {
      return nextCronOccurrences(cron, timezone, after, 3);
    },
  };
}

export type AutomationsScheduler = ReturnType<
  typeof createAutomationsScheduler
>;
