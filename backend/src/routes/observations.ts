import { Router, Request, Response } from 'express';
import axios from 'axios';
import https from 'https';

const router = Router();
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

router.get('/', async (_req: Request, res: Response) => {
  const url = process.env.OBSERVATIONS_URL;
  if (!url) {
    res.status(500).json({ error: 'OBSERVATIONS_URL ist nicht konfiguriert.' });
    return;
  }

  try {
    const response = await axios.get<string>(url, {
      responseType: 'text',
      maxRedirects: 5,
      httpsAgent,
    });
    res.json({ content: response.data });
  } catch (err) {
    console.error('Fehler beim Abrufen der Beobachtungen:', err);
    res.status(500).json({ error: 'Dokument konnte nicht abgerufen werden.' });
  }
});

export default router;
