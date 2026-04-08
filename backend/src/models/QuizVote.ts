import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizVote extends Document {
    quizId: mongoose.Types.ObjectId;
    telegramId: string;
    optionIndex: number;
    createdAt: Date;
    updatedAt: Date;
}

const QuizVoteSchema: Schema = new Schema({
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
    telegramId: { type: String, required: true },
    optionIndex: { type: Number, required: true },
}, { timestamps: true });

// Prevent multiple votes by the same user on the same quiz
QuizVoteSchema.index({ quizId: 1, telegramId: 1 }, { unique: true });

export const QuizVote = mongoose.model<IQuizVote>('QuizVote', QuizVoteSchema);
