import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
    welcomeMessage: string;
    welcomeMessageMediaUrl?: string;
    welcomeMessageButtons?: { text: string; url: string }[];

    // VIP Settings
    vipButtonText: string;
    vipWelcomeMessage: string;
    vipChannelLink: string;
    vipActive: boolean;
}

const SettingsSchema: Schema = new Schema({
    welcomeMessage: { type: String, required: true, default: "Welcome to the bot!" },
    welcomeMessageMediaUrl: { type: String, default: "" },
    welcomeMessageButtons: [{
        text: { type: String, required: true },
        url: { type: String, required: true }
    }],

    // VIP Settings
    vipButtonText: { type: String, default: "🌟 JOIN VIP" },
    vipWelcomeMessage: { type: String, default: "Welcome to VIP Registration! Please provide your details." },
    vipChannelLink: { type: String, default: "" },
    vipActive: { type: Boolean, default: true }
});
export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);
