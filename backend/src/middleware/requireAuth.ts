import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  username: string;
  role: 'admin' | 'doctor';
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Nicht authentifiziert.' });
    return;
  }

  const token  = header.slice(7);
  const secret = process.env.JWT_SECRET ?? 'fallback-secret';

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token ungültig oder abgelaufen.' });
  }
}

export function requireRole(...roles: ('admin' | 'doctor')[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    requireAuth(req, res, () => {
      const user = (req as any).user as JwtPayload;
      if (!roles.includes(user.role)) {
        res.status(403).json({ error: 'Keine Berechtigung.' });
        return;
      }
      next();
    });
  };
}
