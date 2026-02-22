import express, { Router } from 'express';
import mongoose from 'mongoose';
import { Chat } from '../models/Chat.js';
import { Message } from '../models/Message.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { chat as openaiChat } from '../services/openai.js';

const router = Router();

router.use(requireAuth as express.RequestHandler);

router.get('/', async (req: express.Request, res) => {
  const authReq = req as AuthRequest;
  const chats = await Chat.find({ userId: authReq.user!._id, parentChatId: null })
    .sort({ updatedAt: -1 })
    .lean();
  res.json(chats);
});

router.post('/', async (req: express.Request, res) => {
  const authReq = req as AuthRequest;
  const _id = new mongoose.Types.ObjectId();
  const chat = await Chat.create({
    _id,
    userId: authReq.user!._id,
    title: 'New Chat',
    rootChatId: _id,
  });
  res.status(201).json(chat);
});

router.get('/:chatId', async (req: express.Request, res) => {
  const authReq = req as AuthRequest;
  const chat = await Chat.findOne({ _id: req.params.chatId, userId: authReq.user!._id }).lean();
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  res.json(chat);
});

router.get('/:chatId/messages', async (req: express.Request, res) => {
  const authReq = req as AuthRequest;
  const chat = await Chat.findOne({ _id: req.params.chatId, userId: authReq.user!._id });
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  const messages = await Message.find({ chatId: chat._id }).sort({ index: 1 }).lean();
  res.json(messages);
});

async function buildContextMessages(chatId: string, parentChatId?: string, parentMessageId?: string) {
  if (!parentChatId || !parentMessageId) {
    const messages = await Message.find({ chatId }).sort({ index: 1 }).lean();
    return messages.map((m) => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content }));
  }
  const parentChat = await Chat.findById(parentChatId).lean();
  if (!parentChat) return [];
  const parentMessage = await Message.findById(parentMessageId).lean();
  if (!parentMessage) return [];
  const parentMessages = await Message.find({ chatId: parentChatId, index: { $lte: parentMessage.index } })
    .sort({ index: 1 })
    .lean();
  const childMessages = await Message.find({ chatId }).sort({ index: 1 }).lean();
  const combined = [...parentMessages, ...childMessages].map((m) => ({
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.content,
  }));
  return combined;
}

router.post('/:chatId/send', async (req: express.Request, res) => {
  const authReq = req as AuthRequest;
  const { chatId } = req.params;
  const { content } = req.body as { content?: string };
  if (!content || typeof content !== 'string') return res.status(400).json({ error: 'content required' });

  const chat = await Chat.findOne({ _id: chatId, userId: authReq.user!._id });
  if (!chat) return res.status(404).json({ error: 'Chat not found' });

  const nextIndex = await Message.countDocuments({ chatId: chat._id });
  const userMsg = await Message.create({
    chatId: chat._id,
    userId: authReq.user!._id,
    role: 'user',
    content: content.trim(),
    index: nextIndex,
  });

  const contextMessages = await buildContextMessages(
    chat._id.toString(),
    chat.parentChatId?.toString(),
    chat.parentMessageId?.toString()
  );
  const messagesForApi = [...contextMessages.map((m) => ({ role: m.role, content: m.content })), { role: 'user' as const, content: content.trim() }];
  const assistantContent = await openaiChat(messagesForApi);

  const assistantMsg = await Message.create({
    chatId: chat._id,
    userId: authReq.user!._id,
    role: 'assistant',
    content: assistantContent,
    index: nextIndex + 1,
  });

  await Chat.updateOne({ _id: chat._id }, { updatedAt: new Date(), title: content.slice(0, 50) || chat.title });

  res.status(201).json({ userMessage: userMsg, assistantMessage: assistantMsg });
});

export default router;
