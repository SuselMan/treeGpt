import 'dotenv/config';
import express, { Request } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import passport from 'passport';

import path from 'path';
import { fileURLToPath } from 'url';
import './config/passport.js';
import { requireAuth, AuthRequest } from './middleware/auth.js';
import { User } from './models/User.js';
import authRoutes from './routes/auth.js';
import chatsRoutes from './routes/chats.js';
import threadsRoutes from './routes/threads.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

app.use('/api/auth', authRoutes);
app.get('/api/me', requireAuth, async (req: Request, res) => {
  const authReq = req as AuthRequest;
  const user = await User.findById(authReq.user!._id).select('-__v').lean();
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});
app.use('/api/chats', chatsRoutes);
app.use('/api/chats', threadsRoutes);

app.get('/health', (_req, res) => res.json({ ok: true }));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../public')));
  app.get('*', (_req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));
}

async function start() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/treegpt';
  await mongoose.connect(mongoUri);
  app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
