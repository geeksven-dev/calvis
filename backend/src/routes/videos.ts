import { Router, Request, Response } from 'express';
import { requireRole } from '../middleware/requireAuth';

const router = Router();

interface VideoItem {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
}

function parseTitleDate(title: string): Date {
  // Erwartet Format DD.MM.YYYY irgendwo im Titel
  const match = title.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (match) return new Date(`${match[3]}-${match[2]}-${match[1]}`);
  return new Date(0);
}

router.get('/', requireRole('admin', 'doctor'), async (_req: Request, res: Response) => {
  const apiKey    = process.env.YOUTUBE_API_KEY;
  const playlistId = process.env.YOUTUBE_PLAYLIST_ID;

  if (!apiKey || !playlistId) {
    res.status(500).json({ error: 'YouTube nicht konfiguriert.' });
    return;
  }

  try {
    const videos: VideoItem[] = [];
    let pageToken = '';

    do {
      const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('playlistId', playlistId);
      url.searchParams.set('maxResults', '50');
      url.searchParams.set('key', apiKey);
      if (pageToken) url.searchParams.set('pageToken', pageToken);

      const resp = await fetch(url.toString());
      if (!resp.ok) throw new Error(`YouTube API: HTTP ${resp.status}`);
      const data = await resp.json() as any;

      for (const item of data.items ?? []) {
        const snippet = item.snippet;
        const videoId = snippet?.resourceId?.videoId;
        if (!videoId || snippet?.title === 'Private video' || snippet?.title === 'Deleted video') continue;
        videos.push({
          videoId,
          title: snippet.title,
          publishedAt: snippet.publishedAt,
          thumbnail: snippet.thumbnails?.medium?.url ?? snippet.thumbnails?.default?.url ?? '',
        });
      }

      pageToken = data.nextPageToken ?? '';
    } while (pageToken);

    // Nach Datum im Titel aufsteigend sortieren
    videos.sort((a, b) => parseTitleDate(a.title).getTime() - parseTitleDate(b.title).getTime());

    res.json({ videos });
  } catch (err) {
    console.error('Fehler beim Abrufen der YouTube-Playlist:', err);
    res.status(500).json({ error: 'Videos konnten nicht geladen werden.' });
  }
});

export default router;
