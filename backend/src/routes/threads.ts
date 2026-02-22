import express, { Router } from 'express';
import { Chat } from '../models/Chat.js';
import { Message } from '../models/Message.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth as express.RequestHandler);

router.post('/:chatId/messages/:messageId/threads', async (req: express.Request, res) => {
  const authReq = req as AuthRequest;
  const { chatId, messageId } = req.params;
  const parentChat = await Chat.findOne({ _id: chatId, userId: authReq.user!._id });
  if (!parentChat) return res.status(404).json({ error: 'Chat not found' });
  const parentMessage = await Message.findOne({ _id: messageId, chatId: parentChat._id });
  if (!parentMessage) return res.status(404).json({ error: 'Message not found' });

  const rootChatId = parentChat.rootChatId ?? parentChat._id;
  const childChat = await Chat.create({
    userId: authReq.user!._id,
    title: `Thread`,
    parentChatId: parentChat._id,
    parentMessageId: parentMessage._id,
    rootChatId,
  });
  res.status(201).json({ childChatId: childChat._id });
});

router.get('/:chatId/messages/:messageId/threads', async (req: express.Request, res) => {
  const authReq = req as AuthRequest;
  const { chatId, messageId } = req.params;
  const parentChat = await Chat.findOne({ _id: chatId, userId: authReq.user!._id });
  if (!parentChat) return res.status(404).json({ error: 'Chat not found' });
  const threads = await Chat.find({
    userId: authReq.user!._id,
    parentChatId: parentChat._id,
    parentMessageId: messageId,
  })
    .sort({ createdAt: 1 })
    .lean();
  res.json(threads);
});

export default router;
