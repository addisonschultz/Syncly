export interface User {
  id: string;
  email: string;
  name: string;
  timezone: string;
  integrations: {
    google: boolean;
    outlook: boolean;
    ical: boolean;
  };
  createdAt: string;
}

export interface CalendarMember {
  userId: string;
  role: "viewer" | "editor";
}

export interface Calendar {
  id: string;
  ownerId: string;
  name: string;
  color: string;
  visibility: "personal" | "team";
  members: CalendarMember[];
  createdAt: string;
}

export interface Reminder {
  minutes: number; // minutes before the event
}

export interface RecurringRule {
  frequency: "daily" | "weekly" | "monthly";
  until?: string; // ISO date string
}

export interface Event {
  id: string;
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  attendees: string[]; // email addresses
  reminders: Reminder[];
  recurring?: RecurringRule;
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  calendarId?: string;
  title: string;
  notes?: string;
  dueAt?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  userId: string;
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
  };
  defaultReminderMinutes: 5 | 15 | 30 | 60 | 1440;
  quietHours?: {
    start: string; // "HH:MM"
    end: string;
  };
}

// --- Availability & booking links ---

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface AvailabilityWindow {
  day: Weekday;
  start: string; // "HH:MM" in the user's timezone
  end: string; // "HH:MM" in the user's timezone
}

export interface AvailabilitySettings {
  userId: string;
  windows: AvailabilityWindow[];
  bufferMinutes: number; // padding added before and after every booked slot
  minNoticeMinutes: number; // earliest a slot may start, relative to now
  maxDaysAhead: number; // how far into the future slots are offered
  updatedAt: string;
}

export interface BusyBlock {
  startAt: string;
  endAt: string;
  source: "event" | "booking" | "buffer";
}

export type BookingDuration = 15 | 30 | 45 | 60;

export interface BookingLink {
  id: string;
  ownerId: string;
  calendarId: string; // where confirmed bookings are written as events
  slug: string; // public URL segment, unique per workspace
  title: string;
  description?: string;
  durationMinutes: BookingDuration;
  active: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingLinkId: string;
  eventId: string;
  inviteeName: string;
  inviteeEmail: string;
  startAt: string;
  endAt: string;
  createdAt: string;
}
