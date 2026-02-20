import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    telegramId: string;
    firstName: string;
    lastName?: string;
    username?: string;
    isBlocked?: boolean;
    lastActiveAt?: Date;
    joinedFrom?: mongoose.Types.ObjectId; // Reference to Channel
    joinedAt: Date;
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
    joinedFrom: { type: Schema.Types.ObjectId, ref: 'Channel' },
    joinedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Index for getting latest users efficiently
UserSchema.index({ createdAt: -1 });
UserSchema.index({ telegramId: 1, isBlocked: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
