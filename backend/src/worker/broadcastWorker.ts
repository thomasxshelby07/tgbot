import { Worker } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { bot } from '../bot';
import { InputFile } from 'grammy';
import path from 'path';
import fs from 'fs';
import { cache } from '../utils/cache';
import { User } from '../models/User';

// Cache file_ids locally to avoid hitting Redis for every single user on the same worker
const broadcastFileIdCache: Record<string, string> = {};

export const initWorker = () => {
    const worker = new Worker('broadcast-queue', async (job) => {
        const { userId, message, mediaUrl, buttons } = job.data;

        try {
            const inlineKeyboard = buttons && buttons.length > 0 ? {
                inline_keyboard: buttons.map((btn: any) => [{ text: btn.text, url: btn.url }])
            } : undefined;

            if (mediaUrl) {
                // Improved Logic: Check if it's a local file in 'public/uploads' regardless of domain
                const filename = mediaUrl.split('/').pop();
                const localPath = filename ? path.join(__dirname, '../../public/uploads', filename) : null;
                const isLocalFile = localPath ? fs.existsSync(localPath) : false;

                if (isLocalFile && localPath && filename) {
                    // 1. Try Local Cache (Fastest)
                    if (broadcastFileIdCache[filename]) {
                        await bot.api.sendPhoto(userId, broadcastFileIdCache[filename], {
                            caption: message,
                            reply_markup: inlineKeyboard,
                        });
                        return;
                    }

                    // 2. Try Redis Cache (Shared)
                    const cachedFileId = await cache.get<string>(`file_id:${filename}`);
                    if (cachedFileId) {
                        broadcastFileIdCache[filename] = cachedFileId;
                        await bot.api.sendPhoto(userId, cachedFileId, {
                            caption: message,
                            reply_markup: inlineKeyboard,
                        });
                        return;
                    }

                    // 3. Upload & Cache (First time for this file on this worker)
                    // console.log(`Uploading local file for broadcast: ${localPath}`);
                    const sent = await bot.api.sendPhoto(userId, new InputFile(localPath), {
                        caption: message,
                        reply_markup: inlineKeyboard,
                    });

                    // Cache file_id
                    if (sent.photo && sent.photo.length > 0) {
                        const fileId = sent.photo[sent.photo.length - 1].file_id;
                        broadcastFileIdCache[filename] = fileId;
                        await cache.set(`file_id:${filename}`, fileId, 86400); // 24 hours
                    }
                    return;
                }

                // Public URL
                await bot.api.sendPhoto(userId, mediaUrl, {
                    caption: message,
                    reply_markup: inlineKeyboard,
                });
            } else {
                // Text Only
                await bot.api.sendMessage(userId, message, {
                    reply_markup: inlineKeyboard,
                });
            }
        } catch (error: any) {
            // Error Handling
            const errDesc = error.description?.toLowerCase() || '';

            // Check for various "blocked" or "inactive" states
            // 403 Forbidden: bot was blocked by the user
            // 403 Forbidden: user is deactivated
            // 400 Bad Request: chat not found (Only specific 400s, not ALL 400s)

            const isBlockedError =
                error.error_code === 403 ||
                errDesc.includes('blocked') ||
                errDesc.includes('deactivated') ||
                errDesc.includes('initiated') ||
                errDesc.includes('chat not found');

            if (isBlockedError) {
                console.log(`❌ User ${userId} is broken (Blocked/Deactivated/NotFound). Updating DB... Error: ${error.message}`);

                // Explicitly cast userId to string to ensure matching
                const result = await User.updateOne(
                    { telegramId: userId.toString() },
                    { isBlocked: true }
                );

                console.log(`db update result for ${userId}:`, result);
                return;
            }
            if (error.error_code === 429) {
                // Rate limited, let BullMQ retry with backoff
                throw error;
            }
            console.error(`Failed to send to ${userId}:`, error.message);
            // Throw to trigger retry for transient errors
            throw error;
        }
    }, {
        connection: createRedisConnection() as any,
        concurrency: 20, // INCREASED CONCURRENCY for parallel processing
        limiter: {
            max: 25, // 25 jobs per second
            duration: 1000,
        },
    });

    worker.on('error', (err) => {
        console.error('Worker error:', err);
    });

    worker.on('failed', (job, err) => {
        // console.error(`Broadcast job ${job?.id} failed:`, err.message);
    });

    console.log('✅ Broadcast Worker Initialized (Concurrent: 20, Limit: 25/s)');
};
