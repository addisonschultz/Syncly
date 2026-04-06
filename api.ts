/**
 * Mock API layer — no network calls; returns fixed data after a short delay.
 */

export type CalendarDate = {
  id: string;
  date: string; // ISO date (YYYY-MM-DD)
  label: string;
  isBlocked: boolean;
};

export type CalendarDatesResponse = {
  dates: CalendarDate[];
  timezone: string;
};

const MOCK_CALENDAR_DATES: CalendarDate[] = [
  { id: "cd-1", date: "2026-04-06", label: "Today", isBlocked: false },
  { id: "cd-2", date: "2026-04-07", label: "Tomorrow", isBlocked: false },
  { id: "cd-3", date: "2026-04-08", label: "Team sync", isBlocked: true },
  { id: "cd-4", date: "2026-04-09", label: "Focus day", isBlocked: false },
  { id: "cd-5", date: "2026-04-10", label: "Week wrap", isBlocked: false },
];

function mockDelay<T>(value: T, ms = 180): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/**
 * Mock: GET /calendar/dates — returns a week slice of calendar markers.
 */
export async function getCalendarDates(): Promise<CalendarDatesResponse> {
  return mockDelay({
    dates: MOCK_CALENDAR_DATES,
    timezone: "America/Los_Angeles",
  });
}

export type CalendarEvent = {
  id: string;
  title: string;
  startsAt: string; // ISO datetime
  endsAt: string;
};

export type CalendarEventsResponse = {
  events: CalendarEvent[];
};

const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: "ev-1",
    title: "Standup",
    startsAt: "2026-04-06T09:00:00-07:00",
    endsAt: "2026-04-06T09:15:00-07:00",
  },
  {
    id: "ev-2",
    title: "Design review",
    startsAt: "2026-04-06T14:00:00-07:00",
    endsAt: "2026-04-06T15:00:00-07:00",
  },
];

/**
 * Mock: GET /calendar/events — sample events for the same window as dates.
 */
export async function getCalendarEvents(): Promise<CalendarEventsResponse> {
  return mockDelay({ events: MOCK_EVENTS });
}
