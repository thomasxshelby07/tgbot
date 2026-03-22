import mongoose, { Document, Schema } from 'mongoose';

export interface IVipMember extends Document {
    telegramId: string;
    name: string;
    phoneNumber: string;
    interest: 'Casino' | 'Cricket' | 'Both';
    createdAt: Date;
}

const VipMemberSchema = new Schema<IVipMember>({
    telegramId: { type: String, required: true },
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    interest: { type: String, enum: ['Casino', 'Cricket', 'Both'], required: true },
    createdAt: { type: Date, default: Date.now },
});

// Index for faster lookups
VipMemberSchema.index({ telegramId: 1 });

export const VipMember = mongoose.model<IVipMember>('VipMember', VipMemberSchema);
