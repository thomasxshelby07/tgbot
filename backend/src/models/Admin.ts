import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
    email: string;
    passwordHash: string;
    role: 'superadmin' | 'admin';
    permissions: string[]; // e.g. ['all'], ['deposit_withdraw'], ['id_other']
    tokenVersion: number;
    createdAt: Date;
    updatedAt: Date;
}

const AdminSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['superadmin', 'admin'], default: 'admin' },
    permissions: [{ type: String }],
    tokenVersion: { type: Number, default: 0 }
}, { timestamps: true });

AdminSchema.index({ email: 1 });

export const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);
