---
description: See when a teammate is busy without seeing their event details.
---

# Free/busy

### Check a teammate's availability

Free/busy shows you the times a workspace member is busy, and nothing else. Titles, locations, attendees, and calendar names are never included. This lets you find a time with a colleague without becoming a member of their calendars.

Busy blocks come from every calendar the other person can see. Buffers from their [availability profile](availability.md) are not applied here, because buffers are a booking concept.

You can request up to 31 days at a time. A request for 5 days returns 5 days of blocks.

### View free/busy in the calendar

In **Team view**, hover over a member's name and click **Show busy times**. Busy blocks appear as shaded time without labels. Use this as a sanity check before you propose a time.

### API

The user can query free/busy for any member of the workspace. The request needs an `Authorization: Bearer <token>` header.

| Method | Path | Description |
|---|---|---|
| `GET` | `/users/:id/free-busy?from=ISO&to=ISO` | Returns busy blocks as `startAt` and `endAt` pairs. `me` is accepted as the `:id`. |

Example: fetch one week of busy blocks for a teammate.

```bash
curl "http://localhost:3000/users/user-2/free-busy?from=2026-10-05T00:00:00Z&to=2026-10-12T00:00:00Z" \
  -H "Authorization: Bearer syncly-mock-token"
```

A missing, unparseable, or reversed `from` and `to`, or a range over 31 days, returns `400`. An unknown user returns `404`.
