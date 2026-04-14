import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import { requireRole } from '../middleware/requireAuth';

const router = Router();

function getCalendarClient() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!keyJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY ist nicht konfiguriert.');
  if (!calendarId) throw new Error('GOOGLE_CALENDAR_ID ist nicht konfiguriert.');

  const key = JSON.parse(keyJson);
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  const calendar = google.calendar({ version: 'v3', auth });
  return { calendar, calendarId };
}

router.post('/', requireRole('admin'), async (req: Request, res: Response) => {
  const { title, datetime } = req.body as { title?: string; datetime?: string };

  if (!title?.trim()) {
    res.status(400).json({ error: 'Titel ist erforderlich.' });
    return;
  }

  try {
    const { calendar, calendarId } = getCalendarClient();

    const start = datetime ? new Date(datetime) : new Date();
    const end = new Date(start.getTime() + 30 * 60 * 1000); // +30min

    const timezone = process.env.TIMEZONE ?? 'Europe/Vienna';

    await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: title.trim(),
        start: { dateTime: start.toISOString(), timeZone: timezone },
        end:   { dateTime: end.toISOString(),   timeZone: timezone },
      },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Fehler beim Erstellen des Kalendereintrags:', err);
    res.status(500).json({ error: 'Eintrag konnte nicht erstellt werden.' });
  }
});

export default router;
