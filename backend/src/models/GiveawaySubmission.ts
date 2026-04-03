import mongoose, { Schema, Document } from 'mongoose';

export interface IGiveawaySubmission extends Document {
    giveawayId: mongoose.Types.ObjectId;
    telegramId: string;
    firstName: string;
    lastName?: string;
    username?: string;
    dafabetId: string;
    realName: string;
    answers: {
        question: string;
        answer: string;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const GiveawaySubmissionSchema: Schema = new Schema({
    giveawayId: { type: Schema.Types.ObjectId, ref: 'Giveaway', required: true },
    telegramId: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    username: { type: String },
    dafabetId: { type: String, required: true },
    realName: { type: String, required: true },
    answers: [
        {
            question: { type: String, required: true },
            answer: { type: String, required: true }
        }
    ]
}, { timestamps: true });

// Ensure unique submissions for same giveaway by same user
GiveawaySubmissionSchema.index({ giveawayId: 1, telegramId: 1 }, { unique: true });

export const GiveawaySubmission = mongoose.model<IGiveawaySubmission>('GiveawaySubmission', GiveawaySubmissionSchema);
