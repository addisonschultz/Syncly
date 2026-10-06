---
description: Share a public link that lets anyone book an open time on your calendar.
---

# Booking links

### Booking links

A booking link is a public page at `/book/<slug>`. Anyone with the link can pick an open time and book it. They don't need a Syncly account.

Open slots come from your [availability profile](availability.md). Each confirmed booking becomes an [event](events.md) on the calendar you choose.

You can create more than one link. For example, a 15-minute check-in and a 60-minute demo, each on a different calendar.

### Quickstart

{% stepper %}
{% step %}
### Set your hours

Set the hours you accept bookings. This example sets Monday to Thursday from 9 AM to 5 PM, Friday until 1 PM, and a 10-minute buffer.

```bash
curl -X PUT 'https://api.syncly.example/users/me/availability' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "windows": [
      { "day": "mon", "start": "09:00", "end": "17:00" },
      { "day": "tue", "start": "09:00", "end": "17:00" },
      { "day": "wed", "start": "09:00", "end": "17:00" },
      { "day": "thu", "start": "09:00", "end": "17:00" },
      { "day": "fri", "start": "09:00", "end": "13:00" }
    ],
    "bufferMinutes": 10,
    "minNoticeMinutes": 120
  }'
```

See [Availability](availability.md) for every field.
{% endstep %}

{% step %}
### Create a link

Create a 30-minute link that writes bookings to your personal calendar.

```bash
curl -X POST 'https://api.syncly.example/booking-links' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "slug": "intro-call",
    "title": "Intro call with Alex",
    "calendarId": "cal-1",
    "durationMinutes": 30
  }'
```

Share the `url` from the response.
{% endstep %}

{% step %}
### Check open slots

The invitee loads the open slots for a day. This request doesn't need a token.

```bash
curl -X GET 'https://api.syncly.example/book/intro-call?date=2026-10-06'
```
{% endstep %}

{% step %}
### Book a slot

The invitee books a `startAt` from the `slots` list.

```bash
curl -X POST 'https://api.syncly.example/book/intro-call' \
  -H 'Content-Type: application/json' \
  -d '{
    "startAt": "2026-10-06T14:00:00Z",
    "inviteeName": "Jordan Lee",
    "inviteeEmail": "jordan@example.com",
    "notes": "Migration questions"
  }'
```

The meeting now appears on calendar `cal-1` with both of you as attendees.
{% endstep %}
{% endstepper %}

### Link fields

| Field | Description |
| --- | --- |
| `slug` | The part of the URL after `/book/`. Use lowercase letters, numbers, and hyphens, up to 50 characters. It can't start or end with a hyphen. Slugs are unique across the workspace. You can't change a slug after you create the link. |
| `title` | Shown to invitees. Also used in the title of each booked event. |
| `description` | Optional. Shown to invitees. |
| `durationMinutes` | Length of each slot: `15`, `30`, `45`, or `60`. Defaults to `30`. |
| `calendarId` | The calendar that receives confirmed bookings. You need to own it or have `editor` access. |
| `active` | When `false`, the public page returns `404`. Defaults to `true`. |

Each link in a response also includes:

* `url`, the public path, such as `/book/intro-call`.
* `id`, `ownerId`, and `createdAt`.

### What invitees see

The public page shows the link `title`, `description`, and `durationMinutes`. It also shows a `host` object with your name and time zone.

Slots are listed for one day at a time. Each slot has a `startAt` and `endAt` in UTC. Your app should convert these to the invitee's local time.

Invitees enter their name, their email, and an optional note. Syncly doesn't send them a confirmation email.

### What happens when someone books

Syncly checks the slot again before it confirms the booking. If someone else took the slot after the page loaded, the request returns `409`.

When the booking succeeds, Syncly creates:

* An **event** on the link's calendar, titled `<link title> — <invitee name>`. For example, `Intro call with Alex — Jordan Lee`. Both you and the invitee are attendees. The invitee's note becomes the event description. The event has one 15-minute reminder for you.
* A **booking** record that connects the event to the link and stores the invitee's details.

To cancel a booking, delete its event. Invitees can't reschedule or cancel from the public page.

### Deactivate or delete a link

| Action | Public page | Existing bookings and events |
| --- | --- | --- |
| Set `active` to `false` | Returns `404` right away | Kept |
| Delete the link | Returns `404` | Kept |

Deactivate a link to pause it. You can turn it back on later with the same slug.

Delete a link to remove it for good. To change a slug, delete the link and create another one with the slug you want.

{% hint style="info" %}
Changing a slug would break links you already shared. That's why slugs can't be edited.
{% endhint %}

### Endpoints

#### Manage your links

These endpoints require `Authorization: Bearer <token>`. You can only see and change your own links.

##### `GET /booking-links`

Returns your booking links.

**Response**

* `200 OK` with an array of links.

##### `POST /booking-links`

Creates a booking link.

**Request rules**

* `slug`, `title`, and `calendarId` are required.
* `description`, `durationMinutes`, and `active` are optional.
* You need owner or `editor` access to `calendarId`.

**Response**

* `201 Created` with the link.
* `400 Bad Request` if a required field is missing, the slug format is invalid, or `durationMinutes` isn't supported.
* `403 Forbidden` if you can't write to the calendar.
* `404 Not Found` if the calendar doesn't exist.
* `409 Conflict` if the slug is already taken.

**Example**

```bash
curl -X POST 'https://api.syncly.example/booking-links' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "slug": "intro-call",
    "title": "Intro call with Alex",
    "description": "A short call to see if Syncly fits your team.",
    "calendarId": "cal-1",
    "durationMinutes": 30
  }'
```

```json
{
  "id": "link-2",
  "ownerId": "user-1",
  "calendarId": "cal-1",
  "slug": "intro-call",
  "title": "Intro call with Alex",
  "description": "A short call to see if Syncly fits your team.",
  "durationMinutes": 30,
  "active": true,
  "createdAt": "2026-10-06T09:00:00.000Z",
  "url": "/book/intro-call"
}
```

##### `GET /booking-links/:id`

Returns one of your links, plus a `bookings` array of every booking made through it.

**Response**

* `200 OK` with the link and its `bookings`.
* `404 Not Found` if the link doesn't exist or belongs to someone else.

##### `PATCH /booking-links/:id`

Updates `title`, `description`, `durationMinutes`, `active`, or `calendarId`. You can't change `slug`.

**Response**

* `200 OK` with the updated link.
* `400 Bad Request` if `durationMinutes` isn't supported.
* `404 Not Found` if the link or calendar doesn't exist, or the link belongs to someone else.

**Example**

Pause a link:

```bash
curl -X PATCH 'https://api.syncly.example/booking-links/link-2' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{ "active": false }'
```

##### `DELETE /booking-links/:id`

Deletes a link. Bookings and their events stay on your calendar.

**Response**

* `204 No Content` on success.
* `404 Not Found` if the link doesn't exist or belongs to someone else.

#### Public booking page

These endpoints don't need a token.

##### `GET /book/:slug`

Returns the link details and `host`. Add `?date=YYYY-MM-DD` to also get the open `slots` for that day. The date uses the host's time zone.

**Response**

* `200 OK` with the link details, `host`, `maxDaysAhead`, and `slots`.
* `400 Bad Request` if `date` isn't `YYYY-MM-DD`.
* `404 Not Found` if the slug doesn't exist or the link is inactive.

**Example**

```bash
curl -X GET 'https://api.syncly.example/book/intro-call?date=2026-10-06'
```

```json
{
  "slug": "intro-call",
  "title": "Intro call with Alex",
  "description": "A short call to see if Syncly fits your team.",
  "durationMinutes": 30,
  "host": { "name": "Alex Rivera", "timezone": "America/New_York" },
  "maxDaysAhead": 30,
  "date": "2026-10-06",
  "slots": [
    { "startAt": "2026-10-06T13:00:00.000Z", "endAt": "2026-10-06T13:30:00.000Z" },
    { "startAt": "2026-10-06T13:30:00.000Z", "endAt": "2026-10-06T14:00:00.000Z" }
  ]
}
```

##### `POST /book/:slug`

Books a slot.

**Request rules**

* `startAt` is required and must be an ISO 8601 timestamp that matches an open slot.
* `inviteeName` and `inviteeEmail` are required.
* `notes` is optional.

**Response**

* `201 Created` with the booking and a `host` object.
* `400 Bad Request` if a required field is missing or `startAt` isn't ISO 8601.
* `404 Not Found` if the slug doesn't exist or the link is inactive.
* `409 Conflict` if the slot is no longer open.

**Example**

```bash
curl -X POST 'https://api.syncly.example/book/intro-call' \
  -H 'Content-Type: application/json' \
  -d '{
    "startAt": "2026-10-06T14:00:00Z",
    "inviteeName": "Jordan Lee",
    "inviteeEmail": "jordan@example.com",
    "notes": "Migration questions"
  }'
```

```json
{
  "id": "bkg-1",
  "bookingLinkId": "link-2",
  "eventId": "evt-1",
  "inviteeName": "Jordan Lee",
  "inviteeEmail": "jordan@example.com",
  "startAt": "2026-10-06T14:00:00.000Z",
  "endAt": "2026-10-06T14:30:00.000Z",
  "createdAt": "2026-10-06T09:12:00.000Z",
  "host": { "name": "Alex Rivera", "timezone": "America/New_York" }
}
```

### Errors

Errors return a JSON body in the form `{ "error": "<message>" }`.

| Status | When |
| --- | --- |
| `400` | A required field is missing. The slug format is invalid. `durationMinutes` isn't `15`, `30`, `45`, or `60`. `date` isn't `YYYY-MM-DD`. `startAt` isn't ISO 8601. |
| `401` | The bearer token is missing or invalid on a `/booking-links` endpoint. |
| `403` | You don't have owner or `editor` access to the calendar when creating a link. |
| `404` | The link or calendar doesn't exist. The link belongs to another user. The public slug doesn't exist or the link is inactive. |
| `409` | The slug is already taken. The slot is no longer open. |

{% hint style="info" %}
Another user's link returns `404`, not `403`. This keeps link IDs private.
{% endhint %}

### Limitations

* Each link belongs to one user and one calendar. Team and round-robin links aren't supported.
* Invitees don't receive confirmation or reminder emails.
* The booking form only asks for a name, an email, and an optional note.
