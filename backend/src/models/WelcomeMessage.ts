import mongoose, { Schema, Document } from 'mongoose';

export interface IWelcomeMessage extends Document {
    channelId: mongoose.Types.ObjectId;
    messageText: string;
    buttonText?: string;
    buttonUrl?: string;
    mediaUrl?: string;
    delaySec: number;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const WelcomeMessageSchema: Schema = new Schema({
    channelId: { type: Schema.Types.ObjectId, ref: 'Channel', required: true, unique: true },
    messageText: { type: String, required: true },
    buttonText: { type: String },
    buttonUrl: { type: String },
    mediaUrl: { type: String },
    delaySec: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
}, { timestamps: true });

export const WelcomeMessage = mongoose.model<IWelcomeMessage>('WelcomeMessage', WelcomeMessageSchema);
