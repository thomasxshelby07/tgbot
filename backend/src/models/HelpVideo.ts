import mongoose, { Schema, Document } from 'mongoose';

export interface IHelpVideo extends Document {
    title: string;
    description: string;
    videoUrl: string;
    buttonLabel?: string;
    buttonUrl?: string;
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const HelpVideoSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        videoUrl: { type: String, required: true },
        buttonLabel: { type: String, default: '' },
        buttonUrl: { type: String, default: '' },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export const HelpVideo = mongoose.model<IHelpVideo>('HelpVideo', HelpVideoSchema);
