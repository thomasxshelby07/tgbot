import { redis } from '../config/redis';

const DEFAULT_TTL = 60 * 5; // 5 minutes

export const cache = {
    get: async <T>(key: string): Promise<T | null> => {
        try {
            const data = await redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (err) {
            console.error(`Cache Get Error (${key}):`, err);
            return null;
        }
    },
    set: async (key: string, value: any, ttl: number = DEFAULT_TTL) => {
        try {
            await redis.set(key, JSON.stringify(value), 'EX', ttl);
        } catch (err) {
            console.error(`Cache Set Error (${key}):`, err);
        }
    },
    del: async (key: string) => {
        try {
            await redis.del(key);
        } catch (err) {
            console.error(`Cache Del Error (${key}):`, err);
        }
    }
};
