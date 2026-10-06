import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { authMiddleware } from "./middleware/auth.js";
import authRoute from "./routes/auth.js";
import usersRoute from "./routes/users.js";
import calendarsRoute from "./routes/calendars.js";
import eventsRoute from "./routes/events.js";
import notificationsRoute from "./routes/notifications.js";
import tasksRoute from "./routes/tasks.js";
import availabilityRoute from "./routes/availability.js";
import { bookingLinksRoute, publicBookingRoute } from "./routes/booking-links.js";

const app = new Hono();

// Health check — no auth required
app.get("/", (c) =>
  c.json({
    name: "Syncly API",
    version: "1.0.0",
    docs: "See the Syncly documentation for available endpoints.",
  })
);

// Public routes
app.route("/auth", authRoute);
app.route("/book", publicBookingRoute);

// Protected routes
app.use("/users/*", authMiddleware);
app.use("/calendars/*", authMiddleware);
app.use("/events/*", authMiddleware);
app.use("/notifications/*", authMiddleware);
app.use("/tasks/*", authMiddleware);
app.use("/booking-links", authMiddleware);
app.use("/booking-links/*", authMiddleware);

app.route("/users", usersRoute);
app.route("/calendars", calendarsRoute);
app.route("/events", eventsRoute);
app.route("/notifications", notificationsRoute);
app.route("/tasks", tasksRoute);
app.route("/users", availabilityRoute); // /users/me/availability, /users/:id/free-busy
app.route("/booking-links", bookingLinksRoute);

// Mount calendar-scoped event listing under /calendars
app.use("/calendars/:calendarId/events", authMiddleware);
app.route("/", eventsRoute);

const PORT = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Syncly API running on http://localhost:${PORT}`);
  console.log(`\nMock token: syncly-mock-token`);
  console.log(`Usage: Authorization: Bearer syncly-mock-token`);
});
