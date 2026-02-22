import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    parentChatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', index: true },
    parentMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    rootChatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
  },
  { timestamps: true }
);

export const Chat = mongoose.model('Chat', chatSchema);
