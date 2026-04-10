import https from 'https';
import ical from 'node-ical';
import { CalendarEvent } from '../types';

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
    const date = startDate.toISOString().split('T')[0];
    const hours = allDay ? '00' : startDate.getUTCHours().toString().padStart(2, '0');
    const minutes = allDay ? '00' : startDate.getUTCMinutes().toString().padStart(2, '0');
    const time = `${hours}:${minutes}`;

    const title = (event.summary as string | undefined)?.trim() ?? '(Kein Titel)';

    events.push({ title, date, time, allDay });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}
