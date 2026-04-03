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

    // Support Settings
    supportButtonText: string;
    supportActive: boolean;

    // Giveaway Settings
    giveawayButtonText: string;
    giveawayActive: boolean;
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
    vipActive: { type: Boolean, default: true },

    // Support Settings
    supportButtonText: { type: String, default: "🆘 Help & Support" },
    supportActive: { type: Boolean, default: true },

    // Live Chat Settings
    chatButtonText: { type: String, default: "💬 Live Chat" },
    chatActive: { type: Boolean, default: true },
 
    // Giveaway Settings
    giveawayButtonText: { type: String, default: "🎁 Giveaway Offer" },
    giveawayActive: { type: Boolean, default: false }
});
export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);
