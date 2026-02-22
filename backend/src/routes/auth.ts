import express, { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

router.get(
  '/google/start',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/login?error=auth` }),
  async (req, res) => {
    const user = req.user as { _id: string };
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.redirect(FRONTEND_URL);
  }
);

router.get('/me', requireAuth, async (req: express.Request, res) => {
  const authReq = req as AuthRequest;
  const user = await User.findById(authReq.user!._id).select('-__v').lean();
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

export default router;
