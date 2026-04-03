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
import { ChatSession } from '../models/ChatSession';
import { ChatMessage } from '../models/ChatMessage';
import { Giveaway } from '../models/Giveaway';
import { GiveawaySubmission } from '../models/GiveawaySubmission';
import cloudinary from '../config/cloudinary';

// --- Session Logic ---
interface SessionData {
    step?: string;
    language?: 'en' | 'hi';
    vipName?: string;
    vipNumber?: string;
    vipInterest?: 'Cricket' | 'Casino' | 'Both';
    
    // Support Data
    supportType?: string;
    supportName?: string;
    supportNumber?: string;
    supportId?: string;
    supportProblem?: string;

    // Giveaway Data
    giveawayStep?: number;
    giveawayAnswers?: { question: string; answer: string }[];
    currentGiveawayId?: string;
    giveawayRealName?: string;
    giveawayDafabetId?: string;
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
        const isAudio = mediaType === 'audio' || mediaUrl.match(/\.(mp3|wav|ogg|m4a)$/i);
        const isVideo = mediaType === 'video' || mediaUrl.match(/\.(mp4|webm|mov|avi|mpeg)$/i);

        // Check cache for existing file_id
        const cachedFileId = fileIdCache[mediaUrl];

        if (cachedFileId) {
            console.log(`🚀 Using cached file_id for: ${mediaUrl}`);
            try {
                if (isAudio) {
                    await ctx.replyWithAudio(cachedFileId, { caption, reply_markup, parse_mode: "Markdown" });
                } else if (isVideo) {
                    await ctx.replyWithVideo(cachedFileId, { caption, reply_markup, parse_mode: "Markdown" });
                } else {
                    await ctx.replyWithPhoto(cachedFileId, { caption, reply_markup, parse_mode: "Markdown" });
                }
                return;
            } catch (err) {
                 console.log("Cached file_id expired or invalid. Re-uploading.");
                 delete fileIdCache[mediaUrl];
            }
        }

        console.log(`📤 Uploading new media: ${mediaUrl} (type: ${isVideo ? 'video' : isAudio ? 'audio' : 'image'})`);
        let message;
        
        const sendMediaWithMode = async (urlOrFile: string | InputFile, markdown: boolean) => {
            const isCaptionTooLong = caption && caption.length > 1024;
            const mediaCaption = isCaptionTooLong ? "" : caption;
            // Only attach reply_markup to the media if we are NOT sending a separate text message
            const mediaOpts: any = { caption: mediaCaption, reply_markup: isCaptionTooLong ? undefined : reply_markup, parse_mode: markdown ? "Markdown" : undefined };
            
            let sentMessage;
            if (isAudio) sentMessage = await ctx.replyWithAudio(urlOrFile, mediaOpts);
            else if (isVideo) sentMessage = await ctx.replyWithVideo(urlOrFile, mediaOpts);
            else sentMessage = await ctx.replyWithPhoto(urlOrFile, mediaOpts);

            if (isCaptionTooLong) {
                // Send the long text as a separate message
                await ctx.reply(caption, { reply_markup, parse_mode: markdown ? "Markdown" : undefined });
            }
            
            return sentMessage;
        };

        try {
            message = await sendMediaWithMode(mediaUrl, true);
        } catch (error: any) {
            console.warn(`URL/Markdown sending failed: ${error.message}. Retrying via Stream & fallback...`);
            
            try {
                console.log(`Attempting native stream fetch to buffer for: ${mediaUrl}`);
                // Download file locally into a buffer and upload to TG to bypass all URL size limits and fetch issues
                const response = await fetch(mediaUrl);
                if (!response.ok) throw new Error(`HTTP ${response.status} from Cloudinary`);
                
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const fileExt = isAudio ? 'media.mp3' : isVideo ? 'media.mp4' : 'media.jpg';
                const inputFile = new InputFile(buffer, fileExt);

                message = await sendMediaWithMode(inputFile, false);
            } catch (streamError: any) {
                console.error(`Stream upload also failed:`, streamError.message);
                // Complete fallback to text
                await ctx.reply(caption || "Media could not be loaded. Please try again.", { reply_markup });
                return;
            }
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
        console.error('Fatal Error sending media message:', error);
        await ctx.reply(caption, { reply_markup }).catch(()=>console.log("Fallback also failed."));
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
            if (menuButtons.length > 0 || settings?.vipActive || settings?.supportActive || settings?.chatActive) {
                const keyboard = new Keyboard().resized();
                
                // Add VIP, Support, and Giveaway buttons
                if (settings?.vipActive || settings?.supportActive || settings?.giveawayActive) {
                    if (settings?.vipActive) keyboard.text(settings.vipButtonText || "🌟 JOIN VIP");
                    if (settings?.giveawayActive) keyboard.text(settings.giveawayButtonText || "🎁 Giveaway Offer");
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
            const step = ctx.session?.step;
            console.log(`🤖 BOT LOGIC: Text: "${text}" | Current Step: "${step}"`);

            // --- 0. Ultra-Fast Path: State Machine Overrides ---
            // If user is actively filling out a form, handle it IMMEDIATELY without hitting DB for chat sessions
            if (step === 'name') {
                ctx.session.vipName = text;
                ctx.session.step = 'number';
                return await ctx.reply("✅ Naam mil gaya! Ab apna mobile number daalo:");
            }
            if (step === 'number') {
                ctx.session.vipNumber = text;
                ctx.session.step = 'interest';
                const keyboard = new InlineKeyboard().text("1. Cricket 🏏", "vip_interest_Cricket").text("2. Casino 🎰", "vip_interest_Casino").row().text("3. Both / Dono 🏏🎰", "vip_interest_Both");
                return await ctx.reply("Apna interest select karo:", { reply_markup: keyboard });
            }
            if (step === 'support_number') {
                ctx.session.supportNumber = text;
                ctx.session.step = 'support_id';
                return await ctx.reply(ctx.session.language === 'hi' ? "✅ Number mil gaya!\n\nAb apni Dafabet ID batao:" : "✅ Number received!\n\nPlease enter your Dafabet ID:");
            }
            if (step === 'support_id') {
                ctx.session.supportId = text;
                ctx.session.step = 'support_problem';
                return await ctx.reply(ctx.session.language === 'hi' ? "✅ ID mil gayi!\n\nAb batao aapko kya dikkat aa rahi hai (Yaha type karo):" : "✅ ID received!\n\nPlease describe your problem (Type here):");
            }
            if (step === 'support_problem') {
                ctx.session.supportProblem = text;
                ctx.session.step = 'support_review';
                const isHi = ctx.session.language === 'hi';
                const nameStr = `${ctx.from.first_name}${ctx.from.last_name ? ' ' + ctx.from.last_name : ''} (#${ctx.from.id})`;
                const summary = isHi 
                    ? `📝 *Aapki Details*\n\n📋 Issue: ${ctx.session.supportType}\n👤 Naam: ${nameStr}\n📞 Number: ${ctx.session.supportNumber}\n🆔 ID: ${ctx.session.supportId}\n❓ Problem: ${text}\n\nSubmit karne ke liye niche click karein!`
                    : `📝 *Support Request Summary*\n\n📋 Issue Type: ${ctx.session.supportType}\n👤 Name: ${nameStr}\n📞 Number: ${ctx.session.supportNumber}\n🆔 Dafabet ID: ${ctx.session.supportId}\n❓ Problem: ${text}\n\nClick below to submit!`;
                return await ctx.reply(summary, { parse_mode: "Markdown", reply_markup: new InlineKeyboard().text(isHi ? "✅ Submit Karein" : "✅ Submit Ticket", "support_submit") });
            }

            // --- 1. Memory/Redis Fetch (Ultra Fast) ---
            const settings = await getSettings();
            
            // --- 2. Check Static/Action Buttons ---
            const isLiveChatBtn = false; // Deprecated standalone feature
            const isVipBtn = settings?.vipActive && text === (settings.vipButtonText || "🌟 JOIN VIP");
            const isSupportBtn = settings?.supportActive && text === (settings.supportButtonText || "🆘 Help & Support");
            const isGiveawayBtn = settings?.giveawayActive && text === (settings.giveawayButtonText || "🎁 Giveaway Offer");
            const menuButton = await MainMenuButton.findOne({ text: text, active: true }); // Single Mongo Read
            const isMenuBtn = !!menuButton;
            const isAnyBotMenuButton = isLiveChatBtn || isVipBtn || isSupportBtn || isMenuBtn || isGiveawayBtn;

            // --- 0b. Giveaway Question Handlers ---
            if (ctx.session?.step?.toString().startsWith('giveaway_q_')) {
                const qIndex = parseInt(ctx.session.step.toString().split('_')[2]);
                const giveaway = await Giveaway.findById(ctx.session.currentGiveawayId);
                if (giveaway) {
                    const question = giveaway.questions[qIndex];
                    if (question) {
                        ctx.session.giveawayAnswers = ctx.session.giveawayAnswers || [];
                        ctx.session.giveawayAnswers.push({ question: question.question, answer: text });
                        
                        const nextIndex = qIndex + 1;
                        if (nextIndex < giveaway.questions.length) {
                            ctx.session.step = `giveaway_q_${nextIndex}` as any;
                            const nextQ = giveaway.questions[nextIndex];
                            if (nextQ.type === 'options') {
                                const keyboard = new InlineKeyboard();
                                nextQ.options.forEach((opt, i) => {
                                    keyboard.text(opt, `giveaway_opt_${i}`);
                                    if ((i + 1) % 2 === 0) keyboard.row();
                                });
                                return await ctx.reply(`❓ *Question ${nextIndex + 1}:*\n${nextQ.question}`, { reply_markup: keyboard, parse_mode: "Markdown" });
                            } else {
                                return await ctx.reply(`❓ *Question ${nextIndex + 1}:*\n${nextQ.question}`, { parse_mode: "Markdown" });
                            }
                        } else {
                            ctx.session.step = 'giveaway_name' as any;
                            return await ctx.reply("✅ All setup questions done!\n\nAb apna *Full Name* daalo:", { parse_mode: "Markdown" });
                        }
                    }
                }
            }

            if (ctx.session?.step === 'giveaway_name') {
                ctx.session.giveawayRealName = text;
                ctx.session.step = 'giveaway_id' as any;
                return await ctx.reply("✅ Naam mil gaya! Ab apni *Dafabet ID* daalo:", { parse_mode: "Markdown" });
            }

            if (ctx.session?.step === 'giveaway_id') {
                ctx.session.giveawayDafabetId = text;
                ctx.session.step = 'giveaway_review' as any;
                const summary = `🎁 *Giveaway Entry Summary*\n\n👤 Name: ${ctx.session.giveawayRealName}\n🆔 ID: ${text}\n\nClick below to submit!`;
                return await ctx.reply(summary, { parse_mode: "Markdown", reply_markup: new InlineKeyboard().text("✅ Submit Entries", "giveaway_submit") });
            }

            // --- End Chat Explicit Hook ---
            if (text === "❌ End Chat") {
                ctx.session.step = undefined;
                await ChatSession.findOneAndUpdate({ telegramId: ctx.from.id.toString(), status: 'active' }, { status: 'closed' });
                const menuButtons = await MainMenuButton.find({ active: true }).sort({ order: 1 });
                const keyboard = new Keyboard().resized();
                if (settings?.vipActive || settings?.supportActive) {
                    if (settings?.vipActive) keyboard.text(settings.vipButtonText || "🌟 JOIN VIP");
                    if (settings?.supportActive) keyboard.text(settings.supportButtonText || "🆘 Help & Support");
                    keyboard.row();
                }
                menuButtons.forEach((btn, idx) => { keyboard.text(btn.text); if ((idx + 1) % 2 === 0) keyboard.row(); });
                return await ctx.reply("✅ Chat ended. Returning to Main Menu.", { reply_markup: keyboard.resized() });
            }

            // --- 3. Async Chat Routing (Expensive DB Operations) ---
            // Only run if the user isn't clicking a predefined button to massively optimize menu speed
            if (!isAnyBotMenuButton) {
                const tgIdStr = ctx.from.id.toString();
                const msgId = ctx.message.message_id.toString();

                // 1. Check for Active Direct Terminal (ChatSession)
                const activeSession = await ChatSession.findOne({ telegramId: tgIdStr, status: 'active' });
                
                if (activeSession) {
                    try {
                        await ChatMessage.create({
                            sessionId: activeSession._id,
                            sender: 'user',
                            content: text,
                            messageType: 'text',
                            telegramMessageId: msgId
                        });
                        
                        await ChatSession.updateOne(
                            { _id: activeSession._id },
                            { $set: { updatedAt: new Date() } }
                        );
                        
                        await cache.del('chat_sessions_admin');
                        return; // Successfully routed to direct terminal
                    } catch (err: any) {
                        if (err.code === 11000) return; // Duplicate message, ignore
                        console.error("Error saving terminal message:", err);
                    }
                }

                // 2. Check for Open Support Ticket
                const openTicket = await SupportTicket.findOne({ telegramId: tgIdStr, status: 'open' });

                if (openTicket) {
                    try {
                        await ChatMessage.create({ 
                            ticketId: openTicket._id, 
                            sender: 'user', 
                            content: text, 
                            messageType: 'text',
                            telegramMessageId: msgId
                        });

                        await SupportTicket.updateOne(
                            { _id: openTicket._id },
                            { 
                                $inc: { unreadCount: 1 },
                                $set: { updatedAt: new Date() }
                            }
                        );
                        return; // Successfully routed to ticket
                    } catch (err: any) {
                        if (err.code === 11000) return;
                        console.error("Error saving ticket message:", err);
                    }
                }
            } else {
                // If they explicitly clicked a button, instantly break them out of chat
                if (ctx.session?.step === 'chatting') ctx.session.step = undefined;
            }

            // --- 4. Process Menu Button Main Interactions ---
            if (isGiveawayBtn) {
                const giveaway = await Giveaway.findOne({ active: true }).sort({ createdAt: -1 });
                if (!giveaway) {
                    return await ctx.reply("Currently no active giveaways. Check back later! / अभी कोई सक्रिय गिवअवे नहीं है। बाद में चेक करें!");
                }
                const existing = await GiveawaySubmission.findOne({ telegramId: ctx.from.id.toString(), giveawayId: giveaway._id });
                if (existing) {
                    return await ctx.reply("You have already entered this giveaway! / आप पहले ही इस गिवअवे में शामिल हो चुके हैं!");
                }

                ctx.session.currentGiveawayId = giveaway._id.toString();
                ctx.session.giveawayAnswers = [];
                
                if (giveaway.mediaUrl) {
                    await sendMediaMessage(ctx, giveaway.mediaUrl, `🎁 *${giveaway.title}*\n\n${giveaway.description}\n\nLet's start!`, undefined, giveaway.mediaType);
                } else {
                    await ctx.reply(`🎁 *${giveaway.title}*\n\n${giveaway.description}\n\nLet's start!`, { parse_mode: "Markdown" });
                }
                
                // Show first question
                if (giveaway.questions.length > 0) {
                    ctx.session.step = 'giveaway_q_0';
                    const q = giveaway.questions[0];
                    if (q.type === 'options') {
                        const keyboard = new InlineKeyboard();
                        q.options.forEach((opt, i) => {
                            keyboard.text(opt, `giveaway_opt_${i}`);
                            if ((i + 1) % 2 === 0) keyboard.row();
                        });
                        return await ctx.reply(`❓ *Question 1:*\n${q.question}`, { reply_markup: keyboard, parse_mode: "Markdown" });
                    } else {
                        return await ctx.reply(`❓ *Question 1:*\n${q.question}`, { parse_mode: "Markdown" });
                    }
                } else {
                    ctx.session.step = 'giveaway_name';
                    return await ctx.reply("Please enter your *Full Name* to join:", { parse_mode: "Markdown" });
                }
            }

            if (isSupportBtn) {
                console.log(`🆘 Help & Support Button Clicked by User ${ctx.from.id}`);
                ctx.session.step = 'support_lang';
                return await ctx.reply("Apni language select karo:", { 
                    reply_markup: new InlineKeyboard().text("English 🇺🇸", "support_lang_en").text("Hindi 🇮🇳", "support_lang_hi") 
                });
            }

            if (isVipBtn) {
                console.log(`🌟 VIP Button Clicked by User ${ctx.from.id}`);
                const existingMember = await VipMember.findOne({ telegramId: ctx.from.id.toString() });
                if (existingMember) {
                    const channelLink = settings?.vipChannelLink || "";
                    return await ctx.reply("✅ Aap pehle se hi VIP member hain!\n\nJoin karne ke liye niche click karein:", { 
                        reply_markup: channelLink ? new InlineKeyboard().url("🚀 Join VIP Channel", channelLink) : undefined 
                    });
                }
                await ctx.reply(settings?.vipWelcomeMessage || "VIP Registration me aapka swagat hai!");
                ctx.session.step = 'name';
                return await ctx.reply("Apna full name batayein:");
            }

            if (menuButton) {
                const buttons = menuButton.responseButtons || [];
                const inlineKeyboard = buttons.length > 0 
                    ? { inline_keyboard: buttons.map((btn: any) => [{ text: btn.text, url: btn.url }]) } 
                    : undefined;

                if (menuButton.mediaUrl) {
                    await sendMediaMessage(ctx, menuButton.mediaUrl, menuButton.responseMessage || "", inlineKeyboard as any, menuButton.mediaType);
                } else {
                    await ctx.reply(menuButton.responseMessage || `Selected: ${text}`, { reply_markup: inlineKeyboard as any, parse_mode: "Markdown" });
                }
            }

        } catch (error) {
            console.error("Error handling text message:", error);
        }
    });

    // 5a. Handle Media Messages from User (Live Chat)
    bot.on(["message:photo", "message:video", "message:audio", "message:voice", "message:document"], async (ctx) => {
        try {
            const tgIdStr = ctx.from.id.toString();
            const msgId = ctx.message.message_id.toString();

            // Check if either an active session or an open ticket exists
            const activeSession = await ChatSession.findOne({ telegramId: tgIdStr, status: 'active' });
            const openTicket = await SupportTicket.findOne({ telegramId: tgIdStr, status: 'open' });

            if (activeSession || openTicket) {
                const msg = ctx.message as any;
                let fileId = "";
                let msgType: any = "photo";

                if (msg.photo) {
                    fileId = msg.photo[msg.photo.length - 1].file_id;
                    msgType = "photo";
                } else if (msg.video) {
                    fileId = msg.video.file_id;
                    msgType = "video";
                } else if (msg.audio) {
                    fileId = msg.audio.file_id;
                    msgType = "audio";
                } else if (msg.voice) {
                    fileId = msg.voice.file_id;
                    msgType = "voice";
                } else if (msg.document) {
                    fileId = msg.document.file_id;
                    msgType = "document";
                }

                if (!fileId) return;

                const file = await ctx.api.getFile(fileId);
                const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;

                const uploadRes = await cloudinary.uploader.upload(fileUrl, {
                    folder: 'tgbot_uploads',
                    resource_type: 'auto'
                });
                
                const caption = msg.caption || '';
                
                try {
                    const messageData = {
                        sessionId: activeSession?._id,
                        ticketId: openTicket?._id,
                        sender: 'user',
                        content: caption,
                        messageType: msgType,
                        mediaUrl: uploadRes.secure_url,
                        telegramMessageId: msgId
                    };

                    await ChatMessage.create(messageData);

                    if (activeSession) {
                        await ChatSession.updateOne({ _id: activeSession._id }, { $set: { updatedAt: new Date() } });
                        await cache.del('chat_sessions_admin');
                    }

                    if (openTicket) {
                        await SupportTicket.updateOne(
                            { _id: openTicket._id },
                            { 
                                $inc: { unreadCount: 1 },
                                $set: { updatedAt: new Date() }
                            }
                        );
                    }
                } catch (err: any) {
                    if (err.code === 11000) return; // Duplicate
                    console.error("Error saving media message:", err);
                }
            }
        } catch (error) {
            console.error("Error handling media message:", error);
        }
    });

    // 5b. Handle VIP Interest Selection (Callback Query)
    bot.callbackQuery(/^vip_interest_(.+)$/, async (ctx) => {
        const interest = ctx.match[1] as 'Cricket' | 'Casino' | 'Both';
        
        if (ctx.session.step !== 'interest') return await ctx.answerCallbackQuery("Expired session. Please start again.");

        await ctx.answerCallbackQuery(`Selected: ${interest}`); // Provide instant feedback UI
        
        ctx.session.vipInterest = interest;
        ctx.session.step = 'review';

        const name = ctx.session.vipName;
        const number = ctx.session.vipNumber;

        const summary = `📝 *Aapki Details*\n\n👤 Naam: ${name}\n📞 Number: ${number}\n🎯 Interest: ${interest}\n\nNiche button pe click karke submit karein aur VIP link payein!`;

        const keyboard = new InlineKeyboard().text("✅ Submit Karein", "vip_submit");

        await ctx.editMessageText(summary, {
            parse_mode: "Markdown",
            reply_markup: keyboard
        });
    });

    // 5c. Final VIP Submission
    bot.callbackQuery("vip_submit", async (ctx) => {
        if (ctx.session.step !== 'review') return await ctx.answerCallbackQuery("Invalid request.");

        // Provide instant UI response before doing slow DB work
        await ctx.answerCallbackQuery("Submitted! / जमा हो गया!");

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
            
            // Send final message with channel link
            const settings = await getSettings();
            const channelLink = settings?.vipChannelLink || "";

            const keyboard = channelLink ? new InlineKeyboard().url("🚀 Join VIP Channel Now / अभी VIP चैनल से जुड़ें", channelLink) : undefined;

            await ctx.editMessageText(`✅ Kaamyabi! Aapki details save ho gayi hain.\n\nAb niche button pe click karke VIP join kar lo:`, {
                reply_markup: keyboard
            });

        } catch (error) {
            console.error("Error saving VIP member:", error);
            await ctx.answerCallbackQuery("Error occurred. Please try again.");
        }
    });

    // 5d. Handle Support Language Selection
    bot.callbackQuery(/^support_lang_(.+)$/, async (ctx) => {
        const lang = ctx.match[1] as 'en' | 'hi';
        if (ctx.session.step !== 'support_lang') return await ctx.answerCallbackQuery("Expired session.");

        const isHi = lang === 'hi';
        await ctx.answerCallbackQuery(isHi ? "भाषा चुनी गई: हिंदी" : "Language selected: English"); // Instant UI Feedback

        ctx.session.language = lang;
        ctx.session.step = 'support_type';
        
        const msg = isHi ? "Aapko kis tarah ki dikkat aa rahi hai?" : "What issue are you facing?";
        
        const keyboard = new InlineKeyboard()
            .text("Withdrawal 💳", "support_type_Withdrawal")
            .text("Deposit 📥", "support_type_Deposit").row()
            .text("ID Issue 🆔", "support_type_ID")
            .text("Other ❓", "support_type_Other");

        await ctx.editMessageText(msg, { reply_markup: keyboard });
    });

    // 5e. Handle Support Type Selection
    bot.callbackQuery(/^support_type_(.+)$/, async (ctx) => {
        const type = ctx.match[1];
        if (ctx.session.step !== 'support_type') return await ctx.answerCallbackQuery("Expired session.");

        await ctx.answerCallbackQuery(`Selected: ${type}`); // Instant UI Feedback

        ctx.session.supportType = type;
        ctx.session.step = 'support_number';
        
        const isHi = ctx.session.language === 'hi';
        const msg = isHi 
            ? `✅ Issue Type: ${type}\n\nApna Mobile Number daalo:` 
            : `✅ Issue Type: ${type}\n\nPlease enter your Mobile Number:`;

        await ctx.editMessageText(msg);
    });

    // 5f. Final Support Ticket Submission
    bot.callbackQuery("support_submit", async (ctx) => {
        if (ctx.session.step !== 'support_review') return await ctx.answerCallbackQuery("Invalid request.");

        const isHi = ctx.session.language === 'hi';
        // Provide Instant UI response before DB commit
        await ctx.answerCallbackQuery(isHi ? "टिकट जमा हो गया!" : "Ticket submitted!");

        try {
            const { supportNumber, supportId, supportType, supportProblem, language } = ctx.session;
            const telegramId = ctx.from.id.toString();
            const name = `${ctx.from.first_name}${ctx.from.last_name ? ' ' + ctx.from.last_name : ''} (#${telegramId})`;

            // Upsert exactly one ticket per user, keeping old chat reference valid
            await SupportTicket.findOneAndUpdate(
                { telegramId },
                {
                    $set: {
                        name: name,
                        phoneNumber: supportNumber,
                        dafabetId: supportId,
                        issueType: supportType,
                        problem: supportProblem,
                        status: 'open',
                        unreadCount: 1,
                        updatedAt: new Date(),
                        createdAt: new Date()
                    }
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            // Clear Session
            ctx.session.step = undefined;
            ctx.session.supportNumber = undefined;
            ctx.session.supportId = undefined;
            ctx.session.supportProblem = undefined;
            ctx.session.supportType = undefined;
            // ctx.session.language = undefined; // Keep language for future if needed? User might prefer to keep it.

            const isHi = language === 'hi';
            const successMsg = isHi 
                ? "✅ Aapka ticket register ho gaya hai! 30 minute ke andar hamari team aapse connect karegi. Thank you!"
                : "✅ Your support ticket has been submitted. Our team will connect with you via call or WhatsApp within 30 minutes. Thank you!";
            
            await ctx.editMessageText(successMsg);

        } catch (error) {
            console.error("Error saving support ticket:", error);
            await ctx.answerCallbackQuery("Error occurred. Try again.");
        }
    });

    // 5g. Handle Giveaway Option Selection
    bot.callbackQuery(/^giveaway_opt_(\d+)$/, async (ctx) => {
        const optIndex = parseInt(ctx.match[1]);
        if (!ctx.session.step?.startsWith('giveaway_q_')) return await ctx.answerCallbackQuery("Expired session.");

        const qIndex = parseInt(ctx.session.step.split('_')[2]);
        const giveaway = await Giveaway.findById(ctx.session.currentGiveawayId);
        
        if (!giveaway) return await ctx.answerCallbackQuery("Giveaway not found.");
        const currentQ = giveaway.questions[qIndex];
        if (!currentQ) return await ctx.answerCallbackQuery("Question not found.");

        const answer = currentQ.options[optIndex];
        await ctx.answerCallbackQuery(`Selected: ${answer}`);

        ctx.session.giveawayAnswers = ctx.session.giveawayAnswers || [];
        ctx.session.giveawayAnswers.push({ question: currentQ.question, answer });

        const nextIndex = qIndex + 1;
        if (nextIndex < giveaway.questions.length) {
            ctx.session.step = `giveaway_q_${nextIndex}`;
            const nextQ = giveaway.questions[nextIndex];
            const msg = `❓ *Question ${nextIndex + 1}:*\n${nextQ.question}`;
            
            if (nextQ.type === 'options') {
                const keyboard = new InlineKeyboard();
                nextQ.options.forEach((opt, i) => {
                    keyboard.text(opt, `giveaway_opt_${i}`);
                    if ((i + 1) % 2 === 0) keyboard.row();
                });
                await ctx.editMessageText(msg, { reply_markup: keyboard, parse_mode: "Markdown" });
            } else {
                await ctx.editMessageText(msg, { parse_mode: "Markdown" });
            }
        } else {
            ctx.session.step = 'giveaway_name';
            await ctx.editMessageText("✅ Questions done! Now please enter your *Full Name*:", { parse_mode: "Markdown" });
        }
    });

    // 5h. Final Giveaway Submission
    bot.callbackQuery("giveaway_submit", async (ctx) => {
        if (ctx.session.step !== 'giveaway_review') return await ctx.answerCallbackQuery("Invalid request.");
        await ctx.answerCallbackQuery("Submitted!");

        try {
            const { giveawayRealName, giveawayDafabetId, giveawayAnswers, currentGiveawayId } = ctx.session;
            
            await GiveawaySubmission.create({
                giveawayId: currentGiveawayId,
                telegramId: ctx.from.id.toString(),
                firstName: ctx.from.first_name,
                lastName: ctx.from.last_name,
                username: ctx.from.username,
                realName: giveawayRealName,
                dafabetId: giveawayDafabetId,
                answers: giveawayAnswers
            });

            ctx.session.step = undefined;
            await ctx.editMessageText("✅ *Thank you!*\n\nAapki giveaway entry successfully submit ho gayi hai! Good luck! 🎉", { parse_mode: "Markdown" });
        } catch (error: any) {
            console.error("Error submitting giveaway:", error);
            if (error.code === 11000) {
                await ctx.editMessageText("❌ You have already submitted entries for this giveaway.");
            } else {
                await ctx.answerCallbackQuery("Error occurred.");
            }
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
