import { google } from 'googleapis';
import { CalendarEvent } from '../types';

const displayTimezone = process.env.TIMEZONE || 'Europe/Vienna';

function formatInTimezone(date: Date): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: displayTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '00';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour').replace('24', '00')}:${get('minute')}`,
  };
}

function getCalendarAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY ist nicht konfiguriert.');
  const key = JSON.parse(keyJson);
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });
}

export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) throw new Error('GOOGLE_CALENDAR_ID ist nicht konfiguriert.');

  const auth = getCalendarAuth();
  const calendar = google.calendar({ version: 'v3', auth });

  const events: CalendarEvent[] = [];
  let pageToken: string | undefined;

  do {
    const res = await calendar.events.list({
      calendarId,
      maxResults: 2500,
      singleEvents: true,
      orderBy: 'startTime',
      pageToken,
    });

    for (const item of res.data.items ?? []) {
      const summary = item.summary?.trim() ?? '(Kein Titel)';
      const startRaw = item.start;
      if (!startRaw) continue;

      if (startRaw.date && !startRaw.dateTime) {
        // All-day event
        events.push({ title: summary, date: startRaw.date, time: '00:00', allDay: true });
      } else if (startRaw.dateTime) {
        const { date, time } = formatInTimezone(new Date(startRaw.dateTime));
        events.push({ title: summary, date, time, allDay: false });
      }
    }

    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return events.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}
