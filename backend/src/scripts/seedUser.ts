import { connectDB } from '../config/db';
import { User } from '../models/User';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const seed = async () => {
    try {
        console.log('Connecting to DB...');
        console.log('MONGO_URI loaded:', process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 20) + '...' : 'undefined');
        await connectDB();

        console.log('Creating test user...');
        const testUser = {
            telegramId: 123456789,
            firstName: 'Test',
            lastName: 'User',
            username: 'testuser',
        };

        const user = await User.findOneAndUpdate(
            { telegramId: testUser.telegramId },
            testUser,
            { upsert: true, new: true }
        );

        console.log('Test User Saved:', user);

        const count = await User.countDocuments();
        console.log('Total Users:', count);

    } catch (error) {
        console.error('Seed Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

seed();
