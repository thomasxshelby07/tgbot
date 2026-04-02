import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
    sessionId?: mongoose.Types.ObjectId;
    ticketId?: mongoose.Types.ObjectId;
    sender: 'user' | 'admin';
    content: string;
    messageType: 'text' | 'photo' | 'video' | 'audio' | 'voice' | 'document';
    mediaUrl?: string; // Auto-populated if message is an image/video sent by user via bot
    telegramMessageId?: string; // For idempotency
    isRead: boolean;
    createdAt: Date;
}

const ChatMessageSchema: Schema = new Schema({
    sessionId: { type: Schema.Types.ObjectId, ref: 'ChatSession' },
    ticketId: { type: Schema.Types.ObjectId, ref: 'SupportTicket' },
    sender: { type: String, enum: ['user', 'admin'], required: true },
    content: { type: String, default: '' },
    messageType: { type: String, enum: ['text', 'photo', 'video', 'audio', 'voice', 'document'], default: 'text' },
    mediaUrl: { type: String },
    telegramMessageId: { type: String },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Index for getting messages for a session or ticket efficiently
ChatMessageSchema.index({ sessionId: 1, createdAt: 1 });
ChatMessageSchema.index({ ticketId: 1, createdAt: 1 });
ChatMessageSchema.index({ telegramMessageId: 1 }, { unique: true, sparse: true });

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
