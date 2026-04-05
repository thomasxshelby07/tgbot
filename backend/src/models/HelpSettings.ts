import mongoose, { Schema, Document } from 'mongoose';

export interface IHelpSettings extends Document {
    logoUrl: string;
    offerActive: boolean;
    offerText: string;
    offerButtonLabel: string;
    offerButtonUrl: string;
    bottomOfferActive: boolean;
    bottomOfferText: string;
    bottomOfferButtonLabel: string;
    bottomOfferButtonUrl: string;
}

const HelpSettingsSchema: Schema = new Schema(
    {
        logoUrl: { type: String, default: '' },
        offerActive: { type: Boolean, default: false },
        offerText: { type: String, default: '' },
        offerButtonLabel: { type: String, default: '' },
        offerButtonUrl: { type: String, default: '' },
        bottomOfferActive: { type: Boolean, default: false },
        bottomOfferText: { type: String, default: '' },
        bottomOfferButtonLabel: { type: String, default: '' },
        bottomOfferButtonUrl: { type: String, default: '' },
    },
    { timestamps: true }
);

export default mongoose.model<IHelpSettings>('HelpSettings', HelpSettingsSchema);
