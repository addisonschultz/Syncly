import { Hono } from "hono";
import { bookingLinks, bookings, calendars, events, users } from "../data/seed.js";
import type { Booking, BookingDuration, BookingLink, Event } from "../types/index.js";
import { getSettings, openSlots, userTimezone } from "../lib/availability.js";

const DURATIONS: BookingDuration[] = [15, 30, 45, 60];
const SLUG = /^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])?$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------------------
// Authenticated: manage your own booking links
// ---------------------------------------------------------------------------

export const bookingLinksRoute = new Hono<{ Variables: { userId: string } }>();

function publicUrl(link: BookingLink) {
  return `/book/${link.slug}`;
}

function present(link: BookingLink) {
  return { ...link, url: publicUrl(link) };
}

// GET /booking-links — list the caller's links
bookingLinksRoute.get("/", (c) => {
  const userId = c.get("userId");
  return c.json(bookingLinks.filter((l) => l.ownerId === userId).map(present));
});

// POST /booking-links — create a link
bookingLinksRoute.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<
    Pick<BookingLink, "slug" | "title" | "calendarId"> & Partial<Pick<BookingLink, "description" | "durationMinutes" | "active">>
  >();

  if (!body.slug || !body.title || !body.calendarId) {
    return c.json({ error: "slug, title, and calendarId are required" }, 400);
  }
  if (!SLUG.test(body.slug)) {
    return c.json({ error: "slug must be 1–50 lowercase letters, numbers or hyphens, and cannot start or end with a hyphen" }, 400);
  }
  if (bookingLinks.some((l) => l.slug === body.slug)) {
    return c.json({ error: `slug "${body.slug}" is already taken` }, 409);
  }
  const duration = body.durationMinutes ?? 30;
  if (!DURATIONS.includes(duration)) {
    return c.json({ error: "durationMinutes must be one of 15, 30, 45, 60" }, 400);
  }
  const cal = calendars.find((cal) => cal.id === body.calendarId);
  if (!cal) return c.json({ error: "Calendar not found" }, 404);
  const canWrite = cal.ownerId === userId || cal.members.some((m) => m.userId === userId && m.role === "editor");
  if (!canWrite) return c.json({ error: "You need editor access to the calendar that receives bookings" }, 403);

  const link: BookingLink = {
    id: `link-${Date.now()}`,
    ownerId: userId,
    calendarId: body.calendarId,
    slug: body.slug,
    title: body.title,
    description: body.description,
    durationMinutes: duration,
    active: body.active ?? true,
    createdAt: new Date().toISOString(),
  };
  bookingLinks.push(link);
  return c.json(present(link), 201);
});

// GET /booking-links/:id
bookingLinksRoute.get("/:id", (c) => {
  const userId = c.get("userId");
  const link = bookingLinks.find((l) => l.id === c.req.param("id"));
  if (!link || link.ownerId !== userId) return c.json({ error: "Booking link not found" }, 404);
  const linkBookings = bookings.filter((b) => b.bookingLinkId === link.id);
  return c.json({ ...present(link), bookings: linkBookings });
});

// PATCH /booking-links/:id — update title, description, duration, active, calendar
bookingLinksRoute.patch("/:id", async (c) => {
  const userId = c.get("userId");
  const link = bookingLinks.find((l) => l.id === c.req.param("id"));
  if (!link || link.ownerId !== userId) return c.json({ error: "Booking link not found" }, 404);

  const body = await c.req.json<Partial<Pick<BookingLink, "title" | "description" | "durationMinutes" | "active" | "calendarId">>>();
  if (body.durationMinutes !== undefined && !DURATIONS.includes(body.durationMinutes)) {
    return c.json({ error: "durationMinutes must be one of 15, 30, 45, 60" }, 400);
  }
  if (body.calendarId !== undefined && !calendars.some((cal) => cal.id === body.calendarId)) {
    return c.json({ error: "Calendar not found" }, 404);
  }
  if (body.title !== undefined) link.title = body.title;
  if (body.description !== undefined) link.description = body.description;
  if (body.durationMinutes !== undefined) link.durationMinutes = body.durationMinutes;
  if (body.active !== undefined) link.active = body.active;
  if (body.calendarId !== undefined) link.calendarId = body.calendarId;
  return c.json(present(link));
});

// DELETE /booking-links/:id — existing bookings and their events are kept
bookingLinksRoute.delete("/:id", (c) => {
  const userId = c.get("userId");
  const idx = bookingLinks.findIndex((l) => l.id === c.req.param("id"));
  if (idx === -1 || bookingLinks[idx].ownerId !== userId) return c.json({ error: "Booking link not found" }, 404);
  bookingLinks.splice(idx, 1);
  return c.body(null, 204);
});

// ---------------------------------------------------------------------------
// Public: what an invitee sees at /book/:slug — no auth
// ---------------------------------------------------------------------------

export const publicBookingRoute = new Hono();

function findActiveLink(slug: string) {
  const link = bookingLinks.find((l) => l.slug === slug);
  return link && link.active ? link : undefined;
}

// GET /book/:slug?date=YYYY-MM-DD — link details plus open slots for that day
publicBookingRoute.get("/:slug", (c) => {
  const link = findActiveLink(c.req.param("slug"));
  if (!link) return c.json({ error: "This booking link is not available" }, 404);

  const owner = users.find((u) => u.id === link.ownerId);
  const settings = getSettings(link.ownerId);
  const date = c.req.query("date");
  if (date !== undefined && !DATE.test(date)) return c.json({ error: "date must be YYYY-MM-DD" }, 400);

  return c.json({
    slug: link.slug,
    title: link.title,
    description: link.description,
    durationMinutes: link.durationMinutes,
    host: { name: owner?.name, timezone: userTimezone(link.ownerId) },
    maxDaysAhead: settings.maxDaysAhead,
    date: date ?? null,
    slots: date ? openSlots(link.ownerId, date, link.durationMinutes) : [],
  });
});

// POST /book/:slug — confirm a slot; writes an event to the link's calendar
publicBookingRoute.post("/:slug", async (c) => {
  const link = findActiveLink(c.req.param("slug"));
  if (!link) return c.json({ error: "This booking link is not available" }, 404);

  const body = await c.req.json<{ startAt: string; inviteeName: string; inviteeEmail: string; notes?: string }>();
  if (!body.startAt || !body.inviteeName || !body.inviteeEmail) {
    return c.json({ error: "startAt, inviteeName, and inviteeEmail are required" }, 400);
  }
  const start = new Date(body.startAt);
  if (Number.isNaN(start.getTime())) return c.json({ error: "startAt must be an ISO 8601 timestamp" }, 400);

  // Re-check the slot at booking time so two invitees can't take the same one.
  const tz = userTimezone(link.ownerId);
  const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(start);
  const stillOpen = openSlots(link.ownerId, localDate, link.durationMinutes).some((s) => s.startAt === start.toISOString());
  if (!stillOpen) return c.json({ error: "That slot is no longer available" }, 409);

  const end = new Date(start.getTime() + link.durationMinutes * 60_000);
  const owner = users.find((u) => u.id === link.ownerId);
  const event: Event = {
    id: `evt-${Date.now()}`,
    calendarId: link.calendarId,
    title: `${link.title} — ${body.inviteeName}`,
    description: body.notes,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    attendees: [owner?.email, body.inviteeEmail].filter((e): e is string => Boolean(e)),
    reminders: [{ minutes: 15 }],
    createdAt: new Date().toISOString(),
  };
  events.push(event);

  const booking: Booking = {
    id: `bkg-${Date.now()}`,
    bookingLinkId: link.id,
    eventId: event.id,
    inviteeName: body.inviteeName,
    inviteeEmail: body.inviteeEmail,
    startAt: event.startAt,
    endAt: event.endAt,
    createdAt: event.createdAt,
  };
  bookings.push(booking);

  return c.json({ ...booking, host: { name: owner?.name, timezone: tz } }, 201);
});
