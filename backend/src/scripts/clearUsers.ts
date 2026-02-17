import { connectDB } from '../config/db';
import { User } from '../models/User';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const clearUsers = async () => {
    try {
        console.log('Connecting to DB...');
        await connectDB();

        console.log('Clearing Users collection...');
        await User.deleteMany({});

        console.log('✅ All users cleared.');

        // ensure index
        await User.init();
        console.log('✅ Indexes re-synced.');

    } catch (error) {
        console.error('Clear Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

clearUsers();
