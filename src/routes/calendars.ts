import { Hono } from "hono";
import { calendars } from "../data/seed.js";
import type { Calendar, CalendarMember } from "../types/index.js";

const calendarsRoute = new Hono<{ Variables: { userId: string } }>();

// GET /calendars — list calendars the current user owns or is a member of
calendarsRoute.get("/", (c) => {
  const userId = c.get("userId");
  const visible = calendars.filter(
    (cal) => cal.ownerId === userId || cal.members.some((m) => m.userId === userId)
  );
  return c.json(visible);
});

// POST /calendars — create a new calendar
calendarsRoute.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<Pick<Calendar, "name" | "color" | "visibility">>();

  if (!body.name) return c.json({ error: "name is required" }, 400);

  const newCal: Calendar = {
    id: `cal-${Date.now()}`,
    ownerId: userId,
    name: body.name,
    color: body.color ?? "#4A90D9",
    visibility: body.visibility ?? "personal",
    members: [],
    createdAt: new Date().toISOString(),
  };

  calendars.push(newCal);
  return c.json(newCal, 201);
});

// GET /calendars/:id
calendarsRoute.get("/:id", (c) => {
  const cal = calendars.find((cal) => cal.id === c.req.param("id"));
  if (!cal) return c.json({ error: "Calendar not found" }, 404);
  return c.json(cal);
});

// PATCH /calendars/:id
calendarsRoute.patch("/:id", async (c) => {
  const userId = c.get("userId");
  const cal = calendars.find((cal) => cal.id === c.req.param("id"));
  if (!cal) return c.json({ error: "Calendar not found" }, 404);
  if (cal.ownerId !== userId) return c.json({ error: "Forbidden" }, 403);

  const body = await c.req.json<Partial<Pick<Calendar, "name" | "color" | "visibility">>>();
  if (body.name !== undefined) cal.name = body.name;
  if (body.color !== undefined) cal.color = body.color;
  if (body.visibility !== undefined) cal.visibility = body.visibility;

  return c.json(cal);
});

// DELETE /calendars/:id
calendarsRoute.delete("/:id", (c) => {
  const userId = c.get("userId");
  const index = calendars.findIndex((cal) => cal.id === c.req.param("id"));
  if (index === -1) return c.json({ error: "Calendar not found" }, 404);
  if (calendars[index].ownerId !== userId) return c.json({ error: "Forbidden" }, 403);

  calendars.splice(index, 1);
  return c.json({ message: "Calendar deleted" });
});

// POST /calendars/:id/share — add or update a member's role
calendarsRoute.post("/:id/share", async (c) => {
  const userId = c.get("userId");
  const cal = calendars.find((cal) => cal.id === c.req.param("id"));
  if (!cal) return c.json({ error: "Calendar not found" }, 404);
  if (cal.ownerId !== userId) return c.json({ error: "Forbidden" }, 403);

  const body = await c.req.json<CalendarMember>();
  if (!body.userId || !body.role) return c.json({ error: "userId and role are required" }, 400);

  const existing = cal.members.find((m) => m.userId === body.userId);
  if (existing) {
    existing.role = body.role;
  } else {
    cal.members.push({ userId: body.userId, role: body.role });
  }

  return c.json(cal);
});

// DELETE /calendars/:id/share/:memberId — remove a member
calendarsRoute.delete("/:id/share/:memberId", (c) => {
  const userId = c.get("userId");
  const cal = calendars.find((cal) => cal.id === c.req.param("id"));
  if (!cal) return c.json({ error: "Calendar not found" }, 404);
  if (cal.ownerId !== userId) return c.json({ error: "Forbidden" }, 403);

  const memberIndex = cal.members.findIndex((m) => m.userId === c.req.param("memberId"));
  if (memberIndex === -1) return c.json({ error: "Member not found" }, 404);

  cal.members.splice(memberIndex, 1);
  return c.json(cal);
});

export default calendarsRoute;
