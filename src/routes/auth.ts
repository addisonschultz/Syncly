import { Hono } from "hono";
import { MOCK_TOKEN } from "../middleware/auth.js";

const auth = new Hono();

// POST /auth/login — accepts any email/password and returns the mock token
auth.post("/login", async (c) => {
  const body = await c.req.json<{ email: string; password: string }>();

  if (!body.email || !body.password) {
    return c.json({ error: "email and password are required" }, 400);
  }

  return c.json({
    token: MOCK_TOKEN,
    tokenType: "Bearer",
    note: "This is a mock token. Use it in the Authorization header for all protected routes.",
  });
});

export default auth;
