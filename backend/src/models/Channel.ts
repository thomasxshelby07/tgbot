import mongoose, { Schema, Document } from 'mongoose';

export interface IChannel extends Document {
    chatId: string;
    name: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ChannelSchema: Schema = new Schema({
    chatId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    active: { type: Boolean, default: true },
}, { timestamps: true });

export const Channel = mongoose.model<IChannel>('Channel', ChannelSchema);
