---
description: Set the weekly hours you accept bookings, plus buffers, notice, and how far ahead people can book.
---

# Availability

Your availability profile tells Syncly when people can book time with you. Syncly uses it to work out the open slots on your [booking links](booking-links.md).

Syncly finds open slots by starting from your weekly hours and removing everything already on your calendars.

### Your availability profile

You have one availability profile. Syncly creates it with default values the first time you read it.

The profile has four fields:

| Field              | Description                                                                                                     | Default                | Limits                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------- |
| `windows`          | The weekly hours you accept bookings. Each window is `{ "day", "start", "end" }`.                               | Monday–Friday, 09:00–17:00 | `start` must be before `end`. No overnight windows. |
| `bufferMinutes`    | Padding Syncly adds before and after every event when it works out open slots.                                  | `0`                    | Whole number, `0` or more                    |
| `minNoticeMinutes` | The shortest notice you accept. Syncly doesn't offer slots that start sooner than this from now.                | `60`                   | Whole number, `0` or more                    |
| `maxDaysAhead`     | How many days into the future Syncly offers slots.                                                              | `60`                   | Whole number, `0`–`365`                      |

### Weekly windows

Each window covers one block of time on one day of the week. A window has three properties:

* `day`: one of `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, or `sun`.
* `start`: the start time, in 24-hour `HH:MM` format.
* `end`: the end time, in 24-hour `HH:MM` format.

You can add more than one window to the same day. For example, use two windows to keep a lunch break free:

```json
[
  { "day": "mon", "start": "09:00", "end": "12:00" },
  { "day": "mon", "start": "13:00", "end": "17:00" }
]
```

Days with no windows have no open slots.

### Time zones

Syncly reads your windows in your profile time zone. The API returns `timezone` alongside your profile so you can confirm which zone applies.

If you change your time zone, your windows move with it. A `09:00` window stays at 9 AM in your new zone.

Syncly always returns slots in UTC. It handles daylight saving time per date. For example, a `09:00` window in New York is `13:00Z` in summer and `14:00Z` in winter.

### How Syncly finds open slots

For a given booking link and date, Syncly takes these steps:

1. Takes your windows for that day of the week and converts them to UTC.
2. Splits each window into back-to-back slots the length of the link's duration. A slot must fit completely inside the window.
3. Removes slots that start before your minimum notice or after your booking horizon.
4. Removes slots that overlap a busy block.

A busy block is any event on a calendar you own or are a member of, padded by your buffer on both sides. Syncly includes these events:

* Events you created, including meetings booked through your links.
* Events on shared team calendars you're a member of, even ones you aren't attending.
* Every occurrence of a recurring event (`daily`, `weekly`, or `monthly`). A recurring event without an `until` date repeats forever.

{% hint style="info" %}
Events on shared calendars block your slots. If a team calendar you're a member of is busy, people can't book you during those times.
{% endhint %}

#### Buffers remove neighboring slots

A buffer pads each event on both sides, so it can remove the slots next to a booking.

For example, take a 10-minute buffer, 30-minute slots, and a booking from 14:00 to 14:30. Syncly treats 13:50 to 14:40 as busy, which removes three slots:

* 13:30–14:00, because it ends inside the buffer before the booking.
* 14:00–14:30, because it overlaps the booking.
* 14:30–15:00, because it starts inside the buffer after the booking.

This is expected behavior. Set `bufferMinutes` to `0` if you want back-to-back bookings.

### Endpoints

All availability endpoints need an `Authorization: Bearer <token>` header.

#### `GET /users/me/availability`

Returns your availability profile. If you don't have one, Syncly creates it with the default values.

**Responses:**

* `200 OK` with your profile and `timezone`.

**Example**

Read your profile:

```bash
curl -X GET 'https://api.syncly.example/users/me/availability' \
  -H 'Authorization: Bearer <token>'
```

The response looks like this:

```json
{
  "userId": "user-1",
  "windows": [
    { "day": "mon", "start": "09:00", "end": "17:00" },
    { "day": "tue", "start": "09:00", "end": "17:00" },
    { "day": "wed", "start": "09:00", "end": "17:00" },
    { "day": "thu", "start": "09:00", "end": "17:00" },
    { "day": "fri", "start": "09:00", "end": "13:00" }
  ],
  "bufferMinutes": 10,
  "minNoticeMinutes": 120,
  "maxDaysAhead": 30,
  "updatedAt": "2026-09-01T08:00:00Z",
  "timezone": "America/New_York"
}
```

#### `PUT /users/me/availability`

Updates your availability profile.

**Request rules**

The body accepts these fields, all optional:

* `windows`
* `bufferMinutes`
* `minNoticeMinutes`
* `maxDaysAhead`

Fields you leave out keep their current value.

{% hint style="warning" %}
If you send `windows`, it replaces all your existing windows. Include every window you want to keep.
{% endhint %}

**Responses:**

* `200 OK` with the updated profile and `timezone`.
* `400 Bad Request` if a field is invalid. See [Errors](#errors).

**Example**

Set Monday to Thursday from 9 AM to 5 PM, Friday until 1 PM, a 10-minute buffer, and 2 hours' notice:

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

Change only the booking horizon and keep everything else:

```bash
curl -X PUT 'https://api.syncly.example/users/me/availability' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{ "maxDaysAhead": 14 }'
```

### Errors

Errors return a JSON body in the form `{ "error": "<message>" }`. The status codes are:

| Status | When                                                                                                                                                                                    |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `400`  | A window has an unknown `day`, a time that isn't `HH:MM`, or a `start` that isn't before `end`. A number field is negative or not a whole number. `maxDaysAhead` is greater than `365`. |
| `401`  | The bearer token is missing or invalid.                                                                                                                                                 |

### Next steps

Put your availability to use with these features:

* [Booking links](booking-links.md) to share your open slots with people outside your workspace.
* [Free/busy](free-busy.md) to check when a teammate is free.
