import { Hono } from "hono";
import { notificationPreferences } from "../data/seed.js";
import type { NotificationPreferences } from "../types/index.js";

const notificationsRoute = new Hono<{ Variables: { userId: string } }>();

// GET /notifications/preferences
notificationsRoute.get("/preferences", (c) => {
  const userId = c.get("userId");
  const prefs = notificationPreferences.find((p) => p.userId === userId);
  if (!prefs) return c.json({ error: "Preferences not found" }, 404);
  return c.json(prefs);
});

// PATCH /notifications/preferences
notificationsRoute.patch("/preferences", async (c) => {
  const userId = c.get("userId");
  const index = notificationPreferences.findIndex((p) => p.userId === userId);

  const body = await c.req.json<Partial<Omit<NotificationPreferences, "userId">>>();

  if (index === -1) {
    // Create default preferences if none exist
    const newPrefs: NotificationPreferences = {
      userId,
      channels: { inApp: true, email: true, sms: false },
      defaultReminderMinutes: 15,
      ...body,
    };
    notificationPreferences.push(newPrefs);
    return c.json(newPrefs, 201);
  }

  const prefs = notificationPreferences[index];
  if (body.channels !== undefined) prefs.channels = { ...prefs.channels, ...body.channels };
  if (body.defaultReminderMinutes !== undefined) prefs.defaultReminderMinutes = body.defaultReminderMinutes;
  if (body.quietHours !== undefined) prefs.quietHours = body.quietHours;

  return c.json(prefs);
});

export default notificationsRoute;
