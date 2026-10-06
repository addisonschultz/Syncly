import { calendars, events, bookings, availabilitySettings, users } from "../data/seed.js";
import type { AvailabilitySettings, BusyBlock, Weekday } from "../types/index.js";

const WEEKDAYS: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export const DEFAULT_SETTINGS: Omit<AvailabilitySettings, "userId" | "updatedAt"> = {
  windows: [
    { day: "mon", start: "09:00", end: "17:00" },
    { day: "tue", start: "09:00", end: "17:00" },
    { day: "wed", start: "09:00", end: "17:00" },
    { day: "thu", start: "09:00", end: "17:00" },
    { day: "fri", start: "09:00", end: "17:00" },
  ],
  bufferMinutes: 0,
  minNoticeMinutes: 60,
  maxDaysAhead: 60,
};

export function getSettings(userId: string): AvailabilitySettings {
  const existing = availabilitySettings.find((s) => s.userId === userId);
  if (existing) return existing;
  const created: AvailabilitySettings = { userId, ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() };
  availabilitySettings.push(created);
  return created;
}

export function userTimezone(userId: string): string {
  return users.find((u) => u.id === userId)?.timezone ?? "UTC";
}

/** Offset of `tz` from UTC, in minutes, at the given instant. */
function tzOffsetMinutes(at: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return (asUtc - at.getTime()) / 60_000;
}

/** Turn a wall-clock time ("YYYY-MM-DD" + "HH:MM") in `tz` into a UTC Date. */
export function zonedToUtc(date: string, hhmm: string, tz: string): Date {
  const guess = new Date(`${date}T${hhmm}:00Z`);
  const offset = tzOffsetMinutes(guess, tz);
  return new Date(guess.getTime() - offset * 60_000);
}

export function weekdayOf(date: string, tz: string): Weekday {
  const noon = zonedToUtc(date, "12:00", tz);
  const name = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(noon).toLowerCase();
  return WEEKDAYS.find((d) => name.startsWith(d)) ?? "mon";
}

/** Every calendar the user can see, owned or shared. */
export function visibleCalendarIds(userId: string): string[] {
  return calendars
    .filter((c) => c.ownerId === userId || c.members.some((m) => m.userId === userId))
    .map((c) => c.id);
}

/**
 * Busy blocks for a user between two instants. Recurring events are
 * expanded for the requested range; buffers are added around bookings.
 */
export function busyBlocks(userId: string, from: Date, to: Date, bufferMinutes = 0): BusyBlock[] {
  const calIds = visibleCalendarIds(userId);
  const blocks: BusyBlock[] = [];

  for (const ev of events.filter((e) => calIds.includes(e.calendarId))) {
    const duration = new Date(ev.endAt).getTime() - new Date(ev.startAt).getTime();
    let start = new Date(ev.startAt);
    const until = ev.recurring?.until ? new Date(ev.recurring.until) : to;
    const step = ev.recurring?.frequency;

    while (start < to && start <= until) {
      const end = new Date(start.getTime() + duration);
      if (end > from) {
        const isBooking = bookings.some((b) => b.eventId === ev.id);
        blocks.push({ startAt: start.toISOString(), endAt: end.toISOString(), source: isBooking ? "booking" : "event" });
        if (bufferMinutes > 0) {
          blocks.push({
            startAt: new Date(start.getTime() - bufferMinutes * 60_000).toISOString(),
            endAt: new Date(end.getTime() + bufferMinutes * 60_000).toISOString(),
            source: "buffer",
          });
        }
      }
      if (!step) break;
      if (step === "daily") start = new Date(start.getTime() + 86_400_000);
      else if (step === "weekly") start = new Date(start.getTime() + 7 * 86_400_000);
      else start = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate(), start.getUTCHours(), start.getUTCMinutes()));
    }
  }

  return blocks.sort((a, b) => a.startAt.localeCompare(b.startAt));
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Open slots of `durationMinutes` for a user on a given calendar date,
 * honoring their availability windows, buffers, notice period and horizon.
 */
export function openSlots(userId: string, date: string, durationMinutes: number, now = new Date()) {
  const settings = getSettings(userId);
  const tz = userTimezone(userId);
  const day = weekdayOf(date, tz);
  const dayStart = zonedToUtc(date, "00:00", tz);
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);

  const earliest = new Date(now.getTime() + settings.minNoticeMinutes * 60_000);
  const horizon = new Date(now.getTime() + settings.maxDaysAhead * 86_400_000);
  if (dayEnd <= earliest || dayStart >= horizon) return [];

  const busy = busyBlocks(userId, dayStart, dayEnd, settings.bufferMinutes).map((b) => ({
    start: new Date(b.startAt),
    end: new Date(b.endAt),
  }));

  const slots: { startAt: string; endAt: string }[] = [];
  const stepMs = durationMinutes * 60_000;

  for (const win of settings.windows.filter((w) => w.day === day)) {
    const winStart = zonedToUtc(date, win.start, tz);
    const winEnd = zonedToUtc(date, win.end, tz);
    for (let s = winStart.getTime(); s + stepMs <= winEnd.getTime(); s += stepMs) {
      const slotStart = new Date(s);
      const slotEnd = new Date(s + stepMs);
      if (slotStart < earliest || slotStart >= horizon) continue;
      if (busy.some((b) => overlaps(slotStart, slotEnd, b.start, b.end))) continue;
      slots.push({ startAt: slotStart.toISOString(), endAt: slotEnd.toISOString() });
    }
  }
  return slots;
}
