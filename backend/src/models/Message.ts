import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    index: { type: Number, required: true },
  },
  { timestamps: true }
);

messageSchema.index({ chatId: 1, index: 1 }, { unique: true });

export const Message = mongoose.model('Message', messageSchema);
