import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
    welcomeMessage: string;
    welcomeMessageMediaUrl?: string;
    welcomeMessageButtons?: { text: string; url: string }[];
}

const SettingsSchema: Schema = new Schema({
    welcomeMessage: { type: String, required: true, default: "Welcome to the bot!" },
    welcomeMessageMediaUrl: { type: String, default: "" },
    welcomeMessageButtons: [{
        text: { type: String, required: true },
        url: { type: String, required: true }
    }]
});
export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);
