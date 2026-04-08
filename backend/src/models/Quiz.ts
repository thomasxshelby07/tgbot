import mongoose, { Schema, Document } from 'mongoose';

export interface IQuiz extends Document {
    question: string;
    options: string[];
    status: 'active' | 'closed';
    totalBroadcasted: number;
    createdAt: Date;
    updatedAt: Date;
}

const QuizSchema: Schema = new Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    status: { type: String, enum: ['active', 'closed'], default: 'active' },
    totalBroadcasted: { type: Number, default: 0 },
}, { timestamps: true });

export const Quiz = mongoose.model<IQuiz>('Quiz', QuizSchema);
