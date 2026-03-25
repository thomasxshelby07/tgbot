import { FastifyInstance, FastifyRequest } from 'fastify';
import { ChatSession } from '../models/ChatSession';
import { ChatMessage } from '../models/ChatMessage';
import { Settings } from '../models/Settings';
import { MainMenuButton } from '../models/MainMenuButton';
import { bot } from '../bot';

export const chatRoutes = async (fastify: FastifyInstance) => {
    // 1. Get List of Sessions (Active first, then recently closed)
    fastify.get('/api/chat/sessions', async (request, reply) => {
        try {
            const sessions = await ChatSession.find()
                .populate('userId', 'firstName lastName username')
                .lean()
                .sort({ status: 1, updatedAt: -1 })
                .limit(50); // Get top 50 sessions (active and recent)

            const populatedSessions = await Promise.all(sessions.map(async (s) => {
                const unreadCount = await ChatMessage.countDocuments({ sessionId: s._id, sender: 'user', isRead: false });
                return { ...s, unreadCount };
            }));

            return reply.send(populatedSessions);
        } catch (error) {
            console.error('Error fetching chat sessions:', error);
            return reply.status(500).send({ error: 'Failed to fetch sessions' });
        }
    });

    // 2. Get Messages for a Session
    fastify.get('/api/chat/sessions/:id/messages', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
        try {
            const { id } = request.params;
            const messages = await ChatMessage.find({ sessionId: id })
                .sort({ createdAt: 1 }); // Oldest first

            // Mark unread user messages as read since admin fetched them
            await ChatMessage.updateMany(
                { sessionId: id, sender: 'user', isRead: false },
                { $set: { isRead: true } }
            );

            return reply.send(messages);
        } catch (error) {
            console.error('Error fetching chat messages:', error);
            return reply.status(500).send({ error: 'Failed to fetch messages' });
        }
    });

    // 3. Send Message as Admin
    fastify.post('/api/chat/sessions/:id/messages', async (request: FastifyRequest<{ Params: { id: string }, Body: { content: string, action?: 'close' } }>, reply) => {
        try {
            const { id } = request.params;
            const { content, action } = request.body;

            const session = await ChatSession.findById(id);
            if (!session) {
                return reply.status(404).send({ error: 'Session not found' });
            }

            if (action && action === 'close') {
                session.status = 'closed';
                await session.save();
                
                // Notify user gracefully
                try {
                    const menuButtons = await MainMenuButton.find({ active: true }).sort({ order: 1 });
                    const settings = await Settings.findOne();
                    const keyboard = { keyboard: [] as any[], resize_keyboard: true };
                    
                    if (settings?.chatActive) {
                        keyboard.keyboard.push([{ text: settings.chatButtonText || "💬 Live Chat" }]);
                    }
                    
                    const row2 = [];
                    if (settings?.vipActive) row2.push({ text: settings.vipButtonText || "🌟 JOIN VIP" });
                    if (settings?.supportActive) row2.push({ text: settings.supportButtonText || "🆘 Help & Support" });
                    if (row2.length > 0) keyboard.keyboard.push(row2);
                    
                    let currentRow: any[] = [];
                    menuButtons.forEach((btn, idx) => {
                        currentRow.push({ text: btn.text });
                        if (currentRow.length === 2 || idx === menuButtons.length - 1) {
                            keyboard.keyboard.push(currentRow);
                            currentRow = [];
                        }
                    });

                    await bot.api.sendMessage(session.telegramId, "✅ The admin has ended the chat.", {
                        reply_markup: keyboard.keyboard.length > 0 ? keyboard : undefined
                    });
                } catch (e) {
                    console.error("Failed to notify user about chat end:", e);
                }

                return reply.send({ success: true, message: 'Chat closed' });
            }

            if (!content || content.trim() === '') {
                return reply.status(400).send({ error: 'Message content is required' });
            }

            // Save admin message to DB
            const newMessage = await ChatMessage.create({
                sessionId: session._id,
                sender: 'admin',
                content: content,
                messageType: 'text'
            });

            // Update session updatedAt
            session.updatedAt = new Date();
            await session.save();

            // Send message back to Telegram User
            try {
                await bot.api.sendMessage(session.telegramId, `👨‍💻 *Admin:*\n${content}`, { 
                    parse_mode: "Markdown",
                    reply_markup: {
                        keyboard: [[{ text: "❌ End Chat" }]],
                        resize_keyboard: true
                    }
                });
            } catch (tgError) {
                console.error(`Failed to send message to Telegram User ${session.telegramId}:`, tgError);
                return reply.status(500).send({ error: 'Message saved but failed to deliver to Telegram' });
            }

            return reply.send(newMessage);
        } catch (error) {
            console.error('Error sending chat message:', error);
            return reply.status(500).send({ error: 'Failed to send message' });
        }
    });

    // 4. Start New Chat Session (Proactive Admin Message)
    fastify.post('/api/chat/sessions', async (request: FastifyRequest<{ Body: { telegramId: string; userId?: string } }>, reply) => {
        try {
            const { telegramId, userId } = request.body;
            if (!telegramId) return reply.status(400).send({ error: 'Telegram ID is required' });

            // Find any existing session and make it active, or create a new one
            let session = await ChatSession.findOneAndUpdate(
                { telegramId },
                { $set: { userId: userId || undefined, status: 'active', updatedAt: new Date() } },
                { new: true }
            );

            if (!session) {
                session = await ChatSession.create({
                    telegramId,
                    userId: userId || undefined,
                    status: 'active'
                });
            }

            // Re-fetch to populate
            const populatedSession = await ChatSession.findById(session._id).populate('userId', 'firstName lastName username');
            return reply.send(populatedSession);
        } catch (error) {
            console.error('Error creating chat session:', error);
            return reply.status(500).send({ error: 'Failed to create chat session' });
        }
    });

    // 5. Get Chat Settings
    fastify.get('/api/chat/settings', async (request, reply) => {
        try {
            const settings = await Settings.findOne();
            return reply.send({
                chatButtonText: settings?.chatButtonText || "💬 Live Chat",
                chatActive: settings?.chatActive ?? true
            });
        } catch (error) {
            console.error('Error fetching chat settings:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // 5. Update Chat Settings
    fastify.patch('/api/chat/settings', async (request: FastifyRequest<{ Body: { chatButtonText?: string; chatActive?: boolean } }>, reply) => {
        try {
            const { chatButtonText, chatActive } = request.body;
            const updated = await Settings.findOneAndUpdate(
                {},
                { chatButtonText, chatActive },
                { new: true, upsert: true }
            );

            // Invalidate cache
            const { cache } = require('../utils/cache');
            await cache.del('bot_settings');

            return reply.send(updated);
        } catch (error) {
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // 6. Delete Chat Session
    fastify.delete('/api/chat/sessions/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
        try {
            const { id } = request.params;
            await ChatSession.findByIdAndDelete(id);
            await ChatMessage.deleteMany({ sessionId: id });
            return reply.send({ success: true, message: 'Session deleted' });
        } catch (error) {
            console.error('Error deleting chat session:', error);
            return reply.status(500).send({ error: 'Failed to delete session' });
        }
    });

};
