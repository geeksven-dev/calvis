import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

interface UserEntry {
  username: string;
  password: string;
  role: 'admin' | 'doctor';
}

function getUsers(): UserEntry[] {
  const raw = process.env.USERS;
  if (!raw) return [];
  try { return JSON.parse(raw) as UserEntry[]; }
  catch { return []; }
}

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };
  const secret = process.env.JWT_SECRET ?? 'fallback-secret';

  const users = getUsers();
  if (!users.length) {
    res.status(500).json({ error: 'USERS nicht konfiguriert.' });
    return;
  }

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    res.status(401).json({ error: 'Ungültige Anmeldedaten.' });
    return;
  }

  const token = jwt.sign({ username: user.username, role: user.role }, secret, { expiresIn: '30d' });
  res.json({ token, role: user.role });
});

export default router;
