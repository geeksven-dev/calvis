import { Router, Request, Response } from 'express';
import { fetchCalendarEvents } from '../services/calendarService';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const events = await fetchCalendarEvents();
    res.json({ events });
  } catch (err) {
    console.error('Fehler beim Abrufen des Kalenders:', err);
    res.status(500).json({ error: 'Kalender konnte nicht abgerufen werden.' });
  }
});

export default router;
