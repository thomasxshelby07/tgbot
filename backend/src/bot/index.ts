import { Bot, Context, InputFile, Keyboard, session, SessionFlavor, InlineKeyboard } from 'grammy';
import { RedisAdapter } from "@grammyjs/storage-redis";
import { redis } from "../config/redis";
import { Settings } from '../models/Settings';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { MainMenuButton } from '../models/MainMenuButton';
import { VipMember } from '../models/VipMember';
import { SupportTicket } from '../models/SupportTicket';
import { Channel } from '../models/Channel';
import { WelcomeMessage } from '../models/WelcomeMessage';

// --- Session Logic ---
interface SessionData {
    step?: 'name' | 'number' | 'interest' | 'review' | 
           'support_type' | 'support_name' | 'support_number' | 'support_id' | 'support_problem' | 'support_review';
    vipName?: string;
    vipNumber?: string;
    vipInterest?: 'Cricket' | 'Casino' | 'Both';
    
    // Support Data
    supportType?: string;
    supportName?: string;
    supportNumber?: string;
    supportId?: string;
    supportProblem?: string;
}
type MyContext = Context & SessionFlavor<SessionData>;
import fs from 'fs';
import path from 'path';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN || '';

if (!BOT_TOKEN) {
    throw new Error('BOT_TOKEN is not defined in environment variables');
}

export const bot = new Bot<MyContext>(BOT_TOKEN);

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

const sendMediaMessage = async (ctx: Context, mediaUrl: string, caption: string, reply_markup: any, mediaType?: string) => {
    try {
        const isAudio = mediaUrl.match(/\.(mp3|wav|ogg|m4a)$/i);
        const isVideo = mediaType === 'video' || mediaUrl.match(/\.(mp4|webm|mov|avi|mpeg)$/i);

        // Check cache for existing file_id
        const cachedFileId = fileIdCache[mediaUrl];

        if (cachedFileId) {
            console.log(`🚀 Using cached file_id for: ${mediaUrl}`);
            if (isAudio) {
                await ctx.replyWithAudio(cachedFileId, { caption, reply_markup });
            } else if (isVideo) {
                await ctx.replyWithVideo(cachedFileId, { caption, reply_markup });
            } else {
                await ctx.replyWithPhoto(cachedFileId, { caption, reply_markup });
            }
            return;
        }

        console.log(`📤 Uploading new media: ${mediaUrl} (type: ${isVideo ? 'video' : isAudio ? 'audio' : 'image'})`);
        let message;
        if (isAudio) {
            message = await ctx.replyWithAudio(mediaUrl, { caption, reply_markup });
        } else if (isVideo) {
            message = await ctx.replyWithVideo(mediaUrl, { caption, reply_markup });
        } else {
            message = await ctx.replyWithPhoto(mediaUrl, { caption, reply_markup });
        }

        // Cache the file_id from the sent message for super-fast future sends
        if (message) {
            let fileId: string | undefined;
            if ('audio' in message && message.audio) {
                fileId = message.audio.file_id;
            } else if ('video' in message && message.video) {
                fileId = message.video.file_id;
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
    // 0. Use session middleware with Redis Storage (Persistent across clusters)
    const storage = new RedisAdapter({ instance: redis });
    bot.use(session({ initial: (): SessionData => ({}), storage }));

    // Debug logging for incoming messages
    bot.on("message", async (ctx, next) => {
        console.log("📩 MESSAGE RECEIVED:", ctx.message?.text || "Non-text message", "| Step:", ctx.session?.step || "none");
        await next();
    });

    bot.command('start', async (ctx: MyContext) => {
        // ... (User tracking logic)
        if (ctx.from) {
            User.findOneAndUpdate(
                { telegramId: ctx.from.id.toString() },
                {
                    firstName: ctx.from.first_name,
                    lastName: ctx.from.last_name,
                    username: ctx.from.username,
                    isBlocked: false,
                    lastActiveAt: new Date(),
                },
                { upsert: true, new: true }
            ).catch(err => console.error('Background user tracking failed:', err));
        }

        try {
            const settings = await getSettings();
            const menuButtons = await MainMenuButton.find({ active: true }).sort({ order: 1 });

            let replyKeyboard: Keyboard | undefined;
            if (menuButtons.length > 0 || settings?.vipActive || settings?.supportActive) {
                const keyboard = new Keyboard().resized();
                
                // Add VIP and Support buttons in one row if both active
                if (settings?.vipActive || settings?.supportActive) {
                    if (settings?.vipActive) keyboard.text(settings.vipButtonText || "🌟 JOIN VIP");
                    if (settings?.supportActive) keyboard.text(settings.supportButtonText || "🆘 Help & Support");
                    keyboard.row();
                }

                menuButtons.forEach((btn, index) => {
                    keyboard.text(btn.text);
                    if ((index + 1) % 2 === 0) keyboard.row();
                });
                keyboard.resized();
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
        if (text.startsWith('/')) return;

        try {
            const settings = await getSettings();
            const step = ctx.session?.step;

            console.log(`🤖 BOT LOGIC: Text: "${text}" | Current Step: "${step}"`);

            // --- Help & Support Flow ---
            if (step === 'support_name') {
                ctx.session.supportName = text;
                ctx.session.step = 'support_number';
                return await ctx.reply("✅ Name received! / नाम मिल गया!\n\nNow please enter your Mobile Number: / अब अपना मोबाइल नंबर दर्ज करें:");
            }

            if (step === 'support_number') {
                ctx.session.supportNumber = text;
                ctx.session.step = 'support_id';
                return await ctx.reply("✅ Number received! / नंबर मिल गया!\n\nPlease enter your Dafabet ID: / कृपया अपनी Dafabet ID दर्ज करें:");
            }

            if (step === 'support_id') {
                ctx.session.supportId = text;
                ctx.session.step = 'support_problem';
                return await ctx.reply("✅ ID received! / ID मिल गई!\n\nPlease describe your problem: / कृपया अपनी समस्या का वर्णन करें (Type here):");
            }

            if (step === 'support_problem') {
                ctx.session.supportProblem = text;
                ctx.session.step = 'support_review';

                const summary = `📝 *Support Request Summary*\n\n📋 Issue Type: ${ctx.session.supportType}\n👤 Name: ${ctx.session.supportName}\n📞 Number: ${ctx.session.supportNumber}\n🆔 Dafabet ID: ${ctx.session.supportId}\n❓ Problem: ${text}\n\nClick below to submit! / सबमिट करने के लिए नीचे क्लिक करें!`;

                const keyboard = new InlineKeyboard().text("✅ Submit Ticket / टिकट जमा करें", "support_submit");
                return await ctx.reply(summary, { parse_mode: "Markdown", reply_markup: keyboard });
            }

            // --- VIP Registration Flow ---
            if (step === 'name') {
                ctx.session.vipName = text;
                ctx.session.step = 'number';
                console.log(`➡️ Moving to Number step for User ${ctx.from?.id}`);
                return await ctx.reply("✅ Name received! / नाम मिल गया!\n\nNow please enter your Mobile Number: / अब अपना मोबाइल नंबर दर्ज करें:");
            }

            if (step === 'number') {
                ctx.session.vipNumber = text;
                ctx.session.step = 'interest';
                console.log(`➡️ Moving to Interest step for User ${ctx.from?.id}`);

                const keyboard = new InlineKeyboard()
                    .text("1. Cricket 🏏", "vip_interest_Cricket")
                    .text("2. Casino 🎰", "vip_interest_Casino").row()
                    .text("3. Both / दोनों 🏏🎰", "vip_interest_Both");

                return await ctx.reply("Please select your Interest: / अपनी रुचि चुनें:", { reply_markup: keyboard });
            }

            // Check if this text matches the VIP Button
            if (settings?.vipActive && text === settings.vipButtonText) {
                console.log(`🌟 VIP Button Clicked by User ${ctx.from?.id}`);

                // Check if already a member
                const existingMember = await VipMember.findOne({ telegramId: ctx.from?.id.toString() });
                if (existingMember) {
                    console.log(`✅ User ${ctx.from?.id} is already a VIP member. Sending link directly.`);
                    const channelLink = settings?.vipChannelLink || "";
                    const keyboard = channelLink ? new InlineKeyboard().url("🚀 Join VIP Channel Now / अभी VIP चैनल से जुड़ें", channelLink) : undefined;
                    
                    return await ctx.reply(
                        "✅ You are already a VIP member! / आप पहले से ही एक VIP सदस्य हैं!\n\nClick below to join: / शामिल होने के लिए नीचे क्लिक करें:",
                        { reply_markup: keyboard }
                    );
                }

                // Send Welcome Message first
                await ctx.reply(settings.vipWelcomeMessage || "Welcome to VIP Registration! / VIP पंजीकरण में आपका स्वागत है!");
                
                // Then ask for Name immediately
                ctx.session.step = 'name';
                return await ctx.reply("Please enter your Full Name: / अपना पूरा नाम दर्ज करें:");
            }

            // Check if this text matches the Help & Support Button
            if (settings?.supportActive && text === settings.supportButtonText) {
                console.log(`🆘 Help & Support Button Clicked by User ${ctx.from?.id}`);
                ctx.session.step = 'support_type';

                const keyboard = new InlineKeyboard()
                    .text("Withdrawal 💳", "support_type_Withdrawal")
                    .text("Deposit 📥", "support_type_Deposit").row()
                    .text("ID Issue 🆔", "support_type_ID")
                    .text("Other ❓", "support_type_Other");

                return await ctx.reply("What issue are you facing? / आपको किस तरह की समस्या हो रही है?", { reply_markup: keyboard });
            }

            // --- Standard Menu Buttons ---
            const button = await MainMenuButton.findOne({ text: text, active: true });

            if (button) {
                const responseMessage = button.responseMessage || `You selected: ${text}`;
                const responseButtons = button.responseButtons || [];
                const inlineKeyboard = responseButtons.length > 0 ? {
                    inline_keyboard: responseButtons.map((btn: any) => [{ text: btn.text, url: btn.url }])
                } : undefined;

                if (button.mediaUrl) {
                    await sendMediaMessage(ctx, button.mediaUrl, responseMessage, inlineKeyboard as any, button.mediaType);
                } else {
                    await ctx.reply(responseMessage, { reply_markup: inlineKeyboard as any });
                }
            }
        } catch (error) {
            console.error("Error handling text message:", error);
        }
    });

    // 5b. Handle VIP Interest Selection (Callback Query)
    bot.callbackQuery(/^vip_interest_(.+)$/, async (ctx) => {
        const interest = ctx.match[1] as 'Cricket' | 'Casino' | 'Both';
        
        if (ctx.session.step !== 'interest') return await ctx.answerCallbackQuery("Expired session. Please start again.");

        ctx.session.vipInterest = interest;
        ctx.session.step = 'review';

        const name = ctx.session.vipName;
        const number = ctx.session.vipNumber;

        await ctx.answerCallbackQuery(`Selected: ${interest}`);

        const summary = `📝 *Registration Summary / पंजीकरण सारांश*\n\n👤 Name / नाम: ${name}\n📞 Number / नंबर: ${number}\n🎯 Interest / रुचि: ${interest}\n\nClick below to submit your details and get the VIP link! / अपने विवरण जमा करने और VIP लिंक प्राप्त करने के लिए नीचे क्लिक करें!`;

        const keyboard = new InlineKeyboard().text("✅ Submit Details / विवरण जमा करें", "vip_submit");

        await ctx.editMessageText(summary, {
            parse_mode: "Markdown",
            reply_markup: keyboard
        });
    });

    // 5c. Final VIP Submission
    bot.callbackQuery("vip_submit", async (ctx) => {
        if (ctx.session.step !== 'review') return await ctx.answerCallbackQuery("Invalid request.");

        try {
            const name = ctx.session.vipName || "Unknown";
            const number = ctx.session.vipNumber || "N/A";
            const interest = ctx.session.vipInterest as 'Cricket' | 'Casino' | 'Both';
            const telegramId = ctx.from.id.toString();

            // Save to Database
            await VipMember.findOneAndUpdate(
                { telegramId },
                { name, phoneNumber: number, interest },
                { upsert: true, new: true }
            );

            // Clear Session
            ctx.session.step = undefined;
            ctx.session.vipName = undefined;
            ctx.session.vipNumber = undefined;
            ctx.session.vipInterest = undefined;

            await ctx.answerCallbackQuery("Submitted! / जमा हो गया!");
            
            // Send final message with channel link
            const settings = await getSettings();
            const channelLink = settings?.vipChannelLink || "";

            const keyboard = channelLink ? new InlineKeyboard().url("🚀 Join VIP Channel Now / अभी VIP चैनल से जुड़ें", channelLink) : undefined;

            await ctx.editMessageText(`✅ Success! Your details are saved. / सफलता! आपके विवरण सहेज लिए गए हैं।\n\nAb niche button pe click karke VIP join karein: / अब नीचे दिए गए बटन पर क्लिक करके VIP में शामिल हों:`, {
                reply_markup: keyboard
            });

        } catch (error) {
            console.error("Error saving VIP member:", error);
            await ctx.answerCallbackQuery("Error occurred. Please try again.");
        }
    });

    // 5d. Handle Support Type Selection
    bot.callbackQuery(/^support_type_(.+)$/, async (ctx) => {
        const type = ctx.match[1];
        if (ctx.session.step !== 'support_type') return await ctx.answerCallbackQuery("Expired session. / सत्र समाप्त हो गया।");

        ctx.session.supportType = type;
        ctx.session.step = 'support_name';
        
        await ctx.answerCallbackQuery(`Selected: ${type}`);
        await ctx.editMessageText(`✅ Issue Type: ${type}\n\nPlease enter your Full Name: / अपना पूरा नाम दर्ज करें:`);
    });

    // 5e. Final Support Ticket Submission
    bot.callbackQuery("support_submit", async (ctx) => {
        if (ctx.session.step !== 'support_review') return await ctx.answerCallbackQuery("Invalid request.");

        try {
            const { supportName, supportNumber, supportId, supportType, supportProblem } = ctx.session;
            const telegramId = ctx.from.id.toString();

            // Save to Database
            await SupportTicket.create({
                telegramId,
                name: supportName,
                phoneNumber: supportNumber,
                dafabetId: supportId,
                issueType: supportType,
                problem: supportProblem
            });

            // Clear Session
            ctx.session.step = undefined;
            ctx.session.supportName = undefined;
            ctx.session.supportNumber = undefined;
            ctx.session.supportId = undefined;
            ctx.session.supportProblem = undefined;
            ctx.session.supportType = undefined;

            await ctx.answerCallbackQuery("Ticket submitted! / टिकट जमा हो गया!");
            
            await ctx.editMessageText("✅ Aapka issue register ho gaya hai. 30 minute ke andar humari support team aapse call ya WhatsApp pe connect karegi. Dhanyawad aur aapka issue jaldi hi solve kar diya jayega.");

        } catch (error) {
            console.error("Error saving support ticket:", error);
            await ctx.answerCallbackQuery("Error occurred. Try again.");
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
