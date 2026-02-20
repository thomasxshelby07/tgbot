import { Bot, Context, InputFile, Keyboard } from 'grammy';
import { Settings } from '../models/Settings';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { MainMenuButton } from '../models/MainMenuButton';
import { Channel } from '../models/Channel';
import { WelcomeMessage } from '../models/WelcomeMessage';
import fs from 'fs';
import path from 'path';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN || '';

if (!BOT_TOKEN) {
    throw new Error('BOT_TOKEN is not defined in environment variables');
}

export const bot = new Bot(BOT_TOKEN);

// --- Redis Cache System ---
import { cache } from '../utils/cache';

const SETTINGS_KEY = 'bot_settings';
const SETTINGS_TTL = 300; // 5 minutes

// Map filename -> file_id (Telegram's ID for the uploaded file)
// We still keep this in memory for super fast access, but could move to Redis if needed across instances
const fileIdCache: Record<string, string> = {};

// Helper to get settings with caching
async function getSettings() {
    const cached = await cache.get<any>(SETTINGS_KEY);
    if (cached) return cached;

    try {
        const settings = await Settings.findOne();
        if (settings) {
            await cache.set(SETTINGS_KEY, settings, SETTINGS_TTL);
        }
        return settings;
    } catch (error) {
        console.error('Error fetching settings:', error);
        return null;
    }
}

const sendMediaMessage = async (ctx: Context, mediaUrl: string, caption: string, reply_markup: any) => {
    try {
        const isAudio = mediaUrl.match(/\.(mp3|wav|ogg|m4a)$/i);

        // Check cache for existing file_id
        const cachedFileId = fileIdCache[mediaUrl];

        if (cachedFileId) {
            console.log(`🚀 Using cached file_id for: ${mediaUrl}`);
            if (isAudio) {
                await ctx.replyWithAudio(cachedFileId, { caption, reply_markup });
            } else {
                await ctx.replyWithPhoto(cachedFileId, { caption, reply_markup });
            }
            return;
        }

        console.log(`📤 Uploading new media: ${mediaUrl}`);
        let message;
        if (isAudio) {
            message = await ctx.replyWithAudio(mediaUrl, { caption, reply_markup });
        } else {
            message = await ctx.replyWithPhoto(mediaUrl, { caption, reply_markup });
        }

        // Cache the file_id from the sent message
        if (message) {
            let fileId: string | undefined;
            if ('audio' in message && message.audio) {
                fileId = message.audio.file_id;
            } else if ('photo' in message && message.photo) {
                fileId = message.photo.pop()?.file_id;
            }

            if (fileId) {
                fileIdCache[mediaUrl] = fileId;
                console.log(`💾 Cached file_id for ${mediaUrl}: ${fileId}`);
            }
        }

    } catch (error) {
        console.error('Error sending media message:', error);
        // Fallback to text if media fails
        await ctx.reply(caption, { reply_markup });
    }
};

// Initialize bot logic
export const initBot = async () => {
    // Debug logging for incoming messages
    bot.on("message", async (ctx, next) => {
        console.log("📩 MESSAGE RECEIVED:", ctx.message?.text || "Non-text message");
        await next();
    });

    bot.command('start', async (ctx: Context) => {
        // 1. Fire-and-Forget User Tracking (Zero Latency Impact)
        // We do NOT await this.
        if (ctx.from) {
            User.findOneAndUpdate(
                { telegramId: ctx.from.id.toString() },
                {
                    firstName: ctx.from.first_name,
                    lastName: ctx.from.last_name,
                    username: ctx.from.username,
                    isBlocked: false, // Reset blocked status if they restart
                    lastActiveAt: new Date(),
                },
                { upsert: true, new: true }
            ).catch(err => console.error('Background user tracking failed:', err));
        }

        try {
            // 2. fast settings fetch (from cache)
            const settings = await getSettings();

            // 2b. Fetch Main Menu Buttons (Active Only)
            const menuButtons = await MainMenuButton.find({ active: true }).sort({ order: 1 });

            // Build Reply Keyboard
            let replyKeyboard: Keyboard | undefined;
            if (menuButtons.length > 0) {
                const keyboard = new Keyboard();
                menuButtons.forEach((btn, index) => {
                    keyboard.text(btn.text);
                    // 2 buttons per row
                    if ((index + 1) % 2 === 0) {
                        keyboard.row();
                    }
                });
                keyboard.resized(); // Resize to fit
                replyKeyboard = keyboard;
            }

            const welcomeMessage = settings?.welcomeMessage || "Welcome to the bot!";
            const buttons = settings?.welcomeMessageButtons || [];

            const inlineKeyboard = buttons.length > 0 ? {
                inline_keyboard: buttons.map((btn: any) => [{ text: btn.text, url: btn.url }])
            } : undefined;

            const sendMenu = async () => {
                if (replyKeyboard) {
                    await ctx.reply("👇", { reply_markup: replyKeyboard });
                }
            };

            // Send welcome message (Text or Photo/Video)
            if (settings?.welcomeMessageMediaUrl) {
                await sendMediaMessage(ctx, settings.welcomeMessageMediaUrl, welcomeMessage, inlineKeyboard);
            } else {
                await ctx.reply(welcomeMessage, { reply_markup: inlineKeyboard });
            }

            await sendMenu();
        } catch (error) {
            console.error('Error in /start command:', error);
            // Don't leak error details to user, just fail silently or generic
        }
    });

    // 4. Real-time Block/Unblock Detection (The "Pro" Way)
    bot.on('my_chat_member', async (ctx) => {
        const status = ctx.myChatMember.new_chat_member.status;
        const oldStatus = ctx.myChatMember.old_chat_member.status;
        const userId = ctx.from.id.toString();

        console.log(`🔄 Chat Member Update for ${userId}: ${oldStatus} -> ${status}`);

        if (status === 'kicked') {
            // User blocked the bot
            console.log(`🚫 User ${userId} blocked the bot.`);
            await User.updateOne({ telegramId: userId }, { isBlocked: true });
        } else if (status === 'member' && oldStatus === 'kicked') {
            // User unblocked the bot
            console.log(`✅ User ${userId} unblocked the bot.`);
            await User.updateOne(
                { telegramId: userId },
                {
                    isBlocked: false,
                    lastActiveAt: new Date()
                }
            );
        }
    });

    // 5. Handle Menu Button Clicks (General Text Handler)
    bot.on("message:text", async (ctx) => {
        const text = ctx.message.text;

        // Ignore commands
        if (text.startsWith('/')) return;

        try {
            // Check if this text matches a menu button
            const button = await MainMenuButton.findOne({ text: text, active: true });

            if (button) {
                // Use dynamic response from database
                const responseMessage = button.responseMessage || `You selected: ${text}`;
                const responseButtons = button.responseButtons || [];

                // Build inline keyboard if buttons exist
                const inlineKeyboard = responseButtons.length > 0 ? {
                    inline_keyboard: responseButtons.map((btn: any) => [{ text: btn.text, url: btn.url }])
                } : undefined;

                // Send response (Text or Photo/Video)
                if (button.mediaUrl) {
                    await sendMediaMessage(ctx, button.mediaUrl, responseMessage, inlineKeyboard);
                } else {
                    await ctx.reply(responseMessage, { reply_markup: inlineKeyboard });
                }
            }
        } catch (error) {
            console.error("Error handling text message:", error);
        }
    });

    // 6. Handle Join Requests
    bot.on("chat_join_request", async (ctx) => {
        const chatId = ctx.chat.id.toString();
        const userId = ctx.from.id; // Keep as number for API calls
        const userIdStr = userId.toString(); // String for DB

        console.log(`👤 Join Request: User ${userId} -> Channel ${chatId}`);

        try {
            // 1. Find Channel
            const channel = await Channel.findOne({ chatId });
            if (!channel || !channel.active) {
                console.log(`⚠️ Channel ${chatId} not registered or inactive.`);
                return;
            }

            // 2. Approve Request
            await ctx.approveChatJoinRequest(userId);
            console.log(`✅ Approved join request for User ${userId}`);

            // 3. Find Welcome Message
            const welcome = await WelcomeMessage.findOne({ channelId: channel._id });
            if (!welcome || !welcome.enabled) {
                console.log(`ℹ️ No enabled welcome message for Channel ${channel.name}`);
                return;
            }

            // 4. Personalize Message
            let text = welcome.messageText
                .replace("{first_name}", ctx.from.first_name)
                .replace("{channel_name}", channel.name);

            // 5. Save User
            await User.findOneAndUpdate(
                { telegramId: userIdStr },
                {
                    firstName: ctx.from.first_name,
                    lastName: ctx.from.last_name,
                    username: ctx.from.username,
                    isBlocked: false,
                    lastActiveAt: new Date(),
                    joinedFrom: channel._id,
                    joinedAt: new Date()
                },
                { upsert: true, new: true }
            );

            // 6. Send Message (with optional buttons and media)
            const sendWelcome = async () => {
                const inlineKeyboard = welcome.buttonText && welcome.buttonUrl ? {
                    inline_keyboard: [[{ text: welcome.buttonText, url: welcome.buttonUrl }]]
                } : undefined;

                if (welcome.mediaUrl) {
                    // We need to send DM, so we can't use ctx.reply (which replies to the chat/channel context)
                    // We use ctx.api.sendPhoto / sendMessage directly to userId
                    try {
                        const isAudio = welcome.mediaUrl.match(/\.(mp3|wav|ogg|m4a)$/i);
                        if (isAudio) {
                            await ctx.api.sendAudio(userId, welcome.mediaUrl, { caption: text, reply_markup: inlineKeyboard });
                        } else {
                            await ctx.api.sendPhoto(userId, welcome.mediaUrl, { caption: text, reply_markup: inlineKeyboard });
                        }
                    } catch (mediaErr) {
                        console.error('Failed to send media DM:', mediaErr);
                        await ctx.api.sendMessage(userId, text, { reply_markup: inlineKeyboard });
                    }
                } else {
                    await ctx.api.sendMessage(userId, text, { reply_markup: inlineKeyboard });
                }
            };

            if (welcome.delaySec > 0) {
                setTimeout(sendWelcome, welcome.delaySec * 1000);
            } else {
                await sendWelcome();
            }

        } catch (error) {
            console.error('❌ Error handling join request:', error);
        }
    });

    console.log('✅ Bot commands initialized (Optimized Speed)');
};
