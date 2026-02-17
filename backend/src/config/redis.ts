import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Singleton Redis instance for general use (Caching, etc.)
export const redis = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
});

// Helper to create new connections (BullMQ needs separate connections for blocking commands)
export const createRedisConnection = () => new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
});

redis.on('connect', () => console.log('✅ Redis Connected'));
redis.on('error', (err) => console.error('❌ Redis Connection Error:', err));
