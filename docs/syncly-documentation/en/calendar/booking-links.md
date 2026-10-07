---
description: Share a public link that lets anyone pick an open time on your calendar and book it.
---

# Booking links

A booking link is a public page where anyone can book time with you, even if they don't have a Syncly account. You share the link, the invitee picks an open slot, and Syncly adds the meeting to your calendar.

Each link has its own duration and destination calendar. Syncly takes open slots from your [availability](availability.md) and removes anything already on your calendars.

### Quickstart

Follow these steps to set your hours, create a link, and make a test booking:

{% stepper %}
{% step %}
### Set your availability

Set the hours you accept bookings. This example sets Monday to Thursday from 9 AM to 5 PM, Friday until 1 PM, a 10-minute buffer, and 2 hours' notice:

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

For every setting, see [Availability](availability.md).
{% endstep %}

{% step %}
### Create a booking link

Create a 30-minute link that writes bookings to your personal calendar:

```bash
curl -X POST 'https://api.syncly.example/booking-links' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "slug": "alex-30min",
    "title": "Intro chat with Alex",
    "calendarId": "cal-1",
    "durationMinutes": 30
  }'
```

The response includes the public `url`, for example `/book/alex-30min`. Share it with the people you want to meet.
{% endstep %}

{% step %}
### Check open slots

The invitee loads the open slots for a day with a request that doesn't need a token:

```bash
curl 'https://api.syncly.example/book/alex-30min?date=2026-10-06'
```

The `slots` list contains each open time as a UTC `startAt` and `endAt` pair.
{% endstep %}

{% step %}
### Book a slot

The invitee books a `startAt` from the `slots` list:

```bash
curl -X POST 'https://api.syncly.example/book/alex-30min' \
  -H 'Content-Type: application/json' \
  -d '{
    "startAt": "2026-10-06T14:00:00Z",
    "inviteeName": "Jordan Lee",
    "inviteeEmail": "jordan@example.com",
    "notes": "Migration questions"
  }'
```

Syncly adds the meeting to your calendar and returns the booking.
{% endstep %}
{% endstepper %}

### Booking link fields

A link has these fields:

| Field             | Description                                                                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slug`            | The part of the URL after `/book/`. Use up to 50 lowercase letters, numbers, and hyphens. It can't start or end with a hyphen. Must be unique in the workspace. |
| `title`           | Shown to invitees. Syncly also uses it to name booked events.                                                                                       |
| `description`     | Optional. Shown to invitees.                                                                                                                        |
| `durationMinutes` | Meeting length: `15`, `30`, `45`, or `60`. Defaults to `30`.                                                                                        |
| `calendarId`      | The calendar that receives bookings. You must own it or have `editor` access.                                                                       |
| `active`          | When `false`, the public page is unavailable. Defaults to `true`.                                                                                   |

Syncly also returns these read-only fields:

* `id`: the link ID.
* `url`: the public path, `/book/<slug>`.
* `ownerId`: your user ID.
* `createdAt`: when you created the link.

{% hint style="info" %}
You can't change a slug after you create the link, because that would break links you've already shared. To use a different slug, delete the link and create a new one.
{% endhint %}

### What invitees see

The public page at `/book/<slug>` doesn't need a Syncly account or token. It shows:

* The link's title, description, and duration.
* Your name and time zone.
* The open slots for the date the invitee picks.

To book, the invitee picks a slot and enters their name, email, and an optional note.

Syncly returns slots in UTC, so your app should convert them to the invitee's local time.

Syncly checks the slot again when the invitee books it. If someone else took the slot after the page loaded, the booking fails with `409` and the invitee needs to pick another time.

### What happens when someone books

When an invitee confirms a slot, Syncly creates an event on the link's calendar with these details:

* **Title:** `<link title> — <invitee name>`, for example `Intro chat with Alex — Jordan Lee`.
* **Description:** the invitee's note, if they added one.
* **Attendees:** your email and the invitee's email.
* **Reminder:** one reminder 15 minutes before the start, for you.

Syncly also stores a booking record that links the event to the booking link and keeps the invitee's details. The booking shows up in the link's `bookings` list.

The new event behaves like any other [event](events.md). It also counts as busy time, so the slot disappears from all your links.

Syncly doesn't send the invitee a confirmation email or reminders.

### Deactivate or delete a link

To stop taking bookings, deactivate or delete the link. Each action has a different effect:

| Action                         | Public page                          | Existing bookings and events | Use when                                           |
| ------------------------------ | ------------------------------------ | ---------------------------- | -------------------------------------------------- |
| Deactivate (`active: false`)   | Returns `404` until you reactivate it | Kept                         | You want to pause bookings and reuse the link later. |
| Delete                         | Returns `404` permanently            | Kept                         | You don't need the link or its slug anymore.         |

To cancel a meeting someone booked, delete its event from your calendar.

### Endpoints

#### Manage your links

These endpoints need an `Authorization: Bearer <token>` header. You can only see and change your own links.

##### `GET /booking-links`

Returns all your booking links.

**Responses:**

* `200 OK` with an array of links.

##### `POST /booking-links`

Creates a booking link.

**Request rules**

The body accepts these fields:

* `slug`, `title`, and `calendarId` are required.
* `description`, `durationMinutes`, and `active` are optional.

**Responses:**

* `201 Created` with the link, including `url`.
* `400 Bad Request` if a required field is missing, the slug format is invalid, or the duration isn't supported.
* `403 Forbidden` if you don't own the calendar or have `editor` access to it.
* `404 Not Found` if the calendar doesn't exist.
* `409 Conflict` if another link already uses the slug.

##### `GET /booking-links/:id`

Returns one of your links, plus its `bookings` list.

**Responses:**

* `200 OK` with the link and its bookings.
* `404 Not Found` if the link doesn't exist or belongs to someone else.

**Example**

Read a link and its bookings:

```bash
curl -X GET 'https://api.syncly.example/booking-links/link-1' \
  -H 'Authorization: Bearer <token>'
```

The response looks like this:

```json
{
  "id": "link-1",
  "ownerId": "user-1",
  "calendarId": "cal-1",
  "slug": "alex-intro",
  "title": "Intro chat with Alex",
  "description": "A quick 30-minute call to talk through what you're working on.",
  "durationMinutes": 30,
  "active": true,
  "createdAt": "2026-09-01T08:05:00Z",
  "url": "/book/alex-intro",
  "bookings": [
    {
      "id": "bkg-1759759200000",
      "bookingLinkId": "link-1",
      "eventId": "evt-1759759200000",
      "inviteeName": "Jordan Lee",
      "inviteeEmail": "jordan@example.com",
      "startAt": "2026-10-06T14:00:00.000Z",
      "endAt": "2026-10-06T14:30:00.000Z",
      "createdAt": "2026-10-06T12:00:00.000Z"
    }
  ]
}
```

##### `PATCH /booking-links/:id`

Updates one of your links.

**Request rules**

You can change these fields:

* `title`
* `description`
* `durationMinutes`
* `active`
* `calendarId`

You can't change `slug`.

**Responses:**

* `200 OK` with the updated link.
* `400 Bad Request` if the duration isn't supported.
* `404 Not Found` if the link or calendar doesn't exist, or the link belongs to someone else.

**Example**

Deactivate a link:

```bash
curl -X PATCH 'https://api.syncly.example/booking-links/link-1' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{ "active": false }'
```

##### `DELETE /booking-links/:id`

Deletes one of your links. Its bookings and their events stay on your calendar.

**Responses:**

* `204 No Content` on success.
* `404 Not Found` if the link doesn't exist or belongs to someone else.

#### Public booking page

These endpoints don't need a token.

##### `GET /book/:slug`

Returns the link details and the host. Add `?date=YYYY-MM-DD` to also get the open slots for that day. The date is in the host's time zone.

**Responses:**

* `200 OK` with the link details, `host`, `maxDaysAhead`, and `slots`. Without `date`, `slots` is empty.
* `400 Bad Request` if `date` isn't in `YYYY-MM-DD` format.
* `404 Not Found` if the slug doesn't exist or the link is inactive.

**Example**

Get the open slots for October 6, 2026:

```bash
curl 'https://api.syncly.example/book/alex-intro?date=2026-10-06'
```

The response looks like this (slots shortened):

```json
{
  "slug": "alex-intro",
  "title": "Intro chat with Alex",
  "description": "A quick 30-minute call to talk through what you're working on.",
  "durationMinutes": 30,
  "host": { "name": "Alex Rivera", "timezone": "America/New_York" },
  "maxDaysAhead": 30,
  "date": "2026-10-06",
  "slots": [
    { "startAt": "2026-10-06T13:00:00.000Z", "endAt": "2026-10-06T13:30:00.000Z" },
    { "startAt": "2026-10-06T13:30:00.000Z", "endAt": "2026-10-06T14:00:00.000Z" },
    { "startAt": "2026-10-06T14:00:00.000Z", "endAt": "2026-10-06T14:30:00.000Z" }
  ]
}
```

##### `POST /book/:slug`

Books a slot.

**Request rules**

The body accepts these fields:

* `startAt` is required. It must be an ISO 8601 timestamp that matches an open slot.
* `inviteeName` is required.
* `inviteeEmail` is required.
* `notes` is optional.

**Responses:**

* `201 Created` with the booking and a `host` object containing the host's name and time zone.
* `400 Bad Request` if a required field is missing or `startAt` isn't a valid timestamp.
* `404 Not Found` if the slug doesn't exist or the link is inactive.
* `409 Conflict` if the slot isn't open anymore.

### Errors

Errors return a JSON body in the form `{ "error": "<message>" }`. The status codes are:

| Status | When                                                                                                                                         |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `400`  | A required field is missing. The slug format is invalid. `durationMinutes` isn't `15`, `30`, `45`, or `60`. `date` isn't `YYYY-MM-DD`. `startAt` isn't ISO 8601. |
| `401`  | The bearer token is missing or invalid on a `/booking-links` request.                                                                         |
| `403`  | You're creating a link on a calendar you can't write to.                                                                                      |
| `404`  | The calendar or link doesn't exist, or the link belongs to someone else. On the public page, the slug doesn't exist or the link is inactive. |
| `409`  | The slug is already taken, or the slot isn't open anymore.                                                                                    |

{% hint style="info" %}
Syncly returns `404` instead of `403` for links that belong to someone else, so link IDs can't be discovered.
{% endhint %}

### Limitations

Booking links work within these limits:

* Each link belongs to one user and writes to one calendar. Team and round-robin links aren't supported.
* The booking form asks only for name, email, and an optional note.
* Invitees can't reschedule or cancel from the public page. You cancel a booking by deleting its event.
* All links share your availability profile. You can't set different hours for different links.
* Syncly doesn't generate video call links or take payments.
