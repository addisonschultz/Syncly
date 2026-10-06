---
description: Set the weekly hours, buffers, and notice period that control when people can book time with you.
---

# Availability

### Availability profile

Your availability profile sets when people can book time with you through a [booking link](booking-links.md).

You have one profile. Syncly creates it with default values the first time you read it.

Open slots are your weekly hours minus everything already on your calendars. Syncly also applies your buffer, minimum notice, and booking horizon.

### Profile fields

| Field | Description | Default | Limits |
| --- | --- | --- | --- |
| `windows` | Weekly hours you accept bookings. Each entry is `{ day, start, end }`. | Monday to Friday, `09:00`–`17:00` | `day` is `mon` to `sun`. Times are `HH:MM`, 24-hour. `start` must be before `end`. |
| `bufferMinutes` | Padding added before and after every event when Syncly calculates open slots. | `0` | Integer, `0` or more |
| `minNoticeMinutes` | How soon a slot can start, counted from the current time. | `60` | Integer, `0` or more |
| `maxDaysAhead` | How many days into the future slots are offered. | `60` | Integer, `0` to `365` |

The response also includes your `timezone`. You can't set it here. It comes from your user profile.

#### Weekly hours

A day can have more than one window. Use this to add a break, such as lunch:

```json
[
  { "day": "mon", "start": "09:00", "end": "12:00" },
  { "day": "mon", "start": "13:00", "end": "17:00" }
]
```

Windows can't cross midnight. Days with no window don't offer any slots.

#### Time zones

Windows use the time zone on your user profile. If you change your time zone with `PATCH /users/me`, your windows move with it. A `09:00` window always means 9 AM where you are.

Slots are always returned in UTC. Syncly handles daylight saving time per date. For example, a `09:00` window in New York is `13:00Z` in summer and `14:00Z` in winter.

#### Buffers

A buffer pads both sides of every event. This can remove more slots than you expect.

For example, with a 10-minute buffer and 30-minute slots, a booking at 14:00 also removes the 13:30 slot. That slot would end inside the buffer before the booking.

### What counts as busy

When Syncly calculates open slots, these all block time:

* Events on every calendar you own.
* Events on every shared calendar you are a member of, even events you aren't attending.
* Each occurrence of a recurring event (`daily`, `weekly`, or `monthly`). A recurring event without an `until` date repeats forever.
* Meetings already booked through your booking links.

{% hint style="warning" %}
Events on team calendars block your slots. You can't exclude a specific calendar yet.
{% endhint %}

### Endpoints

All availability endpoints require `Authorization: Bearer <token>`.

#### `GET /users/me/availability`

Returns your availability profile. If you don't have one yet, Syncly creates one with the default values.

**Response**

* `200 OK` with the profile and your `timezone`.

**Example**

```bash
curl -X GET 'https://api.syncly.example/users/me/availability' \
  -H 'Authorization: Bearer <token>'
```

```json
{
  "userId": "user-1",
  "windows": [
    { "day": "mon", "start": "09:00", "end": "17:00" },
    { "day": "tue", "start": "09:00", "end": "17:00" },
    { "day": "wed", "start": "09:00", "end": "17:00" },
    { "day": "thu", "start": "09:00", "end": "17:00" },
    { "day": "fri", "start": "09:00", "end": "17:00" }
  ],
  "bufferMinutes": 0,
  "minNoticeMinutes": 60,
  "maxDaysAhead": 60,
  "updatedAt": "2026-10-06T09:00:00.000Z",
  "timezone": "America/New_York"
}
```

#### `PUT /users/me/availability`

Updates your availability profile.

**Request rules**

* Send only the fields you want to change. Fields you leave out keep their current value.
* If you send `windows`, it replaces the whole array.

**Response**

* `200 OK` with the updated profile and your `timezone`.
* `400 Bad Request` if a window is invalid, a number is negative or not an integer, or `maxDaysAhead` is over `365`.

**Example**

Set Monday to Thursday from 9 AM to 5 PM, Friday until 1 PM, a 10-minute buffer, and 2 hours of notice:

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

### Errors

Errors return a JSON body in the form `{ "error": "<message>" }`.

| Status | When |
| --- | --- |
| `400` | A window has an unknown `day`, a time that isn't `HH:MM`, or a `start` that isn't before its `end`. A numeric field is negative or not an integer. `maxDaysAhead` is over `365`. |
| `401` | The bearer token is missing or invalid. |

### Related

* [Booking links](booking-links.md) to share your open slots.
* [Free/busy](free-busy.md) to check when a teammate is free.
