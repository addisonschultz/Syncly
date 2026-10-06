---
description: See when a teammate is busy without seeing what their events are.
---

# Free/busy

### Free/busy

Free/busy shows when a workspace member is busy. It only shows times.

{% hint style="info" %}
Free/busy never includes event titles, locations, attendees, or calendar names. Teammates only see when you're busy, not what you're doing.
{% endhint %}

Use it to find a time with a teammate without asking for access to their calendars. Any workspace member can check any other member.

### What counts as busy

Busy blocks come from every calendar the user owns or is a member of. Recurring events are expanded for the requested range.

Free/busy doesn't apply [availability](availability.md) buffers. Buffers only affect [booking links](booking-links.md).

### Endpoint

#### `GET /users/:id/free-busy`

Returns busy blocks for a user. Requires `Authorization: Bearer <token>`.

Use `me` as the `:id` to check your own free/busy.

**Query parameters**

* `from` is required. An ISO 8601 date or timestamp.
* `to` is required. An ISO 8601 date or timestamp after `from`.

The range can be up to 31 days.

**Response**

* `200 OK` with the user's `timezone` and a `busy` array of `startAt`/`endAt` pairs in UTC.
* `400 Bad Request` if `from` or `to` is missing or invalid, `from` isn't before `to`, or the range is over 31 days.
* `401 Unauthorized` if the bearer token is missing or invalid.
* `404 Not Found` if the user doesn't exist.

**Example**

```bash
curl -X GET 'https://api.syncly.example/users/user-2/free-busy?from=2026-10-06T00:00:00Z&to=2026-10-07T00:00:00Z' \
  -H 'Authorization: Bearer <token>'
```

```json
{
  "userId": "user-2",
  "timezone": "America/Los_Angeles",
  "from": "2026-10-06T00:00:00.000Z",
  "to": "2026-10-07T00:00:00.000Z",
  "busy": [
    { "startAt": "2026-10-06T15:00:00.000Z", "endAt": "2026-10-06T16:30:00.000Z" }
  ]
}
```

Errors return a JSON body in the form `{ "error": "<message>" }`.
