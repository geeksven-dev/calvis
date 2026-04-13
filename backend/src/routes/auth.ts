import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };

  const validUser = process.env.ADMIN_USER;
  const validPass = process.env.ADMIN_PASSWORD;
  const secret    = process.env.JWT_SECRET ?? 'fallback-secret';

  if (!validUser || !validPass) {
    res.status(500).json({ error: 'Auth nicht konfiguriert.' });
    return;
  }

  if (username !== validUser || password !== validPass) {
    res.status(401).json({ error: 'Ungültige Anmeldedaten.' });
    return;
  }

  const token = jwt.sign({ username }, secret, { expiresIn: '30d' });
  res.json({ token });
});

export default router;
