import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    telegramId: string;
    firstName: string;
    lastName?: string;
    username?: string;
    isBlocked?: boolean;
    lastActiveAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema({
    telegramId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String },
    username: { type: String },
    isBlocked: { type: Boolean, default: false },
    lastActiveAt: { type: Date },
}, { timestamps: true });

// Index for getting latest users efficiently
UserSchema.index({ createdAt: -1 });
UserSchema.index({ telegramId: 1, isBlocked: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
