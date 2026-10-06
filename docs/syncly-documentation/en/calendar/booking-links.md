---
description: Create a public booking link so people outside your workspace can pick an open time and book it.
---

# Booking links

### What a booking link does

A booking link is a public page at `/book/<slug>` where anyone can pick an open time with you and book it, without a Syncly account. Open times come from your [availability profile](availability.md). A confirmed booking is written to the destination calendar as a normal event with you and the invitee as attendees.

Each link has its own duration and destination calendar, so you can offer a 15-minute intro link and a 60-minute working session link side by side.

### Create a booking link

{% stepper %}
{% step %}
### Open booking links

In **Calendar**, click **Booking links**.
{% endstep %}

{% step %}
### Start a new link

Please click on **New link**.
{% endstep %}

{% step %}
### Fill in the details

Enter a slug, a title, and an optional description. Choose a duration and the calendar where bookings are written.
{% endstep %}

{% step %}
### Share it

Click **Copy link** in the link card and send the URL to your invitee.
{% endstep %}
{% endstepper %}

### Link settings

| Setting | What it controls |
|---|---|
| **Slug** | The URL segment after `/book/`. 1 to 50 characters: lowercase letters, digits, and hyphens, with no leading or trailing hyphen. Unique across the workspace. You cannot change a slug after creation. Delete the link and create a new one instead. |
| **Title** | Shown to invitees and used as the prefix of the event title. |
| **Description** | Optional text shown to invitees. |
| **Duration** | 15, 30, 45, or 60 minutes. Default is 30. |
| **Calendar** | Where confirmed bookings are written. You need owner or editor access to it. |
| **Active** | When off, the public page returns a not-found error. Existing bookings are untouched. |

{% hint style="warning" %}
Deactivating a link hides the public page immediately. Deleting a link removes it permanently. Neither action deletes the bookings already made or the events they created.
{% endhint %}

### What invitees see

The public page shows the link title, description, and your display name and timezone. When the invitee picks a date, the page lists the open slots for that day in their local time. The invitee enters a name, an e-mail address, and an optional note, then confirms.

Syncly checks the slot again at confirmation time. If someone else booked it in the meantime, the invitee sees a message asking them to pick another time.

### After a booking is confirmed

Syncly creates an event on the destination calendar titled `<link title> — <invitee name>`, with the note as the description, both of you as attendees, and a 15-minute reminder for you. Invitees do not receive a confirmation email in this release. To cancel a booking, delete the event.

### API

Booking links are now available through the API. Owner routes need an `Authorization: Bearer <token>` header. The public `/book` routes need no authentication.

**Owner routes**

| Method | Path | Description |
|---|---|---|
| `GET` | `/booking-links` | Lists your links. |
| `POST` | `/booking-links` | Creates a link. Requires `slug`, `title`, and `calendarId`. Optional `description`, `durationMinutes`, and `active`. Returns `201`. |
| `GET` | `/booking-links/:id` | Returns one link plus its `bookings[]`. |
| `PATCH` | `/booking-links/:id` | Updates `title`, `description`, `durationMinutes`, `active`, or `calendarId`. `slug` is immutable. |
| `DELETE` | `/booking-links/:id` | Removes the link. Returns `204`. Bookings and events remain. |

**Public routes**

| Method | Path | Description |
|---|---|---|
| `GET` | `/book/:slug` | Returns the link details and a `host` object. With `?date=YYYY-MM-DD`, also returns `slots[]` for that day as UTC `startAt` and `endAt` pairs. |
| `POST` | `/book/:slug` | Books a slot. Body: `startAt` (ISO 8601), `inviteeName`, `inviteeEmail`, and optional `notes`. Returns `201` with the booking and `host`. |

Example: create a 30-minute link, look up a day, and book a slot.

```bash
# Host creates a link on their Personal calendar
curl -X POST http://localhost:3000/booking-links \
  -H "Authorization: Bearer syncly-mock-token" \
  -H "Content-Type: application/json" \
  -d '{ "slug": "alex-intro", "title": "Intro chat with Alex", "calendarId": "cal-1", "durationMinutes": 30 }'

# Invitee looks at a day (no auth)
curl "http://localhost:3000/book/alex-intro?date=2026-10-06"

# Invitee books a slot from the response
curl -X POST http://localhost:3000/book/alex-intro \
  -H "Content-Type: application/json" \
  -d '{ "startAt": "2026-10-06T14:00:00Z", "inviteeName": "Jordan Lee", "inviteeEmail": "jordan@example.com", "notes": "Migration questions" }'
```

**Errors**

| Status | When |
|---|---|
| `400` | Bad slug format, unsupported `durationMinutes`, missing required fields, `date` not `YYYY-MM-DD`, or `startAt` not ISO 8601. |
| `403` | Creating a link on a calendar you cannot write to. |
| `404` | Unknown link ID, another user's link, or a public page for an unknown or inactive slug. |
| `409` | Slug already taken, or the slot is no longer available at booking time. |
