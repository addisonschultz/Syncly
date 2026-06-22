import type { User, Calendar, Event, NotificationPreferences } from "../types/index.js";

export const users: User[] = [
  {
    id: "user-1",
    email: "alex@example.com",
    name: "Alex Rivera",
    timezone: "America/New_York",
    integrations: { google: true, outlook: false, ical: false },
    createdAt: "2024-01-10T09:00:00Z",
  },
  {
    id: "user-2",
    email: "sam@example.com",
    name: "Sam Chen",
    timezone: "America/Los_Angeles",
    integrations: { google: false, outlook: true, ical: false },
    createdAt: "2024-02-14T11:30:00Z",
  },
];

export const calendars: Calendar[] = [
  {
    id: "cal-1",
    ownerId: "user-1",
    name: "Personal",
    color: "#4A90D9",
    visibility: "personal",
    members: [],
    createdAt: "2024-01-10T09:05:00Z",
  },
  {
    id: "cal-2",
    ownerId: "user-1",
    name: "Engineering Team",
    color: "#27AE60",
    visibility: "team",
    members: [{ userId: "user-2", role: "editor" }],
    createdAt: "2024-01-15T10:00:00Z",
  },
];

export const events: Event[] = [
  {
    id: "evt-1",
    calendarId: "cal-1",
    title: "Dentist Appointment",
    description: "Annual checkup",
    location: "123 Main St",
    startAt: "2026-07-01T14:00:00Z",
    endAt: "2026-07-01T15:00:00Z",
    attendees: ["alex@example.com"],
    reminders: [{ minutes: 60 }, { minutes: 1440 }],
    createdAt: "2026-06-20T08:00:00Z",
  },
  {
    id: "evt-2",
    calendarId: "cal-2",
    title: "Sprint Planning",
    description: "Q3 sprint kickoff",
    location: "Zoom",
    startAt: "2026-07-07T15:00:00Z",
    endAt: "2026-07-07T16:30:00Z",
    attendees: ["alex@example.com", "sam@example.com"],
    reminders: [{ minutes: 15 }],
    recurring: { frequency: "weekly" },
    createdAt: "2026-06-18T12:00:00Z",
  },
];

export const notificationPreferences: NotificationPreferences[] = [
  {
    userId: "user-1",
    channels: { inApp: true, email: true, sms: false },
    defaultReminderMinutes: 15,
    quietHours: { start: "22:00", end: "08:00" },
  },
  {
    userId: "user-2",
    channels: { inApp: true, email: false, sms: true },
    defaultReminderMinutes: 30,
  },
];
