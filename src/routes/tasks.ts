import { Hono } from "hono";
import { tasks, calendars } from "../data/seed.js";
import type { Task } from "../types/index.js";

const tasksRoute = new Hono<{ Variables: { userId: string } }>();

// GET /tasks — list the current user's tasks
// Optional query params: ?calendarId=cal-1&completed=true|false
tasksRoute.get("/", (c) => {
  const userId = c.get("userId");
  const { calendarId, completed } = c.req.query();

  let result = tasks.filter((t) => t.userId === userId);

  if (calendarId !== undefined) {
    result = result.filter((t) => t.calendarId === calendarId);
  }

  if (completed !== undefined) {
    const isDone = completed === "true";
    result = result.filter((t) => t.completed === isDone);
  }

  return c.json(result);
});

// POST /tasks — create a task
tasksRoute.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<
    Pick<Task, "title"> & Partial<Pick<Task, "calendarId" | "notes" | "dueAt">>
  >();

  if (!body.title) return c.json({ error: "title is required" }, 400);

  if (body.calendarId) {
    const cal = calendars.find((cal) => cal.id === body.calendarId);
    const hasAccess =
      cal && (cal.ownerId === userId || cal.members.some((m) => m.userId === userId));
    if (!hasAccess) return c.json({ error: "Calendar not found or access denied" }, 403);
  }

  const newTask: Task = {
    id: `task-${Date.now()}`,
    userId,
    calendarId: body.calendarId,
    title: body.title,
    notes: body.notes,
    dueAt: body.dueAt,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  tasks.push(newTask);
  return c.json(newTask, 201);
});

// GET /tasks/:id
tasksRoute.get("/:id", (c) => {
  const userId = c.get("userId");
  const task = tasks.find((t) => t.id === c.req.param("id"));
  if (!task) return c.json({ error: "Task not found" }, 404);
  if (task.userId !== userId) return c.json({ error: "Forbidden" }, 403);
  return c.json(task);
});

// PATCH /tasks/:id — update fields or mark complete/incomplete
tasksRoute.patch("/:id", async (c) => {
  const userId = c.get("userId");
  const task = tasks.find((t) => t.id === c.req.param("id"));
  if (!task) return c.json({ error: "Task not found" }, 404);
  if (task.userId !== userId) return c.json({ error: "Forbidden" }, 403);

  const body = await c.req.json<
    Partial<Pick<Task, "title" | "notes" | "dueAt" | "calendarId" | "completed">>
  >();

  if (body.title !== undefined) task.title = body.title;
  if (body.notes !== undefined) task.notes = body.notes;
  if (body.dueAt !== undefined) task.dueAt = body.dueAt;
  if (body.calendarId !== undefined) task.calendarId = body.calendarId;

  if (body.completed !== undefined && body.completed !== task.completed) {
    task.completed = body.completed;
    task.completedAt = body.completed ? new Date().toISOString() : undefined;
  }

  return c.json(task);
});

// DELETE /tasks/:id
tasksRoute.delete("/:id", (c) => {
  const userId = c.get("userId");
  const index = tasks.findIndex((t) => t.id === c.req.param("id"));
  if (index === -1) return c.json({ error: "Task not found" }, 404);
  if (tasks[index].userId !== userId) return c.json({ error: "Forbidden" }, 403);

  tasks.splice(index, 1);
  return c.json({ message: "Task deleted" });
});

export default tasksRoute;
