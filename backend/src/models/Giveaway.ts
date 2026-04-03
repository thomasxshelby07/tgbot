import mongoose, { Schema, Document } from 'mongoose';

export interface IGiveaway extends Document {
    title: string;
    description: string;
    mediaUrl?: string;
    mediaType?: 'photo' | 'video' | 'audio';
    active: boolean;
    questions: {
        question: string;
        type: 'text' | 'options';
        options: string[];
    }[];
    buttonText: string;
    createdAt: Date;
    updatedAt: Date;
}

const GiveawaySchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String, default: "" },
    mediaUrl: { type: String, default: "" },
    mediaType: { type: String, enum: ['photo', 'video', 'audio', ''], default: "" },
    active: { type: Boolean, default: false },
    questions: [
        {
            question: { type: String, required: true },
            type: { type: String, enum: ['text', 'options'], default: 'text' },
            options: [{ type: String }]
        }
    ],
    buttonText: { type: String, default: "🎁 Giveaway Offer" }
}, { timestamps: true });

export const Giveaway = mongoose.model<IGiveaway>('Giveaway', GiveawaySchema);
