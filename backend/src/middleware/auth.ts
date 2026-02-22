import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthRequest extends Request {
  user?: { _id: string; email: string };
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token ?? req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  jwt.verify(token, JWT_SECRET, async (err: Error | null, decoded: unknown) => {
    if (err || !decoded || typeof (decoded as { userId?: string }).userId !== 'string') {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { userId } = decoded as { userId: string };
    const user = await User.findById(userId);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    (req as AuthRequest).user = { _id: user._id.toString(), email: user.email };
    next();
  });
}
