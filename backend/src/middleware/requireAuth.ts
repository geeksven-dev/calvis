import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Nicht authentifiziert.' });
    return;
  }

  const token  = header.slice(7);
  const secret = process.env.JWT_SECRET ?? 'fallback-secret';

  try {
    jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).json({ error: 'Token ungültig oder abgelaufen.' });
  }
}
