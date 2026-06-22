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
