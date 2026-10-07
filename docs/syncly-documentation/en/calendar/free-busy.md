---
description: See when a teammate is busy without seeing what their events are.
---

# Free/busy

Free/busy shows when someone in your workspace is busy, so you can find a time that works without exchanging messages.

{% hint style="info" %}
Free/busy only returns start and end times. It never includes event titles, descriptions, locations, attendees, or calendar names.
{% endhint %}

You don't need to be a member of a teammate's calendars to see their free/busy. Use [Sharing](sharing.md) when someone needs to see event details.

### What counts as busy

Busy blocks come from every calendar your teammate owns or is a member of. Syncly expands recurring events for the requested range.

Free/busy differs from [booking link](booking-links.md) slots in two ways:

* Syncly doesn't add your teammate's buffer. Buffers only apply to booking links.
* Free/busy doesn't use your teammate's weekly [availability](availability.md) windows. Time outside those windows shows as free unless an event covers it.

### Endpoints

#### `GET /users/:id/free-busy`

Returns the busy blocks for a user in your workspace. Use `me` as the `:id` to get your own.

This endpoint needs an `Authorization: Bearer <token>` header.

**Query parameters**

The request takes two required parameters:

* `from`: the start of the range, as an ISO 8601 timestamp.
* `to`: the end of the range, as an ISO 8601 timestamp. It must be after `from`, and the range can't be longer than 31 days.

**Responses:**

* `200 OK` with the user's ID, time zone, the range, and a `busy` list of `startAt` and `endAt` pairs in UTC.
* `400 Bad Request` if `from` or `to` is missing, isn't a valid timestamp, or is in the wrong order, or the range is longer than 31 days.
* `401 Unauthorized` if the bearer token is missing or invalid.
* `404 Not Found` if the user doesn't exist.

**Example**

Get a teammate's busy times for one day:

```bash
curl -X GET 'https://api.syncly.example/users/user-1/free-busy?from=2026-10-06T00:00:00Z&to=2026-10-07T00:00:00Z' \
  -H 'Authorization: Bearer <token>'
```

The response looks like this:

```json
{
  "userId": "user-1",
  "timezone": "America/New_York",
  "from": "2026-10-06T00:00:00.000Z",
  "to": "2026-10-07T00:00:00.000Z",
  "busy": [
    { "startAt": "2026-10-06T15:00:00.000Z", "endAt": "2026-10-06T16:30:00.000Z" }
  ]
}
```

Errors return a JSON body in the form `{ "error": "<message>" }`.
