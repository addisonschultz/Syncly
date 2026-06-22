import type { Context, Next } from "hono";

// Any request with this token is authenticated as user-1 (Alex Rivera)
export const MOCK_TOKEN = "syncly-mock-token";
export const MOCK_USER_ID = "user-1";

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || authHeader !== `Bearer ${MOCK_TOKEN}`) {
    return c.json({ error: "Unauthorized. Use: Authorization: Bearer syncly-mock-token" }, 401);
  }

  c.set("userId", MOCK_USER_ID);
  await next();
}
