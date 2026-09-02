---
description: Manage personal and calendar-linked tasks with the Tasks API.
---

# Tasks

### Tasks

Use tasks to track work alongside your calendar.

A task belongs to the current authenticated user. It can also be linked to a calendar with `calendarId`.

You can list existing tasks, create new ones, read a single task, update task details, and delete tasks you no longer need.

{% hint style="info" %}
Some demo and development environments include seeded tasks. Call `GET /tasks` to inspect existing records.
{% endhint %}

### Task fields

Each task uses these fields:

* `id`
* `userId`
* `calendarId`
* `title`
* `notes`
* `dueAt`
* `completed`
* `completedAt`
* `createdAt`

### Task workflow

Use this flow for most task operations:

1. List tasks with `GET /tasks`.
2. Create a task with `POST /tasks`.
3. Read a task with `GET /tasks/:id`.
4. Update a task with `PATCH /tasks/:id`.
5. Delete a task with `DELETE /tasks/:id`.

Tasks are always scoped to the current authenticated user.

If you pass a `calendarId` when creating a task, you must already have access to that calendar.

### Endpoints

#### `GET /tasks`

Returns the current user's tasks.

Use query parameters to filter results:

* `calendarId`
* `completed=true|false`

You can combine both filters in the same request.

**Response**

* `200 OK` with an array of task objects.

**Example**

```bash
curl -X GET 'https://api.syncly.example/tasks?calendarId=cal_123&completed=false' \
  -H 'Authorization: Bearer <token>'
```

#### `POST /tasks`

Creates a new task for the current user.

**Request rules**

* `title` is required.
* `calendarId` is optional.
* If you include `calendarId`, you must have access to that calendar.

**Response**

* `201 Created` with the created task object.

**Example**

```bash
curl -X POST 'https://api.syncly.example/tasks' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Prepare sprint review",
    "notes": "Collect release notes and screenshots.",
    "dueAt": "2026-06-30T15:00:00Z",
    "calendarId": "cal_123"
  }'
```

#### `GET /tasks/:id`

Returns a single task owned by the current user.

**Response**

* `200 OK` with the task object.
* `403 Forbidden` if the task belongs to another user.
* `404 Task not found` if the task does not exist.

#### `PATCH /tasks/:id`

Updates a task owned by the current user.

Use this endpoint to change fields like `title`, `notes`, `dueAt`, or `completed`.

**Response**

* `200 OK` with the updated task object.
* `403 Forbidden` if the task belongs to another user.
* `404 Task not found` if the task does not exist.

#### `DELETE /tasks/:id`

Deletes a task owned by the current user.

**Response**

* `204 No Content` on success.
* `403 Forbidden` if the task belongs to another user.
* `404 Task not found` if the task does not exist.

### Examples

#### Create a task

```bash
curl -X POST 'https://api.syncly.example/tasks' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Draft Q3 planning notes",
    "dueAt": "2026-07-02T09:00:00Z"
  }'
```

#### Mark a task complete

```bash
curl -X PATCH 'https://api.syncly.example/tasks/task_123' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "completed": true
  }'
```
