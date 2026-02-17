import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { Settings } from './models/Settings';

dotenv.config();

const seed = async () => {
    try {
        await connectDB();
        console.log('Checking for existing settings...');

        const existingSettings = await Settings.findOne();
        if (existingSettings) {
            console.log('✅ Settings already exist:', existingSettings);
        } else {
            console.log('⚠️ No settings found. Creating default settings...');
            const newSettings = new Settings({
                welcomeMessage: "Welcome to the bot! This message is from the database."
            });
            await newSettings.save();
            console.log('✅ Default settings created!');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seed();
