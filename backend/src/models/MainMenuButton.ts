import mongoose, { Document, Schema } from 'mongoose';

export interface IMainMenuButton extends Document {
    text: string;
    order: number;
    active: boolean;

    responseMessage?: string;
    mediaUrl?: string;
    responseButtons?: { text: string; url: string }[];

    createdAt: Date;
}

const MainMenuButtonSchema = new Schema<IMainMenuButton>({
    text: { type: String, required: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },

    responseMessage: { type: String, default: "" },
    mediaUrl: { type: String, default: "" },
    responseButtons: [{
        text: { type: String },
        url: { type: String }
    }],

    createdAt: { type: Date, default: Date.now },
});

// Index for faster lookups by text (used in bot message handler)
MainMenuButtonSchema.index({ text: 1 });

export const MainMenuButton = mongoose.model<IMainMenuButton>('MainMenuButton', MainMenuButtonSchema);
