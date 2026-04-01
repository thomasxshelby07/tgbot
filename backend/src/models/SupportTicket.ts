import mongoose, { Schema, Document } from 'mongoose';

export interface ISupportTicket extends Document {
    telegramId: string;
    name: string;
    phoneNumber: string;
    dafabetId: string;
    issueType: 'Withdrawal' | 'Deposit' | 'ID' | 'Other';
    problem: string;
    status: 'open' | 'resolved';
    unreadCount: number;
    updatedAt: Date;
    createdAt: Date;
}

const SupportTicketSchema: Schema = new Schema({
    telegramId: { type: String, required: true },
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    dafabetId: { type: String, required: true },
    issueType: { type: String, enum: ['Withdrawal', 'Deposit', 'ID', 'Other'], required: true },
    problem: { type: String, required: true },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
    unreadCount: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
