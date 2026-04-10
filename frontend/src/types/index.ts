export interface CalendarEvent {
  title: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:mm
  allDay?: boolean;
}

export interface EventsPerDay {
  date: string;
  count: number;
  events: CalendarEvent[];
}
