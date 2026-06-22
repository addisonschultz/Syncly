import { Hono } from "hono";
import { users } from "../data/seed.js";

const usersRoute = new Hono<{ Variables: { userId: string } }>();

// GET /users/me
usersRoute.get("/me", (c) => {
  const userId = c.get("userId");
  const user = users.find((u) => u.id === userId);
  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json(user);
});

// PATCH /users/me
usersRoute.patch("/me", async (c) => {
  const userId = c.get("userId");
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) return c.json({ error: "User not found" }, 404);

  const body = await c.req.json<Partial<Pick<(typeof users)[0], "name" | "timezone" | "integrations">>>();
  const user = users[userIndex];

  if (body.name !== undefined) user.name = body.name;
  if (body.timezone !== undefined) user.timezone = body.timezone;
  if (body.integrations !== undefined) {
    user.integrations = { ...user.integrations, ...body.integrations };
  }

  return c.json(user);
});

// GET /users — list all users (useful for looking up IDs when sharing calendars)
usersRoute.get("/", (c) => {
  return c.json(users.map(({ id, name, email }) => ({ id, name, email })));
});

export default usersRoute;
