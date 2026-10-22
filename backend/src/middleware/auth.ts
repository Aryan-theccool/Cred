import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: number; phone: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header. Use: Bearer <token>' });
  }
  const token = auth.slice(7);
  try {
    const secret = process.env.JWT_SECRET || 'dev-secret-key';
    const payload = jwt.verify(token, secret) as { id: number; phone: string };
    req.user = { id: payload.id, phone: payload.phone };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
