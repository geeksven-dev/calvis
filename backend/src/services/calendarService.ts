import https from 'https';
import ical from 'node-ical';
import { CalendarEvent } from '../types';

const displayTimezone = process.env.TIMEZONE || 'UTC';

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

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const agent = new https.Agent({ rejectUnauthorized: false });
    https.get(url, { agent }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchText(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (!res.statusCode || res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

export async function fetchCalendarEvents(url: string): Promise<CalendarEvent[]> {
  const text = await fetchText(url);
  const rawEvents = ical.parseICS(text);
  const events: CalendarEvent[] = [];

  for (const key in rawEvents) {
    const event = rawEvents[key];

    if (event.type !== 'VEVENT') continue;

    const start = event.start;
    if (!start) continue;

    const startDate = start instanceof Date ? start : new Date(start);
    if (isNaN(startDate.getTime())) continue;

    const allDay = !!(start as any).dateOnly;

    let date: string;
    let time: string;

    if (allDay) {
      date = startDate.toISOString().split('T')[0];
      time = '00:00';
    } else {
      ({ date, time } = formatInTimezone(startDate));
    }

    const title = (event.summary as string | undefined)?.trim() ?? '(Kein Titel)';

    events.push({ title, date, time, allDay });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}
