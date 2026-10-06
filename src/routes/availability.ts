import { Hono } from "hono";
import { users } from "../data/seed.js";
import type { AvailabilitySettings, AvailabilityWindow, Weekday } from "../types/index.js";
import { busyBlocks, getSettings, userTimezone } from "../lib/availability.js";

const availabilityRoute = new Hono<{ Variables: { userId: string } }>();

const WEEKDAYS: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

function validateWindows(windows: unknown): string | null {
  if (!Array.isArray(windows)) return "windows must be an array";
  for (const w of windows as AvailabilityWindow[]) {
    if (!WEEKDAYS.includes(w.day)) return `invalid day "${w.day}" — use mon…sun`;
    if (!HHMM.test(w.start) || !HHMM.test(w.end)) return "start and end must be HH:MM (24-hour)";
    if (w.start >= w.end) return `window ${w.day} ${w.start}–${w.end} must end after it starts`;
  }
  return null;
}

// GET /users/me/availability — the caller's availability settings
availabilityRoute.get("/me/availability", (c) => {
  const userId = c.get("userId");
  return c.json({ ...getSettings(userId), timezone: userTimezone(userId) });
});

// PUT /users/me/availability — replace availability settings
availabilityRoute.put("/me/availability", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<Partial<Pick<AvailabilitySettings, "windows" | "bufferMinutes" | "minNoticeMinutes" | "maxDaysAhead">>>();
  const settings = getSettings(userId);

  if (body.windows !== undefined) {
    const err = validateWindows(body.windows);
    if (err) return c.json({ error: err }, 400);
    settings.windows = body.windows;
  }
  for (const key of ["bufferMinutes", "minNoticeMinutes", "maxDaysAhead"] as const) {
    const v = body[key];
    if (v === undefined) continue;
    if (!Number.isInteger(v) || v < 0) return c.json({ error: `${key} must be a non-negative integer` }, 400);
    settings[key] = v;
  }
  if (settings.maxDaysAhead > 365) return c.json({ error: "maxDaysAhead cannot exceed 365" }, 400);

  settings.updatedAt = new Date().toISOString();
  return c.json({ ...settings, timezone: userTimezone(userId) });
});

// GET /users/:id/free-busy?from=ISO&to=ISO — busy blocks only, no event details
availabilityRoute.get("/:id/free-busy", (c) => {
  const callerId = c.get("userId");
  const targetId = c.req.param("id") === "me" ? callerId : c.req.param("id");
  const target = users.find((u) => u.id === targetId);
  if (!target) return c.json({ error: "User not found" }, 404);

  const { from, to } = c.req.query();
  if (!from || !to) return c.json({ error: "from and to are required (ISO 8601)" }, 400);
  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate >= toDate) {
    return c.json({ error: "from must be an ISO 8601 date before to" }, 400);
  }
  if (toDate.getTime() - fromDate.getTime() > 31 * 86_400_000) {
    return c.json({ error: "Range cannot exceed 31 days" }, 400);
  }

  // Other users only ever see busy/free — never titles, locations or attendees.
  const blocks = busyBlocks(targetId, fromDate, toDate).filter((b) => b.source !== "buffer");
  return c.json({
    userId: targetId,
    timezone: target.timezone,
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
    busy: blocks.map(({ startAt, endAt }) => ({ startAt, endAt })),
  });
});

export default availabilityRoute;
