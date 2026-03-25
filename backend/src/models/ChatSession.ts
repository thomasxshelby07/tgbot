import mongoose, { Schema, Document } from 'mongoose';

export interface IChatSession extends Document {
    telegramId: string;
    userId?: mongoose.Types.ObjectId; // Reference to User if we want to fetch user details
    status: 'active' | 'closed';
    createdAt: Date;
    updatedAt: Date;
}

const ChatSessionSchema: Schema = new Schema({
    telegramId: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['active', 'closed'], default: 'active' }
}, { timestamps: true });

// Index for getting latest active sessions efficiently
ChatSessionSchema.index({ status: 1, updatedAt: -1 });
ChatSessionSchema.index({ telegramId: 1, status: 1 });

export const ChatSession = mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
