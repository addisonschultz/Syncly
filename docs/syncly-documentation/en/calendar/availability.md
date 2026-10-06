---
description: Set the weekly hours, buffers, and notice period that decide which times invitees can book with you.
---

# Availability

### Getting Started With Availability

Your availability profile decides which times Syncly offers when someone books a meeting with you through a [booking link](booking-links.md). Simply set your hours once, and Syncly will offer open slots that fit inside them.

Open slots are your weekly hours minus everything already on your calendars. Events on team calendars you belong to count as busy, even events you are not attending.

### Profile settings

The profile has four settings

| Setting | What it controls | Default |
|---|---|---|
| **Weekly hours** | The days and times you accept bookings, in your profile timezone. A day can have more than one window, for example to keep a lunch break free. | Monday to Friday, 09:00 to 17:00 |
| **Buffer** | Minutes kept free before and after every event when Syncly computes open slots. | 0 |
| **Minimum notice** | The earliest a slot can start, measured from the current time. | 60 minutes |
| **Booking horizon** | How far ahead invitees can book. | 60 days |

The profile is created with these defaults the first time you open it, so you only need to change what differs for you.

### Set your weekly hours

{% stepper %}
{% step %}
### Open availability settings

In **Settings**, click **Availability**.
{% endstep %}

{% step %}
### Add your windows

For each day you accept bookings, add a start and end time. Add a second window on the same day to split it.
{% endstep %}

{% step %}
### Set buffer, notice, and horizon

Enter a buffer in minutes, a minimum notice in minutes, and a booking horizon in days.
{% endstep %}

{% step %}
### Save

Click **Save**. You're all set!
{% endstep %}
{% endstepper %}

{% hint style="info" %}
Weekly hours follow your profile timezone. If you change your timezone in **Settings** → **General**, your windows move with it.
{% endhint %}

### How buffers affect open slots

A buffer removes more than the minutes it names. With a 10-minute buffer, a 30-minute booking at 14:00 also removes the 13:30 slot, because that slot would end inside the buffer. This is expected behavior, not a scheduling error.

### API

Availability is also available through the API. All requests need an `Authorization: Bearer <token>` header.

| Method | Path | Description |
|---|---|---|
| `GET` | `/users/me/availability` | Returns your profile and `timezone`. Creates the default profile on first read. |
| `PUT` | `/users/me/availability` | Updates any of `windows`, `bufferMinutes`, `minNoticeMinutes`, `maxDaysAhead`. Fields you leave out keep their value. If you send `windows`, it replaces the whole array. |

The profile fields map to the settings above:

| Field | Type | Limits |
|---|---|---|
| `windows[]` | `{ day, start, end }` with `day` one of `mon` to `sun` and times as 24-hour `HH:MM` | `start` must be before `end`. No overnight windows. |
| `bufferMinutes` | integer | 0 or more |
| `minNoticeMinutes` | integer | 0 or more |
| `maxDaysAhead` | integer | 0 to 365 |

Example: set Monday to Thursday 09:00 to 17:00, Friday until 13:00, with a 10-minute buffer and two hours of notice.

```bash
curl -X PUT http://localhost:3000/users/me/availability \
  -H "Authorization: Bearer syncly-mock-token" \
  -H "Content-Type: application/json" \
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

A malformed window, a negative number, or a horizon over 365 days returns `400` with `{ "error": "<message>" }`.
