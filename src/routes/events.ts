import { Hono } from "hono";
import { events, calendars } from "../data/seed.js";
import type { Event } from "../types/index.js";

const eventsRoute = new Hono<{ Variables: { userId: string } }>();

function canAccessCalendar(userId: string, calendarId: string) {
  const cal = calendars.find((c) => c.id === calendarId);
  if (!cal) return false;
  return cal.ownerId === userId || cal.members.some((m) => m.userId === userId);
}

function canEditCalendar(userId: string, calendarId: string) {
  const cal = calendars.find((c) => c.id === calendarId);
  if (!cal) return false;
  if (cal.ownerId === userId) return true;
  const member = cal.members.find((m) => m.userId === userId);
  return member?.role === "editor";
}

// GET /calendars/:calendarId/events — list events in a calendar
eventsRoute.get("/calendars/:calendarId/events", (c) => {
  const userId = c.get("userId");
  const { calendarId } = c.req.param();

  if (!canAccessCalendar(userId, calendarId)) return c.json({ error: "Forbidden" }, 403);

  const calEvents = events.filter((e) => e.calendarId === calendarId);
  return c.json(calEvents);
});

// GET /events/:id
eventsRoute.get("/:id", (c) => {
  const userId = c.get("userId");
  const event = events.find((e) => e.id === c.req.param("id"));
  if (!event) return c.json({ error: "Event not found" }, 404);
  if (!canAccessCalendar(userId, event.calendarId)) return c.json({ error: "Forbidden" }, 403);
  return c.json(event);
});

// POST /events — create an event
eventsRoute.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<
    Pick<Event, "calendarId" | "title" | "startAt" | "endAt"> &
      Partial<Pick<Event, "description" | "location" | "attendees" | "reminders" | "recurring">>
  >();

  if (!body.calendarId || !body.title || !body.startAt || !body.endAt) {
    return c.json({ error: "calendarId, title, startAt, and endAt are required" }, 400);
  }

  if (!canEditCalendar(userId, body.calendarId)) return c.json({ error: "Forbidden" }, 403);

  const newEvent: Event = {
    id: `evt-${Date.now()}`,
    calendarId: body.calendarId,
    title: body.title,
    description: body.description,
    location: body.location,
    startAt: body.startAt,
    endAt: body.endAt,
    attendees: body.attendees ?? [],
    reminders: body.reminders ?? [],
    recurring: body.recurring,
    createdAt: new Date().toISOString(),
  };

  events.push(newEvent);
  return c.json(newEvent, 201);
});

// PATCH /events/:id
eventsRoute.patch("/:id", async (c) => {
  const userId = c.get("userId");
  const eventIndex = events.findIndex((e) => e.id === c.req.param("id"));
  if (eventIndex === -1) return c.json({ error: "Event not found" }, 404);

  const event = events[eventIndex];
  if (!canEditCalendar(userId, event.calendarId)) return c.json({ error: "Forbidden" }, 403);

  const body = await c.req.json<
    Partial<Pick<Event, "title" | "description" | "location" | "startAt" | "endAt" | "attendees" | "reminders" | "recurring">>
  >();

  Object.assign(event, body);
  return c.json(event);
});

// DELETE /events/:id
eventsRoute.delete("/:id", (c) => {
  const userId = c.get("userId");
  const eventIndex = events.findIndex((e) => e.id === c.req.param("id"));
  if (eventIndex === -1) return c.json({ error: "Event not found" }, 404);

  const event = events[eventIndex];
  if (!canEditCalendar(userId, event.calendarId)) return c.json({ error: "Forbidden" }, 403);

  events.splice(eventIndex, 1);
  return c.json({ message: "Event deleted" });
});

export default eventsRoute;
